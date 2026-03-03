-- =====================================================
-- Migration: Twin AI Infrastructure
-- Date: 2026-03-03
-- Description: Enable pgvector, create knowledge_base_documents table,
--              add Twin AI columns to advisor_details and messages,
--              create AI session RPCs and vector search function
-- =====================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Add Twin AI columns to advisor_details
ALTER TABLE public.advisor_details
  ADD COLUMN IF NOT EXISTS twin_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS twin_text_rate_per_msg DECIMAL(10,2) DEFAULT 0.50,
  ADD COLUMN IF NOT EXISTS twin_voice_rate_per_min DECIMAL(10,2) DEFAULT 2.00,
  ADD COLUMN IF NOT EXISTS system_prompt TEXT,
  ADD COLUMN IF NOT EXISTS cartesia_voice_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS vapi_agent_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS voice_sample_url TEXT;

-- 3. Add is_ai_generated column to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

-- 4. Create knowledge_base_documents table
CREATE TABLE IF NOT EXISTS public.knowledge_base_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding extensions.vector(1536),
  source_filename VARCHAR(255),
  chunk_index INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding
  ON public.knowledge_base_documents
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 6. Create index on advisor_id for knowledge base lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_base_advisor_id
  ON public.knowledge_base_documents(advisor_id);

-- 7. RLS for knowledge_base_documents
ALTER TABLE public.knowledge_base_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advisors manage own knowledge base"
  ON public.knowledge_base_documents FOR ALL
  USING (auth.uid() = advisor_id)
  WITH CHECK (auth.uid() = advisor_id);

CREATE POLICY "Admins view all knowledge base"
  ON public.knowledge_base_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. RPC: start_ai_session — Creates an immediately-active AI session (no ringing)
CREATE OR REPLACE FUNCTION public.start_ai_session(
  p_client_id UUID,
  p_advisor_id UUID,
  p_type session_type DEFAULT 'chat',
  p_rate DECIMAL DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO public.sessions (
    client_id, advisor_id, type, status, rate_per_minute,
    free_minutes_applied, started_at, billing_status,
    connection_quality, session_metadata
  ) VALUES (
    p_client_id, p_advisor_id, p_type, 'active', p_rate,
    0, NOW(), 'pending', 'excellent', '{"ai": true}'::jsonb
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.start_ai_session TO authenticated;

-- 9. RPC: end_ai_session — Ends an AI session
CREATE OR REPLACE FUNCTION public.end_ai_session(
  p_session_id UUID,
  p_total_credits_used DECIMAL DEFAULT 0
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.sessions
  SET
    status = 'completed',
    ended_at = NOW(),
    cost_total = p_total_credits_used,
    billing_status = 'completed'
  WHERE id = p_session_id
  AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AI session not found or not active';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.end_ai_session TO authenticated;

-- 10. RPC: match_knowledge_base — Vector similarity search for RAG
CREATE OR REPLACE FUNCTION public.match_knowledge_base(
  p_advisor_id UUID,
  p_query_embedding extensions.vector(1536),
  p_match_count INTEGER DEFAULT 3,
  p_match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_filename VARCHAR,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kbd.id,
    kbd.content,
    kbd.source_filename,
    1 - (kbd.embedding <=> p_query_embedding) AS similarity
  FROM public.knowledge_base_documents kbd
  WHERE kbd.advisor_id = p_advisor_id
  AND 1 - (kbd.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY kbd.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.match_knowledge_base TO authenticated;
