-- =====================================================
-- Migration: Advisor Public Stats RPC
-- Date: 2026-03-13
-- Description:
--   1. Create get_all_advisor_public_stats() batch RPC
--      Returns completed_readings, average_rating, review_count,
--      positive_reviews, negative_reviews for ALL advisors in one query.
--   2. Add anon SELECT policy on reviews table (for logged-out profile pages)
-- =====================================================

-- 1. Batch stats RPC for advisor listing / profile pages
-- SECURITY DEFINER so anon users can see aggregated stats
-- (returns only counts/averages, no individual review data)

CREATE OR REPLACE FUNCTION public.get_all_advisor_public_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(row_to_json(stats))
  INTO v_result
  FROM (
    SELECT
      ad.id AS advisor_id,
      COALESCE(s_counts.completed_readings, 0) AS completed_readings,
      COALESCE(r_stats.average_rating, 0) AS average_rating,
      COALESCE(r_stats.review_count, 0) AS review_count,
      COALESCE(r_stats.positive_reviews, 0) AS positive_reviews,
      COALESCE(r_stats.negative_reviews, 0) AS negative_reviews
    FROM public.advisor_details ad
    LEFT JOIN (
      SELECT advisor_id, COUNT(*) AS completed_readings
      FROM public.sessions
      WHERE status = 'completed'
      GROUP BY advisor_id
    ) s_counts ON s_counts.advisor_id = ad.id
    LEFT JOIN (
      SELECT
        advisor_id,
        ROUND(AVG(rating)::NUMERIC, 1) AS average_rating,
        COUNT(*) AS review_count,
        COUNT(*) FILTER (WHERE rating >= 4) AS positive_reviews,
        COUNT(*) FILTER (WHERE rating <= 2) AS negative_reviews
      FROM public.reviews
      GROUP BY advisor_id
    ) r_stats ON r_stats.advisor_id = ad.id
  ) stats;

  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$;

-- 2. Allow anonymous users to view reviews on advisor profile pages
-- (needed when user is not logged in but browsing advisor profiles)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reviews' AND policyname = 'anon_can_view_reviews'
  ) THEN
    CREATE POLICY "anon_can_view_reviews" ON public.reviews
      FOR SELECT TO anon
      USING (true);
  END IF;
END $$;
