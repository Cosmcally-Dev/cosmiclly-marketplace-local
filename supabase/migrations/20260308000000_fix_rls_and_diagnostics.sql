-- =====================================================
-- Migration: Fix RLS policies + GoTrue NULL column bug
-- Date: 2026-03-08
-- Description:
--   1. Replace inline EXISTS(SELECT FROM profiles) subqueries with
--      the is_admin() SECURITY DEFINER helper in disputes and
--      knowledge_base_documents policies.
--   2. Fix NULL string columns in auth.users for seeded dummy accounts.
--      GoTrue (Go) scans columns like email_change, phone, etc. as
--      Go `string` which cannot hold NULL — expects empty strings.
--      The seed migration left these as NULL, causing:
--      "Scan error on column index 8, name email_change: converting NULL to string is unsupported"
-- =====================================================

-- 1. Fix disputes table admin policy
DROP POLICY IF EXISTS "Admins manage disputes" ON public.disputes;
CREATE POLICY "Admins manage disputes"
  ON public.disputes FOR ALL
  USING (public.is_admin());

-- 2. Fix knowledge_base_documents admin policy
DROP POLICY IF EXISTS "Admins view all knowledge base" ON public.knowledge_base_documents;
CREATE POLICY "Admins view all knowledge base"
  ON public.knowledge_base_documents FOR SELECT
  USING (public.is_admin());

-- 3. Fix NULL string columns in auth.users for seeded dummy accounts
-- GoTrue (Go) scans these columns as Go `string`, which cannot be NULL.
-- The seed migration left them as NULL; GoTrue expects empty strings.
-- NOTE: `phone` is excluded because it has a UNIQUE constraint — multiple
-- empty strings would violate it. GoTrue handles NULL phone gracefully
-- since phone auth is optional.
UPDATE auth.users
SET
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE email LIKE '%cosmiclly.test%';
