-- =====================================================
-- Migration: Add created_at to sessions + Fix advisor_details RLS
-- Date: 2026-03-07
-- Description:
--   1. Add created_at column to sessions table (for proper date display
--      on cancelled sessions that have started_at = NULL)
--   2. Fix advisor_details RLS policy so offline advisors remain visible
--      to public users (enables Realtime status updates)
-- =====================================================

-- 1. Add created_at to sessions (never null, for ordering/display)
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Fix advisor_details SELECT policy
-- The old policy only allowed viewing advisors with status='active' or status='online'.
-- Since status stores 'online'/'offline'/'busy' (not 'active'), offline advisors
-- were invisible to public users, breaking Realtime subscriptions and advisor listing.
DROP POLICY IF EXISTS "Public can view active advisors" ON public.advisor_details;
CREATE POLICY "Public can view advisor details"
  ON public.advisor_details FOR SELECT
  USING (true);
