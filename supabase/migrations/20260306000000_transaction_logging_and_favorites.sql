-- Migration: Transaction logging for credit deductions + User favorites table
-- Date: 2026-03-06

-- ============================================================
-- 1. Update deduct_ai_credits to log transactions
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(
  p_client_id UUID,
  p_amount DECIMAL
) RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_client_id
    AND credits >= p_amount
  RETURNING credits INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  -- Log the deduction as a transaction
  INSERT INTO public.transactions (user_id, type, credits, status, metadata)
  VALUES (
    p_client_id,
    'ai_chat_deduction',
    p_amount,
    'completed',
    jsonb_build_object('description', 'AI chat message credit deduction')
  );

  RETURN v_new_balance;
END;
$$;

-- ============================================================
-- 2. Update end_rtc_session to log transactions
-- ============================================================
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

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. User favorites table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, advisor_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime for favorites
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_favorites;
