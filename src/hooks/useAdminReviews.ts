import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminReview {
  id: string;
  advisor_id: string;
  client_id: string;
  rating: number;
  review_text: string | null;
  session_type: string | null;
  session_id: string | null;
  is_admin_created: boolean;
  reviewer_display_name: string | null;
  created_at: string;
  advisor_name: string;
  client_name: string;
}

export interface CreateReviewInput {
  advisor_id: string;
  rating: number;
  review_text?: string;
  reviewer_display_name: string;
  session_type?: string;
  created_at: string; // ISO string
}

export interface UpdateReviewInput {
  rating?: number;
  review_text?: string;
  reviewer_display_name?: string;
  session_type?: string;
  created_at?: string;
}

export function useAdminReviews(advisorFilter = 'all', sourceFilter = 'all') {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('reviews')
        .select(`
          id, advisor_id, client_id, rating, review_text, session_type,
          session_id, is_admin_created, reviewer_display_name, created_at,
          advisor:profiles!reviews_advisor_id_fkey(full_name),
          client:profiles!reviews_client_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (advisorFilter !== 'all') {
        query = query.eq('advisor_id', advisorFilter);
      }

      if (sourceFilter === 'admin') {
        query = query.eq('is_admin_created', true);
      } else if (sourceFilter === 'user') {
        query = query.eq('is_admin_created', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useAdminReviews] fetch error:', error.message);
        setReviews([]);
        return;
      }

      const mapped: AdminReview[] = (data || []).map((r: any) => ({
        id: r.id,
        advisor_id: r.advisor_id,
        client_id: r.client_id,
        rating: r.rating,
        review_text: r.review_text,
        session_type: r.session_type,
        session_id: r.session_id,
        is_admin_created: r.is_admin_created,
        reviewer_display_name: r.reviewer_display_name,
        created_at: r.created_at,
        advisor_name: r.advisor?.full_name || 'Unknown',
        client_name: r.reviewer_display_name || r.client?.full_name || 'Unknown',
      }));

      setReviews(mapped);
    } catch (err) {
      console.error('[useAdminReviews] error:', err);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [advisorFilter, sourceFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const createReview = async (input: CreateReviewInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('reviews').insert({
      advisor_id: input.advisor_id,
      client_id: user.id,
      rating: input.rating,
      review_text: input.review_text || null,
      reviewer_display_name: input.reviewer_display_name,
      session_type: input.session_type || null,
      session_id: null,
      is_admin_created: true,
      created_at: input.created_at,
    } as any);

    if (error) throw error;
    await fetchReviews();
  };

  const updateReview = async (reviewId: string, updates: UpdateReviewInput) => {
    const payload: Record<string, any> = {};
    if (updates.rating !== undefined) payload.rating = updates.rating;
    if (updates.review_text !== undefined) payload.review_text = updates.review_text || null;
    if (updates.reviewer_display_name !== undefined) payload.reviewer_display_name = updates.reviewer_display_name;
    if (updates.session_type !== undefined) payload.session_type = updates.session_type || null;
    if (updates.created_at !== undefined) payload.created_at = updates.created_at;

    const { error } = await supabase
      .from('reviews')
      .update(payload as any)
      .eq('id', reviewId);

    if (error) throw error;
    await fetchReviews();
  };

  const deleteReview = async (reviewId: string) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
    await fetchReviews();
  };

  return {
    reviews,
    isLoading,
    refetch: fetchReviews,
    createReview,
    updateReview,
    deleteReview,
  };
}
