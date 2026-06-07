import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ServiceSlim, FlashDealRow, StarReview } from './storyTypes';

export function useServices(masterId: string | null) {
  const { data = [] } = useQuery<ServiceSlim[]>({
    queryKey: ['story-services', masterId],
    queryFn: async () => {
      const { data } = await createClient()
        .from('services')
        .select('id,name,duration_minutes,buffer_minutes,emoji')
        .eq('master_id', masterId!)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      return (data as ServiceSlim[]) ?? [];
    },
    enabled: !!masterId,
    staleTime: 60_000,
  });
  return data;
}

export function useActiveFlashDeals(masterId: string | null) {
  const { data = [] } = useQuery<FlashDealRow[]>({
    queryKey: ['story-flash-deals', masterId],
    queryFn: async () => {
      const { data } = await createClient()
        .from('flash_deals')
        .select('id,service_name,original_price,discount_pct,slot_date,slot_time')
        .eq('master_id', masterId!)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(12);
      return (data as FlashDealRow[]) ?? [];
    },
    enabled: !!masterId,
    staleTime: 30_000,
  });
  return data;
}

export function useStarReviews(masterId: string | null) {
  const { data = [] } = useQuery<StarReview[]>({
    queryKey: ['story-star-reviews', masterId],
    queryFn: async () => {
      const { data } = await createClient()
        .from('reviews')
        .select('id,comment,client_name')
        .eq('master_id', masterId!)
        .eq('rating', 5)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data as StarReview[]) ?? [];
    },
    enabled: !!masterId,
    staleTime: 60_000,
  });
  return data;
}
