import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds as fallback

interface UseSessionRealtimeOptions {
  sessionId: string | null;
  onStatusChange?: (newStatus: string, oldStatus: string) => void;
  enabled?: boolean;
}

/**
 * Subscribes to real-time status changes on a specific session.
 * Uses both Realtime AND polling to ensure reliability.
 * Tracks lastKnownStatus internally so the callback always gets
 * accurate old/new values (Realtime payload.old only has the PK by default).
 */
export function useSessionRealtime({
  sessionId,
  onStatusChange,
  enabled = true,
}: UseSessionRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbackRef = useRef(onStatusChange);
  const lastKnownStatusRef = useRef<string | null>(null);

  // Keep callback ref fresh without re-subscribing
  callbackRef.current = onStatusChange;

  const checkStatus = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('sessions')
      .select('status')
      .eq('id', sessionId)
      .single();

    if (error || !data) return;

    const newStatus = data.status;
    const oldStatus = lastKnownStatusRef.current;

    if (oldStatus !== null && newStatus !== oldStatus) {
      console.log(`[useSessionRealtime] Status changed: ${oldStatus} → ${newStatus}`);
      callbackRef.current?.(newStatus, oldStatus);
    }

    lastKnownStatusRef.current = newStatus;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !enabled) return;

    // Initial status fetch to set baseline
    checkStatus();

    // Polling fallback — catches status changes even if Realtime isn't working
    pollRef.current = setInterval(() => {
      checkStatus();
    }, POLL_INTERVAL_MS);

    // Realtime subscription (best-effort, fires faster than polling when working)
    const channel = supabase
      .channel(`session-status-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        () => {
          // Don't rely on payload.old (only has PK by default).
          // Just re-fetch to get accurate status and let checkStatus handle the diff.
          checkStatus();
        }
      )
      .subscribe((status) => {
        console.log('[useSessionRealtime] Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      channel.unsubscribe();
      channelRef.current = null;
      lastKnownStatusRef.current = null;
    };
  }, [sessionId, enabled, checkStatus]);
}
