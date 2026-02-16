import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseSessionRealtimeOptions {
  sessionId: string | null;
  onStatusChange?: (newStatus: string, oldStatus: string) => void;
  enabled?: boolean;
}

/**
 * Subscribes to real-time status changes on a specific session.
 * Used by VoiceCall, VideoCall, Chat (client listens for accept/decline)
 * and AdvisorCall (advisor detects client ending session).
 */
export function useSessionRealtime({
  sessionId,
  onStatusChange,
  enabled = true,
}: UseSessionRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(onStatusChange);

  // Keep callback ref fresh without re-subscribing
  callbackRef.current = onStatusChange;

  useEffect(() => {
    if (!sessionId || !enabled) return;

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
        (payload) => {
          const newRow = payload.new as Record<string, any>;
          const oldRow = payload.old as Record<string, any>;
          if (newRow.status !== oldRow.status) {
            callbackRef.current?.(newRow.status, oldRow.status);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionId, enabled]);
}
