'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface NoShowBookingRow {
  date: string;
  start_time: string;
  client_name: string;
  client_phone: string;
  status: string;
  cancellation_reason: string | null;
}

export interface NoShowMetrics {
  totalBookings: number;
  noShowCount: number;
  noShowPct: number;
  cancellationCount: number;
  cancellationPct: number;
  history: NoShowBookingRow[];
}

export function useNoShowMetrics({ start, end }: { start: string; end: string }) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery({
    queryKey: ['analytics-tab-noshow', masterId, start, end],
    enabled: !!masterId,
    staleTime: 5 * 60_000, // 5 min
    queryFn: async (): Promise<NoShowMetrics> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('date, start_time, client_name, client_phone, status, cancellation_reason')
        .eq('master_id', masterId!)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as NoShowBookingRow[];
      const totalBookings = rows.length;

      const noShows = rows.filter((r) => r.status === 'no_show');
      const cancellations = rows.filter((r) => r.status === 'cancelled');

      const noShowCount = noShows.length;
      const cancellationCount = cancellations.length;

      const noShowPct = totalBookings > 0 ? Math.round((noShowCount / totalBookings) * 100) : 0;
      const cancellationPct = totalBookings > 0 ? Math.round((cancellationCount / totalBookings) * 100) : 0;

      return {
        totalBookings,
        noShowCount,
        noShowPct,
        cancellationCount,
        cancellationPct,
        history: [...noShows, ...cancellations].slice(0, 15),
      };
    },
  });
}
