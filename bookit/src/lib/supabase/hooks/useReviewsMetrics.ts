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
}

export function useReviewsMetrics({ start, end }: { start: string; end: string }) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery({
    queryKey: ['analytics-tab-reviews', masterId, start, end],
    enabled: !!masterId,
    staleTime: 5 * 60_000, // 5 min
    queryFn: async (): Promise<ReviewsMetrics> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reviews')
        .select('rating, comment, created_at, client_name')
        .eq('master_id', masterId!)
        .gte('created_at', start + 'T00:00:00')
        .lte('created_at', end + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as ReviewMetricPoint[];
      const totalCount = rows.length;

      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sumRating = 0;
      let promoters = 0;
      let detractors = 0;

      rows.forEach((r) => {
        sumRating += r.rating;
        distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;

        if (r.rating === 5) {
          promoters++;
        } else if (r.rating <= 3) {
          detractors++;
        }
      });

      const averageRating = totalCount > 0 ? Math.round((sumRating / totalCount) * 10) / 10 : 0;
      const npsScore = totalCount > 0 ? Math.round(((promoters - detractors) / totalCount) * 100) : 0;

      return {
        averageRating,
        npsScore,
        distribution,
        totalCount,
        recentReviews: rows.slice(0, 10),
      };
    },
  });
}
