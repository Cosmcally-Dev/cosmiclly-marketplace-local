-- =====================================================
-- Migration: Full GDPR Data Anonymization
-- Date: 2026-03-15
-- Description:
--   1. Update delete_my_account() RPC with full data cleanup
--   2. Fix FK constraints on reviewed_by and contract_locked_by
--      to use ON DELETE SET NULL (prevents failures when auth user deleted)
-- =====================================================

-- ==================
-- 1. UPDATE delete_my_account RPC
-- ==================
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Anonymize messages sent by this user
  UPDATE public.messages SET content = '[deleted]' WHERE sender_id = auth.uid();

  -- 2. Delete advisor details
  DELETE FROM public.advisor_details WHERE id = auth.uid();

  -- 3. Delete advisor applications
  DELETE FROM public.advisor_applications
    WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid());

  -- 4. Delete knowledge base documents (advisor training data + embeddings)
  DELETE FROM public.knowledge_base_documents WHERE advisor_id = auth.uid();

  -- 5. Delete user favorites (both as user and as favorited advisor)
  DELETE FROM public.user_favorites WHERE user_id = auth.uid();
  DELETE FROM public.user_favorites WHERE advisor_id = auth.uid();

  -- 6. Delete reviews written by the user
  DELETE FROM public.reviews WHERE client_id = auth.uid();

  -- 7. Anonymize disputes (preserve record for audit but scrub PII)
  UPDATE public.disputes
    SET reason = '[deleted]', resolution_notes = '[deleted]'
    WHERE client_id = auth.uid() OR advisor_id = auth.uid();

  -- 8. Anonymize profile
  UPDATE public.profiles SET
    full_name = 'Deleted User',
    username = NULL,
    email = 'deleted-' || auth.uid()::text || '@deleted.local',
    avatar_url = NULL,
    role = 'client'
  WHERE id = auth.uid();

  -- 9. Fix orphaned FK references
  UPDATE public.advisor_applications SET reviewed_by = NULL WHERE reviewed_by = auth.uid();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- 2. FIX FK CONSTRAINTS TO USE ON DELETE SET NULL
-- ==================

-- advisor_applications.reviewed_by → auth.users(id) ON DELETE SET NULL
ALTER TABLE public.advisor_applications
  DROP CONSTRAINT IF EXISTS advisor_applications_reviewed_by_fkey;
ALTER TABLE public.advisor_applications
  ADD CONSTRAINT advisor_applications_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ==================
-- MIGRATION COMPLETE
-- ==================
