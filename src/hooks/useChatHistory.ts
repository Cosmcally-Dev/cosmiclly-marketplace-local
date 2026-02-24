import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChatMessage } from '@/hooks/useChatMessages';

/**
 * Fetches chat messages from previous sessions between the same client and advisor.
 * Returns the last 50 messages from past chat sessions (excluding the current session).
 */
export function useChatHistory(
  clientId: string | null,
  advisorId: string | null,
  currentSessionId: string | null
) {
  const [pastMessages, setPastMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!clientId || !advisorId || !currentSessionId) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // Get past chat session IDs between this client-advisor pair
        const { data: pastSessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id')
          .eq('client_id', clientId)
          .eq('advisor_id', advisorId)
          .eq('type', 'chat')
          .neq('id', currentSessionId)
          .in('status', ['completed', 'cancelled'])
          .order('started_at', { ascending: false })
          .limit(10);

        if (sessionsError || !pastSessions?.length) {
          setIsLoading(false);
          return;
        }

        const sessionIds = pastSessions.map(s => s.id);

        // Fetch messages from those sessions
        const { data: msgs, error: msgsError } = await supabase
          .from('messages')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!msgsError && msgs) {
          // Reverse to chronological order
          setPastMessages((msgs as ChatMessage[]).reverse());
        }
      } catch (err) {
        console.error('[useChatHistory] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [clientId, advisorId, currentSessionId]);

  return { pastMessages, isLoading };
}
