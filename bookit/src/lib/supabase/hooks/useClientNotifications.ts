'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';

export interface ClientNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  bookingId: string | null;
  createdAt: string;
}

export function useClientNotifications(userId: string | null) {
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery<ClientNotification[]>({
    queryKey: ['client-notifications', userId],
    enabled: !!userId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, body, is_read, related_booking_id, created_at')
        .eq('recipient_id', userId!)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      type Row = {
        id: string;
        type: string;
        title: string;
        body: string;
        is_read: boolean;
        related_booking_id: string | null;
        created_at: string;
      };

      return (data ?? []).map((n: Row) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.is_read,
        bookingId: n.related_booking_id,
        createdAt: n.created_at,
      }));
    },
    staleTime: 30_000,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  function markAllRead() {
    if (!userId || unreadCount === 0) return;
    qc.setQueryData<ClientNotification[]>(['client-notifications', userId], (old) =>
      old ? old.map(n => ({ ...n, isRead: true })) : old
    );
    const supabase = createClient();
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)
      .then(() => qc.invalidateQueries({ queryKey: ['client-notifications', userId] }));
  }

  return { notifications, unreadCount, markAllRead };
}
