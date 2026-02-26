-- Reviews table for session feedback
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  advisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  session_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Clients can insert their own reviews
CREATE POLICY "clients_insert_own_reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

-- Anyone can view reviews (public profile data)
CREATE POLICY "anyone_can_view_reviews" ON public.reviews
  FOR SELECT TO authenticated
  USING (true);

-- Clients can update their own reviews
CREATE POLICY "clients_update_own_reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid());

-- Prevent duplicate reviews per session
CREATE UNIQUE INDEX IF NOT EXISTS reviews_session_client_unique
  ON public.reviews(session_id, client_id);

-- Index for efficient advisor profile queries
CREATE INDEX IF NOT EXISTS reviews_advisor_id_idx ON public.reviews(advisor_id);
