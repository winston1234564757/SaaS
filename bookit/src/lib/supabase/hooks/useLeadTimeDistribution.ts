'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface LeadTimeDataPoint {
  date: string;
  created_at: string;
}

export interface LeadTimeDistribution {
  same_day: number;
  one_three_days: number;
  three_seven_days: number;
  seven_fourteen_days: number;
  above_fourteen_days: number;
  averageDays: number;
  totalBookings: number;
}

export function useLeadTimeDistribution({ start, end }: { start: string; end: string }) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery({
    queryKey: ['analytics-tab-leadtime', masterId, start, end],
    enabled: !!masterId,
    staleTime: 5 * 60_000, // 5 min
    queryFn: async (): Promise<LeadTimeDistribution> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('date, created_at')
        .eq('master_id', masterId!)
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;

      const rows = (data ?? []) as LeadTimeDataPoint[];
      const totalBookings = rows.length;

      let same_day = 0;
      let one_three_days = 0;
      let three_seven_days = 0;
      let seven_fourteen_days = 0;
      let above_fourteen_days = 0;
      let totalDaysSum = 0;

      rows.forEach((r) => {
        const bookingDate = new Date(r.date);
        const createdDate = new Date(r.created_at);
        const diffMs = bookingDate.getTime() - createdDate.getTime();
        const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        totalDaysSum += diffDays;

        if (diffDays === 0) {
          same_day++;
        } else if (diffDays <= 3) {
          one_three_days++;
        } else if (diffDays <= 7) {
          three_seven_days++;
        } else if (diffDays <= 14) {
          seven_fourteen_days++;
        } else {
          above_fourteen_days++;
        }
      });

      const averageDays = totalBookings > 0 ? Math.round((totalDaysSum / totalBookings) * 10) / 10 : 0;

      return {
        same_day,
        one_three_days,
        three_seven_days,
        seven_fourteen_days,
        above_fourteen_days,
        averageDays,
        totalBookings,
      };
    },
  });
}
