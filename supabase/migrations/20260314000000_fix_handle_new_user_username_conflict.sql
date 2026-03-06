-- =====================================================
-- Migration: Fix handle_new_user username conflict + username availability RPC
-- Date: 2026-03-14
-- Description:
--   1. Create is_username_available() RPC for pre-signup validation
--   2. Fix handle_new_user() trigger to handle username unique_violation
--      by retrying with NULL username instead of failing silently
-- =====================================================

-- ==================
-- 1. USERNAME AVAILABILITY RPC
-- ==================
CREATE OR REPLACE FUNCTION public.is_username_available(p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE username = p_username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_username_available TO anon, authenticated;

-- ==================
-- 2. FIX handle_new_user TRIGGER
-- ==================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_username TEXT;
  v_date_of_birth DATE;
  v_time_of_birth TIME;
  v_role TEXT;
BEGIN
  -- Safely extract full name
  v_full_name := COALESCE(
    NULLIF(TRIM(
      COALESCE(NEW.raw_user_meta_data->>'firstName', '') || ' ' ||
      COALESCE(NEW.raw_user_meta_data->>'lastName', '')
    ), ''),
    NEW.email
  );

  -- Safely extract username
  v_username := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'username', '')), '');

  -- Safely cast date of birth (returns NULL on invalid format)
  BEGIN
    v_date_of_birth := NULLIF(NEW.raw_user_meta_data->>'dateOfBirth', '')::DATE;
  EXCEPTION WHEN OTHERS THEN
    v_date_of_birth := NULL;
  END;

  -- Safely cast time of birth (returns NULL on invalid format)
  BEGIN
    v_time_of_birth := NULLIF(NEW.raw_user_meta_data->>'timeOfBirth', '')::TIME;
  EXCEPTION WHEN OTHERS THEN
    v_time_of_birth := NULL;
  END;

  -- Safely determine role
  BEGIN
    IF (NEW.raw_user_meta_data->>'isAdvisor')::boolean = true THEN
      v_role := 'advisor';
    ELSE
      v_role := 'client';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'client';
  END;

  -- Insert profile (first attempt with username)
  BEGIN
    INSERT INTO public.profiles (
      id, email, full_name, username, date_of_birth, time_of_birth,
      role, credits, avatar_url, created_at, updated_at
    )
    VALUES (
      NEW.id, NEW.email, v_full_name, v_username, v_date_of_birth,
      v_time_of_birth, v_role, 0, NULL, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      username = COALESCE(EXCLUDED.username, public.profiles.username),
      updated_at = NOW();
  EXCEPTION WHEN unique_violation THEN
    -- Username conflict — retry without username so the profile is still created
    INSERT INTO public.profiles (
      id, email, full_name, username, date_of_birth, time_of_birth,
      role, credits, avatar_url, created_at, updated_at
    )
    VALUES (
      NEW.id, NEW.email, v_full_name, NULL, v_date_of_birth,
      v_time_of_birth, v_role, 0, NULL, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      updated_at = NOW();
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Last resort: log the error but don't prevent user creation
  RAISE WARNING '[handle_new_user] Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- MIGRATION COMPLETE
-- ==================
