import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { advisors as staticAdvisors, type Advisor } from '@/data/advisors';

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
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

function mapDBToAdvisor(row: DBAdvisorRow): Advisor {
  const currentYear = new Date().getFullYear();
  return {
    id: row.id, // UUID — also serves as dbId
    dbId: row.id,
    name: row.profiles?.full_name || 'Advisor',
    title: row.title || 'Spiritual Advisor',
    avatar: row.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    rating: 5.0, // Default — reviews system not built yet
    reviewCount: 0,
    readingsCount: 0,
    yearStarted: row.years_experience ? currentYear - row.years_experience : currentYear,
    status: (row.status as Advisor['status']) || 'offline',
    pricePerMinute: row.price_per_minute,
    discountedPrice: row.discounted_price ?? undefined,
    freeMinutes: row.free_minutes ?? undefined,
    specialties: row.specialties || [],
    description: row.bio_short || row.bio_long || '',
    isTopRated: row.is_top_rated ?? false,
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
      const { data, error } = await supabase
        .from('advisor_details')
        .select('id, title, bio_short, bio_long, specialties, price_per_minute, discounted_price, free_minutes, years_experience, status, is_top_rated, profiles!advisor_details_id_fkey(full_name, avatar_url)');

      if (error) {
        console.warn('[useAdvisors] DB fetch error:', error.message);
        setDbAdvisors([]);
        return;
      }

      if (data && data.length > 0) {
        const mapped = (data as unknown as DBAdvisorRow[]).map(mapDBToAdvisor);
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

  // Merge: DB advisors take priority, then static advisors that aren't already in DB
  const mergedAdvisors = useMemo(() => {
    const dbIds = new Set(dbAdvisors.map(a => a.id));
    // Also check static advisors whose dbId matches a DB advisor
    const staticWithDbMatch = new Set(
      staticAdvisors
        .filter(a => a.dbId && dbIds.has(a.dbId))
        .map(a => a.id)
    );

    const staticOnly = staticAdvisors.filter(
      a => !dbIds.has(a.id) && !staticWithDbMatch.has(a.id)
    );

    return [...dbAdvisors, ...staticOnly];
  }, [dbAdvisors]);

  const getAdvisorById = useCallback((id: string | undefined): Advisor | undefined => {
    if (!id) return undefined;

    // Check DB advisors first (by UUID)
    const dbMatch = dbAdvisors.find(a => a.id === id);
    if (dbMatch) return dbMatch;

    // Check static advisors by id
    const staticMatch = staticAdvisors.find(a => a.id === id);
    if (staticMatch) return staticMatch;

    // Check static advisors by dbId
    const staticByDbId = staticAdvisors.find(a => a.dbId === id);
    if (staticByDbId) return staticByDbId;

    return undefined;
  }, [dbAdvisors]);

  return {
    advisors: mergedAdvisors,
    isLoading,
    getAdvisorById,
  };
}
