-- =====================================================
-- Migration: Add RTC Session Fields
-- Date: 2026-02-14
-- Description: Extend sessions table with RTC-specific fields
--              for real-time communication tracking and billing
-- Story: 1.1 RTC Session Data Model
-- =====================================================

-- ==================
-- 1. CREATE ENUMS FOR TYPE-SAFETY
-- ==================

-- Create session_type enum (if not exists)
DO $$ BEGIN
  CREATE TYPE session_type AS ENUM ('chat', 'audio', 'video');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create session_status enum (if not exists)
DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create billing_status enum
DO $$ BEGIN
  CREATE TYPE billing_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create connection_quality enum
DO $$ BEGIN
  CREATE TYPE connection_quality AS ENUM ('excellent', 'good', 'poor', 'lost');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==================
-- 2. ADD NEW COLUMNS TO SESSIONS TABLE
-- ==================

-- Add RTC-specific columns
ALTER TABLE public.sessions
  -- Rate per minute for this session (captured at session start)
  ADD COLUMN IF NOT EXISTS rate_per_minute DECIMAL(10, 2),

  -- Billable minutes tracked (INTEGER for full minutes billed)
  ADD COLUMN IF NOT EXISTS billable_minutes INTEGER DEFAULT 0 NOT NULL,

  -- Free minutes applied to this session
  ADD COLUMN IF NOT EXISTS free_minutes_applied INTEGER DEFAULT 0 NOT NULL,

  -- Billing status tracking
  ADD COLUMN IF NOT EXISTS billing_status billing_status DEFAULT 'pending',

  -- Connection quality tracking
  ADD COLUMN IF NOT EXISTS connection_quality connection_quality DEFAULT 'good',

  -- Additional metadata (JSONB for flexible storage)
  ADD COLUMN IF NOT EXISTS session_metadata JSONB DEFAULT '{}'::jsonb,

  -- Last billing update timestamp
  ADD COLUMN IF NOT EXISTS last_billed_at TIMESTAMP WITH TIME ZONE;

-- ==================
-- 3. CONVERT EXISTING TEXT COLUMNS TO USE EXISTING ENUMS
-- ==================

-- The type and status columns need to reference the existing enums
-- from the previous migration (session_type and session_status)

-- Check if columns are already the correct type
DO $$
BEGIN
  -- Convert type column if it's still TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions'
    AND column_name = 'type'
    AND data_type = 'text'
  ) THEN
    -- Step 1: Add temporary column with enum type
    ALTER TABLE public.sessions ADD COLUMN type_new session_type DEFAULT 'chat';

    -- Step 2: Copy data with validation
    UPDATE public.sessions
    SET type_new = CASE
      WHEN type = 'chat' THEN 'chat'::session_type
      WHEN type = 'audio' THEN 'audio'::session_type
      WHEN type = 'video' THEN 'video'::session_type
      ELSE 'chat'::session_type
    END;

    -- Step 3: Drop old column
    ALTER TABLE public.sessions DROP COLUMN type;

    -- Step 4: Rename new column
    ALTER TABLE public.sessions RENAME COLUMN type_new TO type;

    -- Step 5: Set NOT NULL constraint
    ALTER TABLE public.sessions ALTER COLUMN type SET NOT NULL;
    ALTER TABLE public.sessions ALTER COLUMN type SET DEFAULT 'chat'::session_type;
  END IF;

  -- Convert status column if it's still TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions'
    AND column_name = 'status'
    AND data_type = 'text'
  ) THEN
    -- Step 1: Add temporary column with enum type
    ALTER TABLE public.sessions ADD COLUMN status_new session_status DEFAULT 'pending';

    -- Step 2: Copy data with validation
    UPDATE public.sessions
    SET status_new = CASE
      WHEN status = 'pending' THEN 'pending'::session_status
      WHEN status = 'active' THEN 'active'::session_status
      WHEN status = 'completed' THEN 'completed'::session_status
      WHEN status = 'cancelled' THEN 'cancelled'::session_status
      ELSE 'pending'::session_status
    END;

    -- Step 3: Drop old column
    ALTER TABLE public.sessions DROP COLUMN status;

    -- Step 4: Rename new column
    ALTER TABLE public.sessions RENAME COLUMN status_new TO status;

    -- Step 5: Set NOT NULL constraint
    ALTER TABLE public.sessions ALTER COLUMN status SET NOT NULL;
    ALTER TABLE public.sessions ALTER COLUMN status SET DEFAULT 'pending'::session_status;
  END IF;
END $$;

-- ==================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ==================

-- Index for billing queries
CREATE INDEX IF NOT EXISTS idx_sessions_billing_status
  ON public.sessions(billing_status);

