'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import type { FlashDealRow } from '@/app/(master)/dashboard/flash/page';

export function useFlashDeals(initialData?: FlashDealRow[]) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery<FlashDealRow[]>({
    queryKey: ['flash-deals', masterId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('flash_deals')
        .select('id, service_name, slot_date, slot_time, original_price, discount_pct, expires_at, status')
        .eq('master_id', masterId!)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FlashDealRow[];
    },
    enabled: !!masterId,
    staleTime: 30_000,
    initialData: masterId && initialData ? initialData : undefined,
    // Позначаємо серверні дані як "щойно отримані" — без зайвого refetch при маунті
    initialDataUpdatedAt: Date.now(),
  });
}

export function useFlashDealsInvalidate() {
  const qc = useQueryClient();
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  return () => qc.invalidateQueries({ queryKey: ['flash-deals', masterId] });
}

export function useFlashDealsCount() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery<number>({
    queryKey: ['flash-deals-count', masterId],
    queryFn: async () => {
      const supabase = createClient();
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('flash_deals')
        .select('id', { count: 'exact', head: true })
        .eq('master_id', masterId!)
        .gte('created_at', monthStart.toISOString());
      return count ?? 0;
    },
    enabled: !!masterId,
    staleTime: 60_000,
  });
}
