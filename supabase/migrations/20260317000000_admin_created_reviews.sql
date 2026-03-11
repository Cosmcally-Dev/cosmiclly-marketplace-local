-- ================================================================
-- Admin-Created Reviews
-- Adds ability for admins to manually create/edit/delete reviews
-- with custom display names and backdated timestamps.
-- ================================================================

-- Step 1: Add columns to reviews table
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_admin_created BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewer_display_name TEXT;

-- Step 2: Admin RLS policies on reviews
CREATE POLICY "admins_insert_reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admins_update_reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "admins_delete_reviews" ON public.reviews
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Step 3: Update get_advisor_recent_reviews to prefer reviewer_display_name
DROP FUNCTION IF EXISTS public.get_advisor_recent_reviews(UUID, INT);

CREATE OR REPLACE FUNCTION public.get_advisor_recent_reviews(p_advisor_id UUID, p_limit INT DEFAULT 5)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reviews JSON;
BEGIN
  SELECT json_agg(row_to_json(r))
  INTO v_reviews
  FROM (
    SELECT
      rv.id,
      COALESCE(rv.reviewer_display_name, p.full_name, 'Anonymous') AS name,
      rv.rating,
      to_char(rv.created_at, 'Mon DD, YYYY') AS date,
      COALESCE(rv.review_text, '') AS text
    FROM public.reviews rv
    LEFT JOIN public.profiles p ON p.id = rv.client_id
    WHERE rv.advisor_id = p_advisor_id
    ORDER BY rv.created_at DESC
    LIMIT p_limit
  ) r;

  RETURN COALESCE(v_reviews, '[]'::JSON);
END;
$$;
