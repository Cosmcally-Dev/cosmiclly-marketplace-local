-- ==============================================
-- Migration: Stripe Payment Integration (Milestone 2)
-- Date: 2026-02-25
--
-- Adds: stripe_customer_id on profiles, stripe_payment_intent_id on sessions,
--        transactions table, and updates RPCs for Auth & Capture flow.
-- ==============================================

-- ==================
-- 1. ADD STRIPE COLUMNS
-- ==================

-- Stripe Customer ID for payment method storage
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Stripe PaymentIntent ID on sessions (for Auth & Capture holds)
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- ==================
-- 2. TRANSACTIONS LEDGER
-- ==================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  credits INTEGER NOT NULL DEFAULT 0,
  stripe_payment_intent_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),
  session_id UUID REFERENCES public.sessions(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.is_admin());

-- ==================
-- 3. UPDATED start_rtc_session — accepts optional Stripe PaymentIntent ID
-- ==================

CREATE OR REPLACE FUNCTION public.start_rtc_session(
  p_client_id UUID,
  p_advisor_id UUID,
  p_type session_type,
  p_rate_per_minute DECIMAL,
  p_free_minutes INTEGER DEFAULT 0,
  p_stripe_payment_intent_id VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO public.sessions (
    client_id,
    advisor_id,
    type,
    status,
    rate_per_minute,
    free_minutes_applied,
    started_at,
    billing_status,
    connection_quality,
    stripe_payment_intent_id
  ) VALUES (
    p_client_id,
    p_advisor_id,
    p_type,
    'pending',
    p_rate_per_minute,
    p_free_minutes,
    NULL,
    'pending',
    'good',
    p_stripe_payment_intent_id
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- 4. UPDATED end_rtc_session — skip credit deduction when Stripe hold exists
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

  -- Calculate cost
  v_total_cost := GREATEST(0, (p_billable_minutes - v_session.free_minutes_applied) * v_session.rate_per_minute);
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
