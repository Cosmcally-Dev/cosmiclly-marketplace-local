-- Migration: Auto-set advisor status to 'busy' during active sessions
-- When an advisor accepts a session, their status becomes 'busy'.
-- When a session ends (or is declined while active), status reverts to 'online'
-- only if they have no other active sessions.

-- 1. Modify accept_session: set advisor status to 'busy' after accepting
CREATE OR REPLACE FUNCTION public.accept_session(
  p_session_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Get session and verify it's pending
  SELECT * INTO v_session
  FROM public.sessions
  WHERE id = p_session_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or not pending';
  END IF;

  -- Verify caller is the advisor for this session
  IF v_session.advisor_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to accept this session';
  END IF;

  -- Accept: set status to active, start the clock
  UPDATE public.sessions
  SET
    status = 'active',
    started_at = NOW()
  WHERE id = p_session_id;

  -- Set advisor status to 'busy'
  UPDATE public.advisor_details
  SET status = 'busy'
  WHERE id = v_session.advisor_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Modify end_rtc_session: revert advisor status to 'online' if no other active sessions
CREATE OR REPLACE FUNCTION public.end_rtc_session(
  p_session_id UUID,
  p_billable_minutes INTEGER,
  p_connection_quality connection_quality DEFAULT 'good'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_session RECORD;
  v_total_cost DECIMAL;
  v_credits_to_deduct INTEGER;
  v_other_active INTEGER;
BEGIN
  -- Get session details
  SELECT * INTO v_session
  FROM public.sessions
  WHERE id = p_session_id
  AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or not active';
  END IF;

  -- Calculate cost: p_billable_minutes now only includes paid minutes
  v_total_cost := GREATEST(0, p_billable_minutes * v_session.rate_per_minute);
  v_credits_to_deduct := CEIL(v_total_cost)::INTEGER;

  -- Update session
  UPDATE public.sessions
  SET
    status = 'completed',
    ended_at = NOW(),
    billable_minutes = p_billable_minutes,
    cost_total = v_total_cost,
    connection_quality = p_connection_quality,
    last_billed_at = NOW(),
    billing_status = 'processing'
  WHERE id = p_session_id;

  -- Only deduct credits if NO Stripe hold exists
  IF v_session.stripe_payment_intent_id IS NULL AND v_credits_to_deduct > 0 THEN
    PERFORM public.deduct_credits(v_session.client_id, v_credits_to_deduct);
    UPDATE public.sessions SET billing_status = 'completed' WHERE id = p_session_id;

    -- Log the session deduction as a transaction
    INSERT INTO public.transactions (user_id, type, credits, session_id, status, metadata)
    VALUES (
      v_session.client_id,
      'session_deduction',
      v_credits_to_deduct,
      p_session_id,
      'completed',
      jsonb_build_object(
        'description', 'Session credit deduction',
        'session_type', v_session.type::text,
        'billable_minutes', p_billable_minutes,
        'rate_per_minute', v_session.rate_per_minute
      )
    );
  END IF;

  -- Revert advisor status to 'online' if no other active sessions remain
  SELECT COUNT(*) INTO v_other_active
  FROM public.sessions
  WHERE advisor_id = v_session.advisor_id
    AND status = 'active'
    AND id != p_session_id;

  IF v_other_active = 0 THEN
    UPDATE public.advisor_details
    SET status = 'online'
    WHERE id = v_session.advisor_id
      AND status = 'busy';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
