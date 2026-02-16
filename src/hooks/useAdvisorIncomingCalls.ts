import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface IncomingSession {
  id: string;
  client_id: string;
  type: string;
  client_name: string;
  rate_per_minute: number;
}

const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds as fallback

/**
 * Listens for incoming pending sessions for a specific advisor.
 * Uses both Supabase Realtime AND polling fallback to ensure reliability.
 * Realtime may not fire if the project hasn't enabled it or if there are
 * RLS/publication issues, so polling ensures the advisor always sees sessions.
 */
export function useAdvisorIncomingCalls(advisorId: string | undefined) {
  const [incomingSessions, setIncomingSessions] = useState<IncomingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPending = useCallback(async () => {
    if (!advisorId) return;

    console.log('[useAdvisorIncomingCalls] Fetching pending sessions for advisor:', advisorId);

    const { data, error } = await supabase
      .from('sessions')
      .select('id, client_id, type, rate_per_minute, status, profiles!sessions_client_id_fkey(full_name)')
      .eq('advisor_id', advisorId)
      .eq('status', 'pending');

    if (error) {
      console.warn('[useAdvisorIncomingCalls] Fetch error:', error.message);
      setLoading(false);
      return;
    }

    console.log('[useAdvisorIncomingCalls] Found', data?.length || 0, 'pending sessions:', data);

    const mapped: IncomingSession[] = (data || []).map((s: any) => ({
      id: s.id,
      client_id: s.client_id,
      type: s.type,
      client_name: s.profiles?.full_name || 'Unknown Client',
      rate_per_minute: s.rate_per_minute,
    }));

    setIncomingSessions(mapped);
    setLoading(false);
  }, [advisorId]);

  useEffect(() => {
    if (!advisorId) return;

    // Initial fetch
    fetchPending();

    // Polling fallback — ensures sessions appear even if Realtime isn't working
    pollRef.current = setInterval(() => {
      fetchPending();
    }, POLL_INTERVAL_MS);

    // Subscribe to changes on sessions for this advisor (Realtime, best-effort)
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
          console.log('[useAdvisorIncomingCalls] Realtime INSERT:', payload.new);
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
          console.log('[useAdvisorIncomingCalls] Realtime UPDATE:', payload.new);
          const updated = payload.new as Record<string, any>;
          // Remove from incoming list if no longer pending
          if (updated.status !== 'pending') {
            setIncomingSessions(prev => prev.filter(s => s.id !== updated.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[useAdvisorIncomingCalls] Realtime subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [advisorId, fetchPending]);

  return { incomingSessions, loading, refetch: fetchPending };
}
