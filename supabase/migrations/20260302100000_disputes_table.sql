-- Disputes table for admin dispute resolution and refunds

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) NOT NULL,
  client_id UUID REFERENCES public.profiles(id) NOT NULL,
  advisor_id UUID REFERENCES public.profiles(id) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'rejected')),
  resolution TEXT,
  refund_amount_cents INTEGER DEFAULT 0,
  admin_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with disputes
CREATE POLICY "Admins manage disputes"
  ON public.disputes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can view their own disputes
CREATE POLICY "Users view own disputes"
  ON public.disputes FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = advisor_id);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_disputes_session_id ON public.disputes(session_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
