-- Fix remaining recursive RLS policies that were missed by 20260225000000_fix_admin_rls_recursion.sql
-- Also add deduct_ai_credits RPC for the AI twin chat flow.

-- ============================================================
-- 1. Drop recursive SELECT policy on profiles
-- ============================================================
-- "Admins can view all profiles" uses an inline subquery on the profiles table itself,
-- causing infinite recursion during policy evaluation. It's redundant because
-- "Authenticated users can view profiles" already covers SELECT for all auth users.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- ============================================================
-- 2. Fix advisor_details UPDATE policy
-- ============================================================
-- The initial migration created "Advisors or admins can update advisor details" with
-- auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') which can
-- trigger the same recursion indirectly. Replace with is_admin() helper.
DROP POLICY IF EXISTS "Advisors or admins can update advisor details" ON public.advisor_details;
CREATE POLICY "Advisors or admins can update advisor details"
  ON public.advisor_details FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ============================================================
-- 3. Atomic credit deduction RPC for AI twin chat
-- ============================================================
-- Replaces the broken .update().gte() pattern in handle-ai-chat edge function.
-- Returns the new balance on success, or -1 if insufficient credits.
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

  RETURN v_new_balance;
END;
$$;
