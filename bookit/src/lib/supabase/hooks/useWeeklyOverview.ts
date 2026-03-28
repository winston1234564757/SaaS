'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface DayData {
  bookings: number;
  revenue: number;
}

function getWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: monday.toISOString().slice(0, 10),
    to:   sunday.toISOString().slice(0, 10),
  };
}

// Повертає масив [Пн, Вт, Ср, Чт, Пт, Сб, Нд] — індекс 0=Пн
// Realtime invalidation is handled by the consolidated channel
// in useRealtimeNotifications — no separate channel needed here.
export function useWeeklyOverview(): { data: DayData[]; isLoading: boolean } {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const { from, to } = getWeekRange();

  const query = useQuery({
    queryKey: ['weekly-overview', masterId, from],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('date, total_price, status')
        .eq('master_id', masterId!)
        .gte('date', from)
        .lte('date', to)
        .neq('status', 'cancelled');

      if (error) throw error;

      // Агрегуємо по днях тижня (0=Пн…6=Нд)
      const days: DayData[] = Array.from({ length: 7 }, () => ({ bookings: 0, revenue: 0 }));
      ((data ?? []) as { date: string; total_price: string | number; status: string }[]).forEach(b => {
        const d = new Date(b.date);
        const idx = (d.getDay() + 6) % 7; // 0=Пн
        days[idx].bookings += 1;
        if (b.status === 'completed') {
          days[idx].revenue += Number(b.total_price);
        }
      });
      return days;
    },
    enabled: !!masterId,
    placeholderData: Array.from({ length: 7 }, () => ({ bookings: 0, revenue: 0 })),
    staleTime: 30_000,
  });

  return {
    data: query.data ?? Array.from({ length: 7 }, () => ({ bookings: 0, revenue: 0 })),
    isLoading: query.isLoading && !query.isPlaceholderData,
  };
}

