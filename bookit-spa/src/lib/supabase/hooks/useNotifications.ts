import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface BookingNotification {
  id: string;
  clientName: string;
  date: string;
  startTime: string;
  status: string;
  services: string;
  createdAt: string;
}

const LS_KEY = 'bookit_notifications_last_seen';

// Realtime invalidation is handled by the consolidated channel
// in useRealtimeNotifications — no separate channel needed here.
export function useNotifications() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  const [lastSeenAt, setLastSeenAt] = useState<string>(() => {
    if (typeof window === 'undefined') return new Date(0).toISOString();
    return localStorage.getItem(LS_KEY) ?? new Date(0).toISOString();
  });

  const { data: notifications = [] } = useQuery<BookingNotification[]>({
    queryKey: ['notifications', masterId],
    enabled: !!masterId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('id, client_name, date, start_time, status, created_at, booking_services(service_name)')
        .eq('master_id', masterId!)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data ?? []).map((b: any) => ({
        id: b.id as string,
        clientName: b.client_name as string,
        date: b.date as string,
        startTime: (b.start_time as string | null)?.slice(0, 5) ?? '',
        status: b.status as string,
        services: ((b.booking_services ?? []) as any[]).map((s: any) => s.service_name).join(', ') || 'Послуга',
        createdAt: b.created_at as string,
      }));
    },
    staleTime: 30_000,
  });

  const unreadCount = notifications.filter(n => n.createdAt > lastSeenAt).length;

  function markAllRead() {
    const now = new Date().toISOString();
    setLastSeenAt(now);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, now);
    }
  }

  return { notifications, unreadCount, markAllRead };
}
