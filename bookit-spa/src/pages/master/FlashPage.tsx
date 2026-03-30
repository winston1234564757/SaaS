import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
// TODO: port FlashDealPage component from @/components/master/flash/FlashDealPage
// import { FlashDealPage } from '@/components/master/flash/FlashDealPage';

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

export function FlashPage() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['flash-page', masterId],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [dealsRes, countRes] = await Promise.all([
        supabase
          .from('flash_deals')
          .select('id, service_name, slot_date, slot_time, original_price, discount_pct, expires_at, status')
          .eq('master_id', masterId!)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('flash_deals')
          .select('id', { count: 'exact', head: true })
          .eq('master_id', masterId!)
          .gte('created_at', monthStart.toISOString()),
      ]);

      return {
        deals: (dealsRes.data ?? []) as FlashDealRow[],
        usedThisMonth: countRes.count ?? 0,
      };
    },
    enabled: !!masterId,
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-[#A8928D]">Завантаження...</div>;
  }

  const tier = masterProfile?.subscription_tier ?? 'starter';

  return (
    <div className="p-6">
      {/* TODO: <FlashDealPage
        activeDeals={data?.deals ?? []}
        tier={tier}
        usedThisMonth={data?.usedThisMonth ?? 0}
      /> */}
      <p className="text-sm text-[#A8928D]">
        FlashPage — TODO (tier: {tier}, deals: {data?.deals.length ?? 0})
      </p>
    </div>
  );
}
