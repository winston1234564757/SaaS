import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
}

interface SupportMessagePayload {
  new: SupportMessage;
}

export function useLiveChat(ticketId: string | null) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!ticketId) {
      setMessages([]);
      return;
    }

    setLoading(true);

    // 1. Fetch initial messages
    const fetchInitialMessages = async () => {
      const res = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (!res.error && res.data) {
        setMessages(res.data as unknown as SupportMessage[]);
      }
      setLoading(false);
    };

    fetchInitialMessages();

    // 2. Subscribe to Supabase Realtime postgres_changes
    const channel = supabase
      .channel(`chat_messages:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload: SupportMessagePayload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase]);

  return { messages, loading, setMessages };
}
