import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Advisor } from '@/data/advisors';

interface DBAdvisorRow {
  id: string;
  title: string;
  bio_short: string | null;
  bio_long: string | null;
  specialties: string[] | null;
  price_per_minute: number;
  discounted_price: number | null;
  free_minutes: number | null;
  years_experience: number | null;
  status: string | null;
  is_top_rated: boolean | null;
  twin_enabled: boolean | null;
  vapi_agent_id: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface AdvisorPublicStats {
  advisor_id: string;
  completed_readings: number;
  average_rating: number;
  review_count: number;
  positive_reviews: number;
  negative_reviews: number;
}

function mapDBToAdvisor(row: DBAdvisorRow, stats?: AdvisorPublicStats): Advisor {
  const currentYear = new Date().getFullYear();
  return {
    id: row.id, // UUID — also serves as dbId
    dbId: row.id,
    name: row.profiles?.full_name || row.title || 'Advisor',
    title: row.title || 'Spiritual Advisor',
    avatar: row.profiles?.avatar_url || `https://ui-avatars.com/api/?background=1a1a2e&color=06b6d4&bold=true&size=400&name=${encodeURIComponent(row.profiles?.full_name || row.title || 'A')}`,
    rating: stats?.average_rating || 0,
    reviewCount: stats?.review_count || 0,
    readingsCount: stats?.completed_readings || 0,
    positiveReviews: stats?.positive_reviews || 0,
    negativeReviews: stats?.negative_reviews || 0,
    yearStarted: row.years_experience ? currentYear - row.years_experience : currentYear,
    status: (row.status as Advisor['status']) || 'offline',
    pricePerMinute: row.price_per_minute,
    discountedPrice: row.discounted_price ?? undefined,
    freeMinutes: row.free_minutes ?? undefined,
    specialties: row.specialties || [],
    description: row.bio_short || '',
    descriptionLong: row.bio_long ?? undefined,
    isTopRated: row.is_top_rated ?? false,
    twinEnabled: row.twin_enabled ?? false,
    vapiAgentId: row.vapi_agent_id ?? undefined,
  };
}

export interface UseAdvisorsResult {
  advisors: Advisor[];
  isLoading: boolean;
  getAdvisorById: (id: string | undefined) => Advisor | undefined;
}

export function useAdvisors(): UseAdvisorsResult {
  const [dbAdvisors, setDbAdvisors] = useState<Advisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdvisors = useCallback(async () => {
    try {
      // Fetch advisor details and public stats in parallel
      const [advisorResult, statsResult] = await Promise.all([
        supabase
          .from('advisor_details')
          .select('id, title, bio_short, bio_long, specialties, price_per_minute, discounted_price, free_minutes, years_experience, status, is_top_rated, twin_enabled, vapi_agent_id, profiles(full_name, avatar_url)'),
        supabase.rpc('get_all_advisor_public_stats'),
      ]);

      if (advisorResult.error) {
        console.warn('[useAdvisors] DB fetch error:', advisorResult.error.message);
        setDbAdvisors([]);
        return;
      }

      // Build stats lookup map
      const statsMap = new Map<string, AdvisorPublicStats>();
      if (!statsResult.error && statsResult.data) {
        try {
          const parsed: AdvisorPublicStats[] = typeof statsResult.data === 'string'
            ? JSON.parse(statsResult.data)
            : statsResult.data;
          if (Array.isArray(parsed)) {
            parsed.forEach(s => statsMap.set(s.advisor_id, s));
          }
        } catch (parseErr) {
          console.warn('[useAdvisors] Stats parse error:', parseErr);
        }
      }

      const data = advisorResult.data;
      if (data && data.length > 0) {
        const mapped = (data as unknown as DBAdvisorRow[]).map(row =>
          mapDBToAdvisor(row, statsMap.get(row.id))
        );
        setDbAdvisors(mapped);
      }
    } catch (err) {
      console.warn('[useAdvisors] Fetch exception:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvisors();
  }, [fetchAdvisors]);

  // Realtime subscription for advisor status changes
  useEffect(() => {
    const channel = supabase
      .channel('advisor-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'advisor_details',
        },
        (payload) => {
          const updated = payload.new as { id: string; status: string };
          setDbAdvisors((prev) =>
            prev.map((a) =>
              a.id === updated.id
                ? { ...a, status: (updated.status as Advisor['status']) || 'offline' }
                : a
            )
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const getAdvisorById = useCallback((id: string | undefined): Advisor | undefined => {
    if (!id) return undefined;
    return dbAdvisors.find(a => a.id === id);
  }, [dbAdvisors]);

  return {
    advisors: dbAdvisors,
    isLoading,
    getAdvisorById,
  };
}
