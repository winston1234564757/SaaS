'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface MasterNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  bookingId: string | null;
  createdAt: string;
}

// Realtime invalidation is handled by the consolidated channel
// in useRealtimeNotifications — no separate channel needed here.
export function useNotifications() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery<MasterNotification[]>({
    queryKey: ['notifications', masterId],
    enabled: !!masterId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, body, is_read, related_booking_id, created_at')
        .eq('recipient_id', masterId!)
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

  async function markAllRead() {
    if (!masterId || unreadCount === 0) return;
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', masterId)
      .eq('is_read', false);
    qc.invalidateQueries({ queryKey: ['notifications', masterId] });
  }

  async function markNotificationRead(notifId: string) {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);
    qc.invalidateQueries({ queryKey: ['notifications', masterId] });
  }

  return { notifications, unreadCount, markAllRead, markNotificationRead };
}
