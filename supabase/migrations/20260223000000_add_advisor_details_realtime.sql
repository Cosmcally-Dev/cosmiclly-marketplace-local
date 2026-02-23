-- Add advisor_details to Realtime publication for live status updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'advisor_details'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.advisor_details;
  END IF;
END $$;
