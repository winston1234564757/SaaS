'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface TimeOffRow {
  type: 'vacation' | 'day_off' | 'short_day';
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
}

export interface VacationImpact {
  totalOffDays: number;
  estimatedLostRevenue: number; // в копійках
  averageDailyRevenue: number;  // в копійках
  offSegmentsCount: number;
}

export function useVacationImpact({ start, end }: { start: string; end: string }) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery({
    queryKey: ['analytics-tab-vacation', masterId, start, end],
    enabled: !!masterId,
    staleTime: 3 * 60_000, // 3 min
    queryFn: async (): Promise<VacationImpact> => {
      const supabase = createClient();

      // 1. Отримуємо відпустки
      const { data: timeOffData, error: timeOffError } = await supabase
        .from('master_time_off')
        .select('type, start_date, end_date, start_time, end_time')
        .eq('master_id', masterId!)
        .gte('end_date', start)
        .lte('start_date', end);

      if (timeOffError) throw timeOffError;

      // 2. Отримуємо середній дохід за робочі дні у періоді
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('date, total_price')
        .eq('master_id', masterId!)
        .eq('status', 'completed')
        .gte('date', start)
        .lte('date', end);

      if (bookingsError) throw bookingsError;

      const timeOffRows = (timeOffData ?? []) as TimeOffRow[];
      const bookingsRows = (bookingsData ?? []) as { date: string; total_price: number }[];

      // Розрахунок середнього денного доходу
      const uniqueWorkingDays = new Set(bookingsRows.map((b) => b.date));
      const totalRevenue = bookingsRows.reduce((sum, b) => sum + Number(b.total_price), 0);
      // Переводимо в копійки (в базі total_price це DECIMAL, тобто у гривнях)
      const totalRevenueKopecks = Math.round(totalRevenue * 100);
      const averageDailyRevenue = uniqueWorkingDays.size > 0 ? Math.round(totalRevenueKopecks / uniqueWorkingDays.size) : 0;

      // Розрахунок загальної кількості вихідних днів
      let totalOffDays = 0;
      timeOffRows.forEach((row) => {
        if (row.type === 'vacation') {
          const s = new Date(row.start_date);
          const e = new Date(row.end_date);
          const diffMs = e.getTime() - s.getTime();
          const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
          totalOffDays += diffDays;
        } else if (row.type === 'day_off') {
          totalOffDays += 1;
        } else if (row.type === 'short_day') {
          totalOffDays += 0.5; // умовно півдня
        }
      });

      const estimatedLostRevenue = Math.round(totalOffDays * averageDailyRevenue);

      return {
        totalOffDays,
        estimatedLostRevenue,
        averageDailyRevenue,
        offSegmentsCount: timeOffRows.length,
      };
    },
  });
}
