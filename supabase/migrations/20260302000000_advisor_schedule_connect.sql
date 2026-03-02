-- Add schedule, profile_complete, Stripe Connect, and commission columns to advisor_details

ALTER TABLE public.advisor_details
  ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.2000;

-- Ensure advisors can update their own details (may already exist — use IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'advisors_update_own_details' AND tablename = 'advisor_details'
  ) THEN
    CREATE POLICY advisors_update_own_details ON public.advisor_details
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END$$;

-- Ensure advisors can insert their own details row (for wizard upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'advisors_insert_own_details' AND tablename = 'advisor_details'
  ) THEN
    CREATE POLICY advisors_insert_own_details ON public.advisor_details
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END$$;

-- Drop existing functions first (return type may differ from previous version)
DROP FUNCTION IF EXISTS public.approve_advisor_application(UUID, TEXT);
DROP FUNCTION IF EXISTS public.approve_advisor_application(UUID);
DROP FUNCTION IF EXISTS public.reject_advisor_application(UUID, TEXT);
DROP FUNCTION IF EXISTS public.reject_advisor_application(UUID);

-- RPC: approve_advisor_application — creates advisor_details row and updates role
CREATE OR REPLACE FUNCTION public.approve_advisor_application(p_application_id UUID, p_admin_notes TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
  v_user_id UUID;
  v_full_name TEXT;
BEGIN
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
  SET status = 'approved', notes = COALESCE(p_admin_notes, notes)
  WHERE id = p_application_id;

  -- Update user role to advisor
  UPDATE public.profiles
  SET role = 'advisor'
  WHERE id = v_user_id;

  -- Create advisor_details row with profile_complete = false (wizard will complete it)
  INSERT INTO public.advisor_details (id, title, specialties, profile_complete)
  VALUES (v_user_id, v_full_name, ARRAY[]::TEXT[], false)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- RPC: reject_advisor_application
CREATE OR REPLACE FUNCTION public.reject_advisor_application(p_application_id UUID, p_admin_notes TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.advisor_applications
  SET status = 'rejected', notes = COALESCE(p_admin_notes, notes)
  WHERE id = p_application_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or not pending';
  END IF;
END;
$$;
