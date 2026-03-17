'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface DashboardStats {
  todayCount: number;
  todayPending: number;
  todayConfirmed: number;
  todayCompleted: number;
  todayRevenue: number;
  weekClients: number;
}

export interface DashboardStatsWithLoading extends DashboardStats {
  isLoading: boolean;
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

export function useDashboardStats(): DashboardStatsWithLoading {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = getWeekStart();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats', masterId, today],
    queryFn: async () => {
      const supabase = createClient();
      const [{ data: todayRows }, { data: weekRows }] = await Promise.all([
        supabase
          .from('bookings')
          .select('status, total_price')
          .eq('master_id', masterId!)
          .eq('date', today),
        supabase
          .from('bookings')
          .select('client_id, status')
          .eq('master_id', masterId!)
          .gte('date', weekStart)
          .lte('date', today)
          .neq('status', 'cancelled'),
      ]);

      const bookings = todayRows ?? [];
      const todayRevenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((s, b) => s + Number(b.total_price), 0);

      const uniqueClients = new Set(
        (weekRows ?? []).map(b => b.client_id).filter(Boolean)
      ).size;

      return {
        todayCount: bookings.length,
        todayPending: bookings.filter(b => b.status === 'pending').length,
        todayConfirmed: bookings.filter(b => b.status === 'confirmed').length,
        todayCompleted: bookings.filter(b => b.status === 'completed').length,
        todayRevenue,
        weekClients: uniqueClients,
      } satisfies DashboardStats;
    },
    enabled: !!masterId,
    refetchInterval: 60_000,
    placeholderData: {
      todayCount: 0, todayPending: 0, todayConfirmed: 0,
      todayCompleted: 0, todayRevenue: 0, weekClients: 0,
    },
  });

  const defaults = {
    todayCount: 0, todayPending: 0, todayConfirmed: 0,
    todayCompleted: 0, todayRevenue: 0, weekClients: 0,
  };
  return { ...(data ?? defaults), isLoading };
}
