import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RevenueHubClient } from '@/components/master/revenue/RevenueHubClient';
import type { FlashDealRow } from '@/app/(master)/dashboard/flash/page';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

export default async function RevenueHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    { data: mp },
    { data: deals },
    { count: flashUsedThisMonth }
  ] = await Promise.all([
    supabase
      .from('master_profiles')
      .select('pricing_rules, subscription_tier, dynamic_pricing_extra_earned')
      .eq('id', user.id)
      .single(),
    supabase
      .from('flash_deals')
      .select('id, service_name, slot_date, slot_time, original_price, discount_pct, expires_at, status')
      .eq('master_id', user.id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('flash_deals')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', user.id)
      .gte('created_at', monthStart.toISOString()),
  ]);

  const tier = mp?.subscription_tier ?? 'starter';
  const pricingRules = (mp?.pricing_rules ?? {}) as PricingRules;
  const extraEarned = (mp?.dynamic_pricing_extra_earned as number | null) ?? 0;
  const isPro = tier === 'pro' || tier === 'studio';

  return (
    <div className="p-4 md:p-6 lg:p-0">
      <RevenueHubClient
        flashData={{
          activeCount: deals?.length ?? 0,
          deals: (deals ?? []) as FlashDealRow[],
          tier,
          usedThisMonth: flashUsedThisMonth ?? 0,
        }}
        pricingData={{ tier, extraEarned, rules: pricingRules, isPro }}
      />
    </div>
  );
}
