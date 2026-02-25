-- =====================================================
-- Migration: Milestone 3 (Chat Enhancements) & Milestone 4 (Admin Controls)
-- Date: 2026-02-24
-- =====================================================

-- ==================
-- MILESTONE 3: CHAT ENHANCEMENTS
-- ==================

-- Add read_at column to messages for read receipts
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

-- Allow users to UPDATE messages in their sessions (to mark read_at)
CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = messages.session_id
      AND (sessions.client_id = auth.uid() OR sessions.advisor_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = messages.session_id
      AND (sessions.client_id = auth.uid() OR sessions.advisor_id = auth.uid())
    )
  );

-- RPC: Anonymize user data (GDPR Right to be Forgotten)
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS BOOLEAN AS $$
BEGIN
  -- Anonymize messages sent by this user
  UPDATE public.messages SET content = '[deleted]' WHERE sender_id = auth.uid();

  -- Delete advisor details
  DELETE FROM public.advisor_details WHERE id = auth.uid();

  -- Delete advisor applications
  DELETE FROM public.advisor_applications
    WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid());

  -- Anonymize profile
  UPDATE public.profiles SET
    full_name = 'Deleted User',
    username = NULL,
    email = 'deleted-' || auth.uid()::text || '@deleted.local',
    avatar_url = NULL,
    role = 'client'
  WHERE id = auth.uid();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_my_account TO authenticated;

-- ==================
-- MILESTONE 4: ADMIN CONTROLS
-- ==================

-- Admin UPDATE on advisor_applications
CREATE POLICY "Admins can update applications"
  ON public.advisor_applications FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Admin SELECT all sessions
CREATE POLICY "Admins can view all sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Admin UPDATE any session (for dispute flagging)
CREATE POLICY "Admins can update any session"
  ON public.sessions FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Admin SELECT all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Admin UPDATE any profile (for role changes)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Admin INSERT advisor_details (for approval flow)
CREATE POLICY "Admins can insert advisor_details"
  ON public.advisor_details FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Admin SELECT all messages (for dispute review)
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- ==================
-- RPC: Approve advisor application (atomic)
-- ==================
CREATE OR REPLACE FUNCTION public.approve_advisor_application(
  p_application_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_app RECORD;
  v_profile RECORD;
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized: admin role required';
  END IF;

  -- Get the pending application
  SELECT * INTO v_app
  FROM public.advisor_applications
  WHERE id = p_application_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or not pending';
  END IF;

  -- Find the matching profile by email
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE email = v_app.email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No user profile found with email: %', v_app.email;
  END IF;

  -- Step 1: Update the application
  UPDATE public.advisor_applications
  SET status = 'approved', reviewed_at = NOW(), reviewed_by = auth.uid(), notes = p_notes
  WHERE id = p_application_id;

  -- Step 2: Update profile role to advisor
  UPDATE public.profiles
  SET role = 'advisor', full_name = COALESCE(NULLIF(v_profile.full_name, ''), v_app.full_name)
  WHERE id = v_profile.id;

  -- Step 3: Create advisor_details with defaults from application
  INSERT INTO public.advisor_details (id, title, bio_short, specialties, price_per_minute, free_minutes, status, is_top_rated)
  VALUES (
    v_profile.id,
    v_app.full_name,
    COALESCE(v_app.extra_info, 'Spiritual advisor on Cosmiclly'),
    string_to_array(v_app.specialty, ', '),
    3.50,
    3,
    'offline',
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- RPC: Reject advisor application
-- ==================
CREATE OR REPLACE FUNCTION public.reject_advisor_application(
  p_application_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized: admin role required';
  END IF;

  UPDATE public.advisor_applications
  SET status = 'rejected', reviewed_at = NOW(), reviewed_by = auth.uid(), notes = p_notes
  WHERE id = p_application_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or not pending';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- RPC: Dashboard stats for admin
-- ==================
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized: admin role required';
  END IF;

  RETURN (SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_advisors', (SELECT COUNT(*) FROM public.profiles WHERE role = 'advisor'),
    'total_sessions', (SELECT COUNT(*) FROM public.sessions),
    'active_sessions', (SELECT COUNT(*) FROM public.sessions WHERE status = 'active'),
    'completed_sessions', (SELECT COUNT(*) FROM public.sessions WHERE status = 'completed'),
    'total_revenue', (SELECT COALESCE(SUM(cost_total), 0) FROM public.sessions WHERE status = 'completed'),
    'pending_applications', (SELECT COUNT(*) FROM public.advisor_applications WHERE status = 'pending')
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.approve_advisor_application TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_advisor_application TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats TO authenticated;
