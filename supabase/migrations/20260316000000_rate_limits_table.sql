-- Rate limits table for per-user endpoint rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  UNIQUE (user_id, endpoint)
);

-- Index for fast lookups by user + endpoint
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON public.rate_limits (user_id, endpoint);

-- RLS: only service role can access (edge functions use service role client)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Periodic cleanup: delete stale records older than 24 hours (run via pg_cron or manual)
-- This is a helper function, not auto-scheduled — call via: SELECT cleanup_stale_rate_limits();
CREATE OR REPLACE FUNCTION public.cleanup_stale_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '24 hours';
$$;
