import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface AiChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_ai_generated: boolean;
}

export interface UseAiChatReturn {
  messages: AiChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  sendMessage: (content: string, clientId: string) => Promise<void>;
  error: string | null;
  creditsUsedInSession: number;
}

export function useAiChat(
  sessionId: string | null,
  advisorId: string | null
): UseAiChatReturn {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsUsedInSession, setCreditsUsedInSession] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch existing messages on mount
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('id, session_id, sender_id, content, created_at, is_ai_generated')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!fetchError && data) {
        setMessages(data as AiChatMessage[]);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [sessionId]);

  // Subscribe to Realtime message INSERTs
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`ai-chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as AiChatMessage;
          setMessages((prev) => {
            // Skip if already exists by DB id
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // Replace optimistic message (same sender + content, temporary id)
            const optimisticIdx = prev.findIndex(
              (m) =>
                !m.is_ai_generated &&
                m.sender_id === newMsg.sender_id &&
                m.content === newMsg.content &&
                m.id !== newMsg.id
            );
            if (optimisticIdx >= 0) {
              const updated = [...prev];
              updated[optimisticIdx] = newMsg;
              return updated;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionId]);

  // Send message via handle-ai-chat edge function
  const sendMessage = useCallback(
    async (content: string, clientId: string) => {
      if (!sessionId || !advisorId) return;

      // Optimistic: show user message immediately before edge function call
      const optimisticMsg: AiChatMessage = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        sender_id: clientId,
        content,
        created_at: new Date().toISOString(),
        is_ai_generated: false,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      setIsSending(true);
      setError(null);

      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          'handle-ai-chat',
          {
            body: {
              session_id: sessionId,
              advisor_id: advisorId,
              message_content: content,
              client_id: clientId,
            },
          }
        );

        if (invokeError) throw invokeError;

        if (data?.error) {
          if (data.code === 'INSUFFICIENT_CREDITS') {
            setError('Insufficient credits. Please add more credits to continue.');
          } else if (data.code === 'TWIN_DISABLED') {
            setError('AI Twin is not available for this advisor.');
          } else {
            setError(data.error);
          }
          return;
        }

        if (data?.credits_deducted) {
          setCreditsUsedInSession((prev) => prev + data.credits_deducted);
        }
      } catch (err: any) {
        console.error('[useAiChat] Send error:', err);
        setError(err.message || 'Failed to send message. Please try again.');
      } finally {
        setIsSending(false);
      }
    },
    [sessionId, advisorId]
  );

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    error,
    creditsUsedInSession,
  };
}
