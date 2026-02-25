-- ==============================================
-- Fix: Admin RLS infinite recursion
-- Date: 2026-02-25
--
-- Problem: Admin policies on the `profiles` table used inline subqueries
-- like `auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')`.
-- PostgreSQL evaluates ALL RLS policies when accessing a table. The admin
-- SELECT policy on `profiles` caused infinite recursion because it queried
-- `profiles` from within a policy on `profiles`.
--
-- This also broke policies on OTHER tables (sessions, messages, etc.) whose
-- admin subqueries hit the recursive profiles policies.
--
-- Fix: Create a SECURITY DEFINER helper function `is_admin()` that bypasses
-- RLS, then use it in all admin policies instead of inline subqueries.
-- ==============================================

-- Step 1: Create SECURITY DEFINER helper (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 2: Drop the recursive policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Step 3: Recreate profiles admin UPDATE policy using is_admin()
-- (No admin SELECT policy needed — "Authenticated users can view profiles"
--  already grants SELECT to all authenticated users with USING(true))
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Step 4: Drop and recreate policies on other tables using is_admin()
DROP POLICY IF EXISTS "Admins can update applications" ON public.advisor_applications;
CREATE POLICY "Admins can update applications"
  ON public.advisor_applications FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions;
CREATE POLICY "Admins can view all sessions"
  ON public.sessions FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any session" ON public.sessions;
CREATE POLICY "Admins can update any session"
  ON public.sessions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert advisor_details" ON public.advisor_details;
CREATE POLICY "Admins can insert advisor_details"
  ON public.advisor_details FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (public.is_admin());
