import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

// Inline type (was imported from Next.js page route)
interface FlashDealRow {
  id: string;
  service_name: string;
  slot_date: string;
  slot_time: string;
  original_price: number;
  discount_pct: number;
  expires_at: string;
  status: string;
}

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
