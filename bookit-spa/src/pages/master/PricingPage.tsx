import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import type { PricingRules } from '@/lib/utils/dynamicPricing';
// TODO: port DynamicPricingPage, PricingUpgradeGate
// import { DynamicPricingPage } from '@/components/master/pricing/DynamicPricingPage';
// import { PricingUpgradeGate } from '@/components/master/pricing/PricingUpgradeGate';

const TRIAL_LIMIT_KOP = 100_000;

const JS_DAY_TO_KEY: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

export function PricingPage() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['pricing-page', masterId],
    queryFn: async () => {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);

      const [mpRes, bookingsRes] = await Promise.all([
        supabase
          .from('master_profiles')
          .select('pricing_rules, subscription_tier, dynamic_pricing_extra_earned')
          .eq('id', masterId!)
          .single(),
        supabase
          .from('bookings')
          .select('id, total_price, total_services_price, total_products_price, date, start_time, dynamic_pricing_label')
          .eq('master_id', masterId!)
          .neq('status', 'cancelled')
          .neq('status', 'no_show')
          .gte('date', yearAgo.toISOString().slice(0, 10)),
      ]);

      const mp = mpRes.data;
      const allBookings = bookingsRes.data ?? [];
      const quiet = (mp?.pricing_rules as PricingRules | null)?.quiet ?? null;

      function isQuietHoursBooking(b: {
        total_price: number; total_services_price: number; total_products_price: number;
        date: string; start_time: string | null; dynamic_pricing_label: string | null;
      }): boolean {
        if (b.dynamic_pricing_label?.includes('Тихий час')) return true;
        if (!quiet || !b.start_time) return false;
        const baseTotal = Number(b.total_services_price) + Number(b.total_products_price);
        if (Number(b.total_price) >= baseTotal) return false;
        const [yr, mo, dy] = b.date.split('-').map(Number);
        const dayKey = JS_DAY_TO_KEY[new Date(yr, mo - 1, dy).getDay()];
        if (!quiet.days.includes(dayKey)) return false;
        const hour = parseInt(b.start_time.slice(0, 2), 10);
        return hour >= quiet.hours[0] && hour < quiet.hours[1];
      }

      const quietBookings = allBookings.filter(isQuietHoursBooking);
      const quietHoursInsight = quietBookings.length > 0
        ? {
            count: quietBookings.length,
            totalUah: Math.round(quietBookings.reduce((s: number, r: { total_price: number }) => s + Number(r.total_price), 0)),
          }
        : null;

      return {
        mp,
        pricingRules: (mp?.pricing_rules ?? {}) as PricingRules,
        tier: mp?.subscription_tier ?? 'starter',
        extraEarned: (mp?.dynamic_pricing_extra_earned as number | null) ?? 0,
        quietHoursInsight,
      };
    },
    enabled: !!masterId,
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-[#A8928D]">Завантаження...</div>;
  }

  const tier = data?.tier ?? masterProfile?.subscription_tier ?? 'starter';
  const isPro = tier === 'pro' || tier === 'studio';
  const isStarter = tier === 'starter';
  const extraEarned = data?.extraEarned ?? 0;
  const trialExhausted = isStarter && extraEarned >= TRIAL_LIMIT_KOP;

  if (isStarter && trialExhausted) {
    return (
      <div className="p-6">
        {/* TODO: <PricingUpgradeGate
          trial={{ earned: extraEarned, limit: TRIAL_LIMIT_KOP, exhausted: true }}
          quietHoursInsight={data?.quietHoursInsight ?? null}
        /> */}
        <p className="text-sm text-[#A8928D]">PricingUpgradeGate (trial exhausted) — TODO</p>
      </div>
    );
  }

  if (isStarter) {
    return (
      <div className="p-6 flex flex-col gap-4">
        {/* TODO: <PricingUpgradeGate
          trial={{ earned: extraEarned, limit: TRIAL_LIMIT_KOP, exhausted: false }}
          quietHoursInsight={data?.quietHoursInsight ?? null}
        /> */}
        {/* TODO: <DynamicPricingPage initial={data?.pricingRules ?? {}} /> */}
        <p className="text-sm text-[#A8928D]">DynamicPricingPage (starter trial) — TODO</p>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="p-6">
        {/* TODO: <PricingUpgradeGate /> */}
        <p className="text-sm text-[#A8928D]">PricingUpgradeGate (no pro) — TODO</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* TODO: <DynamicPricingPage initial={data?.pricingRules ?? {}} /> */}
      <p className="text-sm text-[#A8928D]">DynamicPricingPage (pro) — TODO</p>
    </div>
  );
}
