import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface IncomingSession {
  id: string;
  client_id: string;
  type: string;
  client_name: string;
  rate_per_minute: number;
  created_at: string;
}

/**
 * Listens for incoming pending sessions for a specific advisor via Supabase Realtime.
 * Replaces the 5-second polling pattern. Does an initial fetch on mount to catch
 * sessions created before the subscription was active.
 */
export function useAdvisorIncomingCalls(advisorId: string | undefined) {
  const [incomingSessions, setIncomingSessions] = useState<IncomingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchPending = useCallback(async () => {
    if (!advisorId) return;

    const { data, error } = await supabase
      .from('sessions')
      .select('id, client_id, type, rate_per_minute, created_at, profiles!sessions_client_id_fkey(full_name)')
      .eq('advisor_id', advisorId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[useAdvisorIncomingCalls] Fetch error:', error.message);
      setLoading(false);
      return;
    }

    const mapped: IncomingSession[] = (data || []).map((s: any) => ({
      id: s.id,
      client_id: s.client_id,
      type: s.type,
      client_name: s.profiles?.full_name || 'Unknown Client',
      rate_per_minute: s.rate_per_minute,
      created_at: s.created_at,
    }));

    setIncomingSessions(mapped);
    setLoading(false);
  }, [advisorId]);

  useEffect(() => {
    if (!advisorId) return;

    // Initial fetch
    fetchPending();

    // Subscribe to changes on sessions for this advisor
    const channel = supabase
      .channel(`advisor-incoming-${advisorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sessions',
          filter: `advisor_id=eq.${advisorId}`,
        },
        (payload) => {
          const newSession = payload.new as Record<string, any>;
          if (newSession.status === 'pending') {
            // Re-fetch to get joined client name
            fetchPending();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `advisor_id=eq.${advisorId}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, any>;
          // Remove from incoming list if no longer pending
          if (updated.status !== 'pending') {
            setIncomingSessions(prev => prev.filter(s => s.id !== updated.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [advisorId, fetchPending]);

  return { incomingSessions, loading, refetch: fetchPending };
}
