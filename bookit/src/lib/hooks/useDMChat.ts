'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string | null;
  attachment_url: string | null;
  read_at: string | null;
  created_at: string;
}

export function useDMChat(conversationId: string | null) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  // Unique per-instance topic — guards against the channel-collision crash if two
  // consumers mount the same conversation concurrently. See useUnreadDMCount.
  const instanceId = useId();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) { setLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages((data as DirectMessage[]) ?? []);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dm:${conversationId}:${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<DirectMessage>) => {
          const newMsg = payload.new as DirectMessage;
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<DirectMessage>) => {
          const updated = payload.new as DirectMessage;
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, instanceId]);

  return { messages, loading, setMessages };
}
