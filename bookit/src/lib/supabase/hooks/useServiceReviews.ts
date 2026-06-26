'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';

export interface ServiceReview {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string;
  created_at: string;
}

export interface ServiceReviewsResult {
  reviews: ServiceReview[];
  count: number;
  average: number; // 0 when no reviews
}

/**
 * Published reviews for a single service (M-SVC-03).
 *
 * Reviews are bound to a booking, not a service — the RPC derives the link via
 * reviews.booking_id -> booking_services.service_id. A multi-service booking's
 * review therefore appears under each of its services (accepted product decision).
 * RPC `get_service_reviews` is SECURITY DEFINER and returns only is_published rows,
 * so it is safe to call from the public (anon) booking page.
 */
export function useServiceReviews(serviceId: string | null, enabled = true) {
  const query = useQuery({
    queryKey: ['service-reviews', serviceId],
    queryFn: async (): Promise<ServiceReview[]> => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_service_reviews', {
        p_service_id: serviceId,
      });
      if (error) throw error;
      return (data ?? []) as ServiceReview[];
    },
    enabled: enabled && !!serviceId,
    staleTime: 5 * 60_000,
  });

  const reviews = query.data ?? [];
  const count = reviews.length;
  const average = count > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;

  return {
    reviews,
    count,
    average,
    isLoading: query.isLoading && enabled && !!serviceId,
    error: query.error,
  } satisfies ServiceReviewsResult & { isLoading: boolean; error: unknown };
}
