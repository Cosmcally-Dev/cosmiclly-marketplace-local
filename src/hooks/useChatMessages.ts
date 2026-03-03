import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  is_ai_generated?: boolean;
}

/**
 * Real-time chat messaging hook via Supabase Realtime.
 * Fetches existing messages on mount, subscribes to new INSERT events,
 * listens for UPDATE events (read receipts), and provides send + markAsRead functions.
 */
export function useChatMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch existing messages
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as ChatMessage[]);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [sessionId]);

  // Subscribe to new messages and read receipt updates in real-time
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat-messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            // Deduplicate (optimistic insert may already have it)
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages(prev =>
            prev.map(m => m.id === updated.id ? { ...m, read_at: updated.read_at } : m)
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionId]);

  // Send a message
  const sendMessage = useCallback(async (content: string, senderId: string) => {
    if (!sessionId) return null;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('[useChatMessages] Send failed:', error);
      throw error;
    }

    return data as ChatMessage;
  }, [sessionId]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!messageIds.length) return;

    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
      .is('read_at', null);

    if (error) {
      console.error('[useChatMessages] markAsRead failed:', error);
    }
  }, []);

  return { messages, isLoading, sendMessage, markAsRead };
}
