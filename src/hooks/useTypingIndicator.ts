import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TYPING_TIMEOUT_MS = 3000; // Auto-clear typing after 3s of inactivity

/**
 * Real-time typing indicator via Supabase Realtime Presence.
 * Each user in a session broadcasts their typing state ephemerally.
 */
export function useTypingIndicator(sessionId: string | null, userId: string | null) {
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const channel = supabase.channel(`typing-${sessionId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Check if any OTHER user is typing
        const someoneElseTyping = Object.entries(state).some(
          ([key, presences]) =>
            key !== userId &&
            (presences as any[]).some((p) => p.isTyping === true)
        );
        setIsRemoteTyping(someoneElseTyping);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionId, userId]);

  const setLocalTyping = useCallback(
    (typing: boolean) => {
      if (!channelRef.current || !userId) return;

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      channelRef.current.track({ isTyping: typing });

      // Auto-clear typing after timeout
      if (typing) {
        typingTimeoutRef.current = setTimeout(() => {
          channelRef.current?.track({ isTyping: false });
        }, TYPING_TIMEOUT_MS);
      }
    },
    [userId]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { isRemoteTyping, setLocalTyping };
}
