-- ==============================================
-- Migration: Billing Logic — Credits First, Free Minutes as Fallback
-- Date: 2026-02-27
--
-- Changes the billing model so that credits are consumed FIRST.
-- Free minutes only kick in after the user's credit balance is exhausted.
-- The client now sends only PAID minutes as p_billable_minutes;
-- free_minutes_applied is kept for record-keeping but no longer
-- subtracted from the cost calculation.
-- ==============================================

-- ==================
-- 1. UPDATE end_rtc_session — billable_minutes already reflects only paid minutes
-- ==================

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
  -- (free minutes are NOT included, so no subtraction needed)
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

  -- Only deduct credits if NO Stripe hold exists (backward compatible)
  -- When a Stripe hold exists, the capture-session-payment edge function
  -- handles charging the user and updating billing_status to 'completed'
  IF v_session.stripe_payment_intent_id IS NULL AND v_credits_to_deduct > 0 THEN
    PERFORM public.deduct_credits(v_session.client_id, v_credits_to_deduct);
    UPDATE public.sessions SET billing_status = 'completed' WHERE id = p_session_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
