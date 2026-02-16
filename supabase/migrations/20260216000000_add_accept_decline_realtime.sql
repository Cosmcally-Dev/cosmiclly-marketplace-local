-- =====================================================
-- Migration: Accept/Decline Session Flow + Realtime
-- Date: 2026-02-16
-- Description: Modify start_rtc_session to use 'pending' status,
--              add accept_session and decline_session RPCs,
--              enable Supabase Realtime on sessions and messages.
-- =====================================================

-- ==================
-- 1. MODIFY start_rtc_session TO USE 'pending' STATUS
-- ==================

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
    'pending',       -- Changed from 'active': session waits for advisor to accept
    p_rate_per_minute,
    p_free_minutes,
    NULL,            -- Changed from NOW(): started_at set when advisor accepts
    'pending',
    'good'
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- 2. NEW RPC: accept_session
-- ==================

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

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- 3. NEW RPC: decline_session
-- ==================

CREATE OR REPLACE FUNCTION public.decline_session(
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

  -- Either the client or the advisor can cancel a pending session
  IF v_session.advisor_id != auth.uid() AND v_session.client_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to decline this session';
  END IF;

  -- Decline: set status to cancelled
  UPDATE public.sessions
  SET
    status = 'cancelled',
    ended_at = NOW()
  WHERE id = p_session_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- 4. GRANT PERMISSIONS
-- ==================

GRANT EXECUTE ON FUNCTION public.accept_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_session TO authenticated;

-- ==================
-- 5. ENABLE SUPABASE REALTIME
-- ==================

-- Enable realtime for sessions table (for status change notifications)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
  END IF;
END $$;

-- Enable realtime for messages table (for chat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- ==================
-- 6. ADD INDEX FOR PENDING SESSIONS LOOKUP
-- ==================

CREATE INDEX IF NOT EXISTS idx_sessions_advisor_pending
  ON public.sessions(advisor_id, status)
  WHERE status = 'pending';

-- ==================
-- MIGRATION COMPLETE
-- ==================
