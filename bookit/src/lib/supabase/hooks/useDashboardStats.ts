'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { startOfWeek, format } from 'date-fns';
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

export function useDashboardStats(): DashboardStatsWithLoading {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const today     = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const qc = useQueryClient();

  // Realtime: invalidate on any bookings change for this master
  useEffect(() => {
    if (!masterId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard-stats-${masterId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `master_id=eq.${masterId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['dashboard-stats', masterId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [masterId]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats', masterId, today],
    queryFn: async () => {
      const supabase = createClient();

      type TodayRow = { status: string; total_price: string | number };
      type WeekRow  = { client_phone: string | null; client_name: string | null };

      const [todayRes, weekRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('status, total_price')
          .eq('master_id', masterId!)
          .eq('date', today),
        supabase
          .from('bookings')
          .select('client_phone, client_name, status')
          .eq('master_id', masterId!)
          .gte('date', weekStart)
          .lte('date', today)
          .neq('status', 'cancelled'),
      ]);

      if (todayRes.error) throw todayRes.error;
      if (weekRes.error)  throw weekRes.error;

      const rawToday = todayRes.data;
      const rawWeek  = weekRes.data;

      const bookings  = (rawToday ?? []) as TodayRow[];
      const weekRows2 = (rawWeek  ?? []) as WeekRow[];
      const todayRevenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((s, b) => s + Number(b.total_price), 0);

      const weekClients = new Set(
        weekRows2.map(b => b.client_phone || b.client_name)
      ).size;

      return {
        todayCount: bookings.length,
        todayPending: bookings.filter(b => b.status === 'pending').length,
        todayConfirmed: bookings.filter(b => b.status === 'confirmed').length,
        todayCompleted: bookings.filter(b => b.status === 'completed').length,
        todayRevenue,
        weekClients,
      } satisfies DashboardStats;
    },
    enabled: !!masterId,
    staleTime: 30_000,
    placeholderData: {
      todayCount: 0, todayPending: 0, todayConfirmed: 0,
      todayCompleted: 0, todayRevenue: 0, weekClients: 0,
    },
  });

  const defaults = {
    todayCount: 0, todayPending: 0, todayConfirmed: 0,
    todayCompleted: 0, todayRevenue: 0, weekClients: 0,
  };
  return { ...(data ?? defaults), isLoading: isLoading && !!masterId };
}
