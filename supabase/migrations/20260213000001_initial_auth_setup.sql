-- =====================================================
-- Migration: Initial Auth & Profile Setup
-- Date: 2026-02-13
-- Description: Set up profiles table, RLS policies,
--              and auto-profile creation trigger
-- =====================================================

-- ==================
-- 1. CREATE TABLES (if not exists)
-- ==================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  username TEXT UNIQUE,
  date_of_birth DATE,
  time_of_birth TIME,
  avatar_url TEXT,
  credits INTEGER DEFAULT 0 NOT NULL,
  role TEXT DEFAULT 'client' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create advisor_details table
CREATE TABLE IF NOT EXISTS public.advisor_details (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  bio_short TEXT,
  bio_long TEXT,
  specialties TEXT[],
  years_experience INTEGER,
  price_per_minute DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2),
  free_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'offline',
  is_top_rated BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'chat',
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  cost_total DECIMAL(10, 2)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create advisor_applications table
CREATE TABLE IF NOT EXISTS public.advisor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialty TEXT NOT NULL,
  social_link TEXT,
  extra_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- ==================
-- 2. INDEXES
-- ==================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Advisor details indexes
CREATE INDEX IF NOT EXISTS idx_advisor_details_status ON public.advisor_details(status);
CREATE INDEX IF NOT EXISTS idx_advisor_details_is_top_rated ON public.advisor_details(is_top_rated);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON public.sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_advisor_id ON public.sessions(advisor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.sessions(started_at);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Advisor applications indexes
CREATE INDEX IF NOT EXISTS idx_advisor_applications_status ON public.advisor_applications(status);
CREATE INDEX IF NOT EXISTS idx_advisor_applications_email ON public.advisor_applications(email);

-- ==================
-- 3. TRIGGER: Auto-create profile on signup
-- ==================

-- Drop existing function if any
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Function to create profile when auth.users record is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    COALESCE(
      NEW.raw_user_meta_data->>'firstName' || ' ' || NEW.raw_user_meta_data->>'lastName',
      NEW.email
    ),
    NEW.raw_user_meta_data->>'username',
    (NEW.raw_user_meta_data->>'dateOfBirth')::DATE,
    (NEW.raw_user_meta_data->>'timeOfBirth')::TIME,
    CASE
      WHEN (NEW.raw_user_meta_data->>'isAdvisor')::boolean = true THEN 'advisor'
      ELSE 'client'
    END,
    0, -- Start with 0 credits
    NULL, -- No avatar initially
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_applications ENABLE ROW LEVEL SECURITY;

-- ==================
-- PROFILES TABLE POLICIES
-- ==================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view advisor profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Authenticated users can view each other's profiles
-- (needed for chat/session features)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- ==================
-- ADVISOR_DETAILS TABLE POLICIES
-- ==================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Advisors can manage own details" ON public.advisor_details;
DROP POLICY IF EXISTS "Public can view active advisors" ON public.advisor_details;

-- Policy: Advisors can view and update their own details
CREATE POLICY "Advisors can manage own details"
  ON public.advisor_details FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Public can view active advisor details (for listing pages)
CREATE POLICY "Public can view active advisors"
  ON public.advisor_details FOR SELECT
  USING (status = 'active' OR status = 'online');

-- ==================
-- SESSIONS TABLE POLICIES
-- ==================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Clients can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;

-- Policy: Users can view sessions where they are client or advisor
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = advisor_id);

-- Policy: Clients can create new sessions
CREATE POLICY "Clients can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Policy: Users can update sessions they are part of
CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = advisor_id)
  WITH CHECK (auth.uid() = client_id OR auth.uid() = advisor_id);

-- ==================
-- MESSAGES TABLE POLICIES
-- ==================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view session messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Policy: Users can view messages from sessions they are part of
CREATE POLICY "Users can view session messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = messages.session_id
      AND (sessions.client_id = auth.uid() OR sessions.advisor_id = auth.uid())
    )
  );

-- Policy: Users can insert messages in sessions they are part of
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = messages.session_id
      AND (sessions.client_id = auth.uid() OR sessions.advisor_id = auth.uid())
    )
  );

-- ==================
-- ADVISOR_APPLICATIONS TABLE POLICIES
-- ==================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can submit advisor application" ON public.advisor_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.advisor_applications;

-- Policy: Allow inserts from public (anyone can apply)
CREATE POLICY "Anyone can submit advisor application"
  ON public.advisor_applications FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON public.advisor_applications FOR SELECT
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- ==================
-- 5. FUNCTIONS FOR BUSINESS LOGIC
-- ==================

-- Function: Deduct credits from user account
CREATE OR REPLACE FUNCTION public.deduct_credits(
  user_id UUID,
  amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = user_id;

  -- Check if sufficient credits
  IF current_credits < amount THEN
    RETURN false;
  END IF;

  -- Deduct credits
  UPDATE public.profiles
  SET credits = credits - amount,
      updated_at = NOW()
  WHERE id = user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add credits to user account
CREATE OR REPLACE FUNCTION public.add_credits(
  user_id UUID,
  amount INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits + amount,
      updated_at = NOW()
  WHERE id = user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- 6. UPDATED_AT TRIGGER
-- ==================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to advisor_details table
DROP TRIGGER IF EXISTS update_advisor_details_updated_at ON public.advisor_details;
CREATE TRIGGER update_advisor_details_updated_at
  BEFORE UPDATE ON public.advisor_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==================
-- 7. GRANT PERMISSIONS
-- ==================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits TO authenticated;

-- ==================
-- MIGRATION COMPLETE
-- ==================

COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users';
COMMENT ON TABLE public.advisor_details IS 'Extended details for advisor profiles';
COMMENT ON TABLE public.sessions IS 'Chat, audio, and video sessions between clients and advisors';
COMMENT ON TABLE public.messages IS 'Messages within sessions';
COMMENT ON TABLE public.advisor_applications IS 'Applications from users wanting to become advisors';
