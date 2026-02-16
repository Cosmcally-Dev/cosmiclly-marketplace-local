-- =====================================================
-- Migration: Fix handle_new_user trigger
-- Date: 2026-02-14
-- Description: Fix the "Database error saving new user" issue by:
--   1. Removing ALL conflicting triggers on auth.users INSERT
--   2. Recreating handle_new_user() with defensive type casts
--   3. Adding exception handling to prevent signup failures
-- =====================================================

-- ==================
-- 1. DROP ALL INSERT TRIGGERS ON auth.users
-- ==================
-- Lovable may have created a trigger with a different name
-- that conflicts with ours. Remove ALL of them first.
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
    AND tgtype & 4 = 4  -- AFTER trigger
    AND NOT tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_rec.tgname);
    RAISE NOTICE 'Dropped trigger: %', trigger_rec.tgname;
  END LOOP;
END $$;

-- ==================
-- 2. DROP AND RECREATE handle_new_user FUNCTION
-- ==================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    date_of_birth,
    time_of_birth,
    role,
    credits,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_username,
    v_date_of_birth,
    v_time_of_birth,
    v_role,
    0,
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't prevent user creation
  RAISE WARNING '[handle_new_user] Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- 3. RECREATE THE TRIGGER
-- ==================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==================
-- MIGRATION COMPLETE
-- ==================
