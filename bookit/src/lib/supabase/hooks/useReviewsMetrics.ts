'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface ReviewMetricPoint {
  rating: number;
  comment: string | null;
  created_at: string;
  client_name: string;
}

export interface ReviewsMetrics {
  averageRating: number;
  npsScore: number;
  distribution: Record<number, number>; // 1-5 stars counts
  totalCount: number;
  recentReviews: ReviewMetricPoint[];
  /** Δ середнього балу проти попереднього періоду (абс.), null без бази */
  deltaAvg: number | null;
  /** Δ NPS проти попереднього періоду (пункти), null без бази */
  deltaNps: number | null;
}

type Row = { rating: number; comment: string | null; created_at: string; client_name: string };

function aggregate(rows: { rating: number }[]) {
  const total = rows.length;
  let sum = 0;
  let promoters = 0;
  let detractors = 0;
  rows.forEach((r) => {
    sum += r.rating;
    if (r.rating === 5) promoters++;
    else if (r.rating <= 3) detractors++;
  });
  const avg = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
  const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
  return { avg, nps, total };
}

/** Зсуває [start,end] на один рівний період назад */
function previousWindow(start: string, end: string): { prevStart: string; prevEnd: string } {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end + 'T00:00:00Z');
  const lenDays = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
  const prevEnd = new Date(s.getTime() - 86_400_000);
  const prevStart = new Date(prevEnd.getTime() - (lenDays - 1) * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { prevStart: iso(prevStart), prevEnd: iso(prevEnd) };
}

export function useReviewsMetrics({
  start,
  end,
  compareTrend = false,
}: {
  start: string;
  end: string;
  compareTrend?: boolean;
}) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery({
    queryKey: ['analytics-tab-reviews', masterId, start, end, compareTrend],
    enabled: !!masterId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ReviewsMetrics> => {
      const supabase = createClient();

      const fetchRows = async (from: string, to: string): Promise<Row[]> => {
        const { data, error } = await supabase
          .from('reviews')
          .select('rating, comment, created_at, client_name')
          .eq('master_id', masterId!)
          .gte('created_at', from + 'T00:00:00')
          .lte('created_at', to + 'T23:59:59')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []) as Row[];
      };

      const rows = await fetchRows(start, end);
      const totalCount = rows.length;

      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      rows.forEach((r) => {
        distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
      });

      const cur = aggregate(rows);

      let deltaAvg: number | null = null;
      let deltaNps: number | null = null;
      if (compareTrend) {
        const { prevStart, prevEnd } = previousWindow(start, end);
        const prevRows = await fetchRows(prevStart, prevEnd);
        if (prevRows.length > 0) {
          const prev = aggregate(prevRows);
          deltaAvg = Math.round((cur.avg - prev.avg) * 10) / 10;
          deltaNps = cur.nps - prev.nps;
        }
      }

      return {
        averageRating: cur.avg,
        npsScore: cur.nps,
        distribution,
        totalCount,
        recentReviews: rows.slice(0, 10),
        deltaAvg,
        deltaNps,
      };
    },
  });
}
