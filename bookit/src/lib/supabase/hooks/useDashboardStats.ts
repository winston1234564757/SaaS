'use client';

import { useQuery } from '@tanstack/react-query';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { getNow } from '@/lib/utils/now';

export interface DashboardStats {
  todayCount: number;
  todayCancelled: number;
  todayPending: number;
  todayConfirmed: number;
  todayCompleted: number;
  todayRevenue: number;
  prevDayRevenue: number;
  weekClients: number;
  weekNewClients: number;
  weekNewPhones: string[];
  monthCompleted: number;
  weekDayBookings: number[]; // 7 elements, index = JS day (0=Sun, 1=Mon … 6=Sat)
}

export interface DashboardStatsWithLoading extends DashboardStats {
  isLoading: boolean;
}

export function useDashboardStats(): DashboardStatsWithLoading {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  // Recomputed every render — cheap ops; queryKey change triggers new fetch after midnight
  const now        = getNow();
  const today      = format(now, 'yyyy-MM-dd');
  const yesterday  = format(new Date(now.getTime() - 86_400_000), 'yyyy-MM-dd');
  const weekStart  = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd    = format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');

  // Realtime invalidation is handled by the consolidated channel
  // in useRealtimeNotifications — no separate channel needed here.

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats', masterId, today],
    queryFn: async () => {
      const supabase = createClient();

      type TodayRow = { status: string; total_price: string | number };
      type WeekRow  = { client_phone: string | null; client_name: string | null; date: string | null };

      const [todayRes, weekRes, monthRes, yesterdayRes, newPhonesRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('status, total_price')
          .eq('master_id', masterId!)
          .eq('date', today),
        supabase
          .from('bookings')
          .select('client_phone, client_name, status, date')
          .eq('master_id', masterId!)
          .gte('date', weekStart)
          .lte('date', weekEnd)
          .neq('status', 'cancelled'),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('master_id', masterId!)
          .eq('status', 'completed')
          .gte('date', monthStart)
          .lte('date', today),
        supabase
          .from('bookings')
          .select('status, total_price')
          .eq('master_id', masterId!)
          .eq('date', yesterday),
        // Set-diff «нових клієнтів тижня» рахує база (OPT-DB-04). Раніше сюди
        // тягнулось до 5000 історичних телефонів, а `.limit()` без `ORDER BY`
        // не гарантує, ЯКІ саме рядки повернуться — щойно історія переросла б
        // межу, давній клієнт мовчки порахувався б як новий.
        supabase.rpc('get_week_new_client_phones', {
          p_master_id:  masterId!,
          p_week_start: weekStart,
          p_week_end:   weekEnd,
        }),
      ]);

      if (todayRes.error) throw todayRes.error;
      if (weekRes.error)  throw weekRes.error;

      const bookings  = (todayRes.data ?? []) as TodayRow[];
      const weekRows2 = (weekRes.data   ?? []) as WeekRow[];

      const todayRevenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((s, b) => s + Number(b.total_price), 0);

      const prevDayRevenue = ((yesterdayRes.data ?? []) as TodayRow[])
        .filter(b => b.status === 'completed')
        .reduce((s, b) => s + Number(b.total_price), 0);

      const weekClients = new Set(
        weekRows2.map(b => b.client_phone || b.client_name)
      ).size;

      const weekDayBookings = Array(7).fill(0) as number[];
      for (const b of weekRows2) {
        if (b.date) {
          const dow = new Date(b.date + 'T12:00:00').getDay();
          weekDayBookings[dow]++;
        }
      }

      // Телефони приходять уже нормалізованими (RPC робить `regexp_replace(…, '\D', '', 'g')`
      // — той самий формат, що й `norm` у StatsModals, який звіряє їх через
      // `newPhones.has(norm(b.client_phone))`).
      const weekNewPhones  = (newPhonesRes.data ?? []) as string[];
      const weekNewClients = weekNewPhones.length;

      return {
        todayCount:     bookings.length,
        todayCancelled: bookings.filter(b => b.status === 'cancelled').length,
        todayPending:   bookings.filter(b => b.status === 'pending').length,
        todayConfirmed: bookings.filter(b => b.status === 'confirmed').length,
        todayCompleted: bookings.filter(b => b.status === 'completed').length,
        todayRevenue,
        prevDayRevenue,
        weekClients,
        weekNewClients,
        weekNewPhones,
        monthCompleted: monthRes.count ?? 0,
        weekDayBookings,
      } satisfies DashboardStats;
    },
    enabled: !!masterId,
    staleTime: 30_000,
    placeholderData: {
      todayCount: 0, todayCancelled: 0, todayPending: 0, todayConfirmed: 0,
      todayCompleted: 0, todayRevenue: 0, prevDayRevenue: 0,
      weekClients: 0, weekNewClients: 0, weekNewPhones: [], monthCompleted: 0,
      weekDayBookings: Array(7).fill(0) as number[],
    },
  });

  const defaults = {
    todayCount: 0, todayCancelled: 0, todayPending: 0, todayConfirmed: 0,
    todayCompleted: 0, todayRevenue: 0, prevDayRevenue: 0,
    weekClients: 0, weekNewClients: 0, weekNewPhones: [], monthCompleted: 0,
    weekDayBookings: Array(7).fill(0) as number[],
  };
  return { ...(data ?? defaults), isLoading: isLoading && !!masterId };
}

