-- Migration: Add Storage RLS policies for training_docs bucket
-- Fixes 403 "new row violates row-level security policy" when advisors
-- upload voice samples or knowledge base documents.

-- Create training_docs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('training_docs', 'training_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Advisors can upload files to their own folder ({user_id}/...)
CREATE POLICY "Advisors upload own training docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'training_docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Advisors can update (upsert) their own files
CREATE POLICY "Advisors update own training docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'training_docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'training_docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Advisors can read their own files
CREATE POLICY "Advisors read own training docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'training_docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Advisors can delete their own files
CREATE POLICY "Advisors delete own training docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'training_docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