-- Index for active sessions by status
CREATE INDEX IF NOT EXISTS idx_sessions_status_started_at
  ON public.sessions(status, started_at);

-- Index for connection quality monitoring (partial index on active only)
CREATE INDEX IF NOT EXISTS idx_sessions_connection_quality
  ON public.sessions(connection_quality)
  WHERE status = 'active';

-- Index for billing reconciliation
CREATE INDEX IF NOT EXISTS idx_sessions_last_billed_at
  ON public.sessions(last_billed_at)
  WHERE billing_status = 'pending' OR billing_status = 'processing';

-- ==================
-- 5. CREATE TRIGGER FOR AUTO-UPDATING BILLING
-- ==================

-- Function to auto-update billing status when session ends
CREATE OR REPLACE FUNCTION public.update_session_billing()
RETURNS TRIGGER AS $$
BEGIN
  -- When session status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Set ended_at if not already set
    IF NEW.ended_at IS NULL THEN
      NEW.ended_at = NOW();
    END IF;

    -- Auto-calculate billable_minutes if not set
    IF NEW.billable_minutes = 0 AND NEW.started_at IS NOT NULL THEN
      -- Calculate total minutes from start to end
      NEW.billable_minutes = GREATEST(
        0,
        EXTRACT(EPOCH FROM (COALESCE(NEW.ended_at, NOW()) - NEW.started_at))::INTEGER / 60
      );
    END IF;

    -- Auto-calculate cost_total if rate_per_minute is set
    IF NEW.rate_per_minute IS NOT NULL AND NEW.cost_total IS NULL THEN
      NEW.cost_total = (NEW.billable_minutes - NEW.free_minutes_applied) * NEW.rate_per_minute;
      NEW.cost_total = GREATEST(0, NEW.cost_total); -- Ensure non-negative
    END IF;

    -- Update billing status
    IF NEW.billing_status = 'pending' THEN
      NEW.billing_status = 'processing';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_session_billing ON public.sessions;
CREATE TRIGGER trigger_update_session_billing
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_billing();

-- ==================
-- 6. CREATE HELPER FUNCTIONS
-- ==================

-- Function to start a new RTC session
CREATE OR REPLACE FUNCTION public.start_rtc_session(
  p_client_id UUID,
  p_advisor_id UUID,
  p_type session_type,
  p_rate_per_minute DECIMAL,
  p_free_minutes INTEGER DEFAULT 0
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
    connection_quality
  ) VALUES (
    p_client_id,
    p_advisor_id,
    p_type,
    'active',
    p_rate_per_minute,
    p_free_minutes,
    NOW(),
    'pending',
    'good'
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end RTC session and finalize billing
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

  -- Deduct credits from client (only if cost > 0)
  IF v_credits_to_deduct > 0 THEN
    PERFORM public.deduct_credits(v_session.client_id, v_credits_to_deduct);
  END IF;

  -- Mark billing as completed
  UPDATE public.sessions
  SET billing_status = 'completed'
  WHERE id = p_session_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session billing status
CREATE OR REPLACE FUNCTION public.update_billing_status(
  p_session_id UUID,
  p_billing_status billing_status
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.sessions
  SET
    billing_status = p_billing_status,
    last_billed_at = NOW()
  WHERE id = p_session_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- 7. GRANT PERMISSIONS
-- ==================

GRANT EXECUTE ON FUNCTION public.start_rtc_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_rtc_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_billing_status TO authenticated;

-- ==================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ==================

COMMENT ON COLUMN public.sessions.rate_per_minute IS 'Rate per minute captured at session start (for billing consistency)';
COMMENT ON COLUMN public.sessions.billable_minutes IS 'Total billable minutes (excludes free minutes)';
COMMENT ON COLUMN public.sessions.free_minutes_applied IS 'Free minutes applied to this session';
COMMENT ON COLUMN public.sessions.billing_status IS 'Status of billing: pending, processing, completed, failed, refunded';
COMMENT ON COLUMN public.sessions.connection_quality IS 'Connection quality during session: excellent, good, poor, lost';
COMMENT ON COLUMN public.sessions.session_metadata IS 'JSON metadata for connection stats, quality metrics, etc.';
COMMENT ON COLUMN public.sessions.last_billed_at IS 'Timestamp of last billing update';

COMMENT ON FUNCTION public.start_rtc_session IS 'Creates a new active RTC session with billing parameters';
COMMENT ON FUNCTION public.end_rtc_session IS 'Ends an active session, calculates final billing, and deducts credits atomically';
COMMENT ON FUNCTION public.update_billing_status IS 'Updates the billing status of a session';

-- ==================
-- MIGRATION COMPLETE
-- ==================
