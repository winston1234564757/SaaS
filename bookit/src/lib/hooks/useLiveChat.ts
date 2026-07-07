import { useEffect, useState, useId } from 'react';
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
  // Unique per-instance topic — a ticketId-only topic collides if two consumers
  // (e.g. admin console + user support view) mount the same ticket at once,
  // making the second .on() run after subscribe() → throw. See useUnreadDMCount.
  const instanceId = useId();

  useEffect(() => {
    if (!ticketId) {
      setMessages([]);
      return;
    }

    const supabase = createClient();
    setLoading(true);

    const fetchInitialMessages = async () => {
      const res = await supabase
        .from('support_messages')
        .select('id, ticket_id, sender_id, message, attachment_url, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (!res.error && res.data) {
        setMessages(res.data as unknown as SupportMessage[]);
      }
      setLoading(false);
    };

    fetchInitialMessages();

    const channel = supabase
      .channel(`chat_messages:${ticketId}:${instanceId}`)
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
  }, [ticketId, instanceId]);

  return { messages, loading, setMessages };
}
