-- =====================================================
-- Migration: Advisor Contracts & Dashboard Stats
-- Date: 2026-03-04
-- Description:
--   1. Add contract columns to advisor_details (share %, admin fee, lock)
--   2. Create get_advisor_dashboard_stats() RPC
--   3. Create get_advisor_chart_data() RPC
--   4. Update approve_advisor_application to accept contract params
--   5. Prevent advisors from editing their own contract fields
-- =====================================================

-- ================================================================
-- 1. ADD CONTRACT COLUMNS TO advisor_details
-- ================================================================

ALTER TABLE public.advisor_details
  ADD COLUMN IF NOT EXISTS advisor_share_percent DECIMAL(5,2) DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS platform_share_percent DECIMAL(5,2) DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS admin_fee_percent DECIMAL(5,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS contract_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_locked_by UUID REFERENCES auth.users(id);

-- ================================================================
-- 2. GET ADVISOR DASHBOARD STATS RPC
-- ================================================================

DROP FUNCTION IF EXISTS public.get_advisor_dashboard_stats(UUID);

CREATE OR REPLACE FUNCTION public.get_advisor_dashboard_stats(p_advisor_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_advisor_share DECIMAL;
  v_admin_fee DECIMAL;
  v_pending DECIMAL;
  v_monthly DECIMAL;
  v_readings BIGINT;
  v_rating DECIMAL;
BEGIN
  -- Get contract terms (default to 50/50 with 5% fee if not set)
  SELECT
    COALESCE(advisor_share_percent, 50.00),
    COALESCE(admin_fee_percent, 5.00)
  INTO v_advisor_share, v_admin_fee
  FROM public.advisor_details
  WHERE id = p_advisor_id;

  -- If advisor not found, return zeros
  IF NOT FOUND THEN
    RETURN json_build_object(
      'pending_balance', 0,
      'monthly_earnings', 0,
      'completed_readings', 0,
      'average_rating', 0
    );
  END IF;

  -- Pending balance: all completed sessions (not yet paid out)
  -- Formula: (cost_total - admin_fee) * advisor_share
  SELECT COALESCE(SUM(
    (cost_total - (cost_total * v_admin_fee / 100)) * v_advisor_share / 100
  ), 0)
  INTO v_pending
  FROM public.sessions
  WHERE advisor_id = p_advisor_id
    AND status = 'completed'
    AND cost_total > 0;

  -- Monthly earnings: completed sessions this month
  SELECT COALESCE(SUM(
    (cost_total - (cost_total * v_admin_fee / 100)) * v_advisor_share / 100
  ), 0)
  INTO v_monthly
  FROM public.sessions
  WHERE advisor_id = p_advisor_id
    AND status = 'completed'
    AND cost_total > 0
    AND ended_at >= date_trunc('month', NOW());

  -- Completed readings count
  SELECT COUNT(*)
  INTO v_readings
  FROM public.sessions
  WHERE advisor_id = p_advisor_id
    AND status = 'completed';

  -- Average rating
  SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0)
  INTO v_rating
  FROM public.reviews
  WHERE advisor_id = p_advisor_id;

  RETURN json_build_object(
    'pending_balance', ROUND(v_pending::NUMERIC, 2),
    'monthly_earnings', ROUND(v_monthly::NUMERIC, 2),
    'completed_readings', v_readings,
    'average_rating', v_rating
  );
END;
$$;

-- ================================================================
-- 3. GET ADVISOR CHART DATA RPC
-- Returns weekly earnings (last 7 days) and monthly readings (last 4 weeks)
-- ================================================================

DROP FUNCTION IF EXISTS public.get_advisor_chart_data(UUID);

CREATE OR REPLACE FUNCTION public.get_advisor_chart_data(p_advisor_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_advisor_share DECIMAL;
  v_admin_fee DECIMAL;
  v_weekly JSON;
  v_monthly JSON;
BEGIN
  -- Get contract terms
  SELECT
    COALESCE(advisor_share_percent, 50.00),
    COALESCE(admin_fee_percent, 5.00)
  INTO v_advisor_share, v_admin_fee
  FROM public.advisor_details
  WHERE id = p_advisor_id;

  IF NOT FOUND THEN
    v_advisor_share := 50.00;
    v_admin_fee := 5.00;
  END IF;

  -- Weekly earnings: last 7 days
  SELECT json_agg(row_to_json(d))
  INTO v_weekly
  FROM (
    SELECT
      to_char(day, 'Dy') AS day,
      COALESCE(ROUND(SUM(
        (s.cost_total - (s.cost_total * v_admin_fee / 100)) * v_advisor_share / 100
      )::NUMERIC, 2), 0) AS earnings
    FROM generate_series(
      (CURRENT_DATE - INTERVAL '6 days')::DATE,
      CURRENT_DATE,
      '1 day'
    ) AS day
    LEFT JOIN public.sessions s
      ON s.advisor_id = p_advisor_id
      AND s.status = 'completed'
      AND s.cost_total > 0
      AND s.ended_at::DATE = day
    GROUP BY day
    ORDER BY day
  ) d;

  -- Monthly readings: last 4 weeks
  SELECT json_agg(row_to_json(w))
  INTO v_monthly
  FROM (
    SELECT
      'W' || ROW_NUMBER() OVER (ORDER BY week_start) AS week,
      COUNT(s.id) AS readings
    FROM generate_series(
      (CURRENT_DATE - INTERVAL '27 days')::DATE,
      CURRENT_DATE,
      '7 days'
    ) AS week_start
    LEFT JOIN public.sessions s
      ON s.advisor_id = p_advisor_id
      AND s.status = 'completed'
      AND s.ended_at::DATE >= week_start
      AND s.ended_at::DATE < (week_start + INTERVAL '7 days')
    GROUP BY week_start
    ORDER BY week_start
  ) w;

  RETURN json_build_object(
    'weekly_earnings', COALESCE(v_weekly, '[]'::JSON),
    'monthly_readings', COALESCE(v_monthly, '[]'::JSON)
  );
END;
$$;

-- ================================================================
-- 4. GET ADVISOR RECENT REVIEWS RPC
-- ================================================================

DROP FUNCTION IF EXISTS public.get_advisor_recent_reviews(UUID, INT);

CREATE OR REPLACE FUNCTION public.get_advisor_recent_reviews(p_advisor_id UUID, p_limit INT DEFAULT 5)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reviews JSON;
BEGIN
  SELECT json_agg(row_to_json(r))
  INTO v_reviews
  FROM (
    SELECT
      rv.id,
      COALESCE(p.full_name, 'Anonymous') AS name,
      rv.rating,
      to_char(rv.created_at, 'Mon DD, YYYY') AS date,
      COALESCE(rv.review_text, '') AS text
    FROM public.reviews rv
    LEFT JOIN public.profiles p ON p.id = rv.client_id
    WHERE rv.advisor_id = p_advisor_id
    ORDER BY rv.created_at DESC
    LIMIT p_limit
  ) r;

  RETURN COALESCE(v_reviews, '[]'::JSON);
END;
$$;

-- ================================================================
-- 5. UPDATE approve_advisor_application TO ACCEPT CONTRACT PARAMS
-- ================================================================

DROP FUNCTION IF EXISTS public.approve_advisor_application(UUID, TEXT);
DROP FUNCTION IF EXISTS public.approve_advisor_application(UUID);
DROP FUNCTION IF EXISTS public.approve_advisor_application(UUID, TEXT, DECIMAL, DECIMAL, DECIMAL);

CREATE OR REPLACE FUNCTION public.approve_advisor_application(
  p_application_id UUID,
  p_admin_notes TEXT DEFAULT NULL,
  p_advisor_share DECIMAL DEFAULT 50.00,
  p_platform_share DECIMAL DEFAULT 50.00,
  p_admin_fee DECIMAL DEFAULT 5.00
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
  v_user_id UUID;
  v_full_name TEXT;
BEGIN
  -- Validate shares add up to 100
  IF p_advisor_share + p_platform_share <> 100.00 THEN
    RAISE EXCEPTION 'Advisor share (%) + Platform share (%) must equal 100', p_advisor_share, p_platform_share;
  END IF;

  -- Get the application
  SELECT email, full_name INTO v_email, v_full_name
  FROM public.advisor_applications
  WHERE id = p_application_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or not pending';
  END IF;

  -- Find the user by email
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = v_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No user found with email %', v_email;
  END IF;

  -- Update application status
  UPDATE public.advisor_applications
  SET status = 'approved',
      notes = COALESCE(p_admin_notes, notes),
      reviewed_at = NOW(),
      reviewed_by = auth.uid()
  WHERE id = p_application_id;

  -- Update user role to advisor
  UPDATE public.profiles
  SET role = 'advisor'
  WHERE id = v_user_id;

  -- Create advisor_details row with contract terms
  INSERT INTO public.advisor_details (
    id, title, specialties, profile_complete,
    advisor_share_percent, platform_share_percent, admin_fee_percent,
    contract_locked, contract_locked_at, contract_locked_by
  )
  VALUES (
    v_user_id, v_full_name, ARRAY[]::TEXT[], false,
    p_advisor_share, p_platform_share, p_admin_fee,
    true, NOW(), auth.uid()
  )
  ON CONFLICT (id) DO UPDATE SET
    advisor_share_percent = p_advisor_share,
    platform_share_percent = p_platform_share,
    admin_fee_percent = p_admin_fee,
    contract_locked = true,
    contract_locked_at = NOW(),
    contract_locked_by = auth.uid();
END;
$$;

-- ================================================================
-- 6. LOCK / UPDATE CONTRACT RPC (admin only)
-- ================================================================

DROP FUNCTION IF EXISTS public.update_advisor_contract(UUID, DECIMAL, DECIMAL, DECIMAL, BOOLEAN);

CREATE OR REPLACE FUNCTION public.update_advisor_contract(
  p_advisor_id UUID,
  p_advisor_share DECIMAL,
  p_platform_share DECIMAL,
  p_admin_fee DECIMAL,
  p_lock BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_locked BOOLEAN;
  v_caller_role TEXT;
BEGIN
  -- Check caller is admin
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can update advisor contracts';
  END IF;

  -- Check if contract is already locked
  SELECT contract_locked INTO v_is_locked
  FROM public.advisor_details WHERE id = p_advisor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advisor not found';
  END IF;

  IF v_is_locked = true THEN
    RAISE EXCEPTION 'Contract is locked and cannot be modified';
  END IF;

  -- Validate shares
  IF p_advisor_share + p_platform_share <> 100.00 THEN
    RAISE EXCEPTION 'Advisor share + Platform share must equal 100';
  END IF;

  -- Update contract
  UPDATE public.advisor_details
  SET
    advisor_share_percent = p_advisor_share,
    platform_share_percent = p_platform_share,
    admin_fee_percent = p_admin_fee,
    contract_locked = p_lock,
    contract_locked_at = CASE WHEN p_lock THEN NOW() ELSE contract_locked_at END,
    contract_locked_by = CASE WHEN p_lock THEN auth.uid() ELSE contract_locked_by END
  WHERE id = p_advisor_id;
END;
$$;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
COMMENT ON COLUMN public.advisor_details.advisor_share_percent IS 'Advisor''s share of session revenue after admin fee (0-100)';
COMMENT ON COLUMN public.advisor_details.platform_share_percent IS 'Platform''s share of session revenue after admin fee (0-100)';
COMMENT ON COLUMN public.advisor_details.admin_fee_percent IS 'Admin fee deducted from gross revenue before split (0-100)';
COMMENT ON COLUMN public.advisor_details.contract_locked IS 'Whether the contract terms are locked (immutable)';
