import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { DynamicPricingPage } from '@/components/master/pricing/DynamicPricingPage';
import { PricingUpgradeGate } from '@/components/master/pricing/PricingUpgradeGate';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

const TRIAL_LIMIT_KOP = 100_000; // 1 000 ₴ в копійках

// Індекс: 0=нд, 1=пн, ... 6=сб → ключ pricing_rules
const JS_DAY_TO_KEY: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const [{ data: mp }, { data: allBookings }] = await Promise.all([
    admin
      .from('master_profiles')
      .select('pricing_rules, subscription_tier, dynamic_pricing_extra_earned')
      .eq('id', user.id)
      .single(),
    admin
      .from('bookings')
      .select('id, total_price, total_services_price, total_products_price, date, start_time, dynamic_pricing_label')
      .eq('master_id', user.id)
      .neq('status', 'cancelled')
      .neq('status', 'no_show')
      .gte('date', yearAgo.toISOString().slice(0, 10)),
  ]);

  // ── Quiet-hours widget ────────────────────────────────────────────────────
  // Нові записи: мають dynamic_pricing_label з '%Тихий час%'
  // Старі записи (pre-migration): label=null, але перевіряємо час/день + факт знижки
  const quiet = (mp?.pricing_rules as PricingRules | null)?.quiet ?? null;

  function isQuietHoursBooking(b: {
    total_price: number;
    total_services_price: number;
    total_products_price: number;
    date: string;
    start_time: string | null;
    dynamic_pricing_label: string | null;
  }): boolean {
    // 1. Новий запис — є лейбл
    if (b.dynamic_pricing_label?.includes('Тихий час')) return true;

    // 2. Старий запис — перевіряємо правило + факт знижки
    if (!quiet || !b.start_time) return false;
    const baseTotal = Number(b.total_services_price) + Number(b.total_products_price);
    const wasDiscounted = Number(b.total_price) < baseTotal;
    if (!wasDiscounted) return false;

    const [yr, mo, dy] = b.date.split('-').map(Number);
    const dayKey = JS_DAY_TO_KEY[new Date(yr, mo - 1, dy).getDay()];
    if (!quiet.days.includes(dayKey)) return false;

    const hour = parseInt(b.start_time.slice(0, 2), 10);
    return hour >= quiet.hours[0] && hour < quiet.hours[1];
  }

  const quietBookings = (allBookings ?? []).filter(isQuietHoursBooking);
  const quietHoursInsight =
    quietBookings.length > 0
      ? {
          count: quietBookings.length,
          totalUah: Math.round(
            quietBookings.reduce((s, r) => s + Number(r.total_price), 0)
          ),
        }
      : null;

  // ── Tier routing ──────────────────────────────────────────────────────────
  const tier = mp?.subscription_tier;
  const isPro = tier === 'pro' || tier === 'studio';
  const isStarter = tier === 'starter';
  const extraEarned = (mp?.dynamic_pricing_extra_earned as number | null) ?? 0;
  const trialExhausted = isStarter && extraEarned >= TRIAL_LIMIT_KOP;

  if (isStarter && trialExhausted) {
    return (
      <PricingUpgradeGate
        trial={{ earned: extraEarned, limit: TRIAL_LIMIT_KOP, exhausted: true }}
        quietHoursInsight={quietHoursInsight}
      />
    );
  }

  if (isStarter) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <PricingUpgradeGate
          trial={{ earned: extraEarned, limit: TRIAL_LIMIT_KOP, exhausted: false }}
          quietHoursInsight={quietHoursInsight}
        />
        <DynamicPricingPage initial={(mp?.pricing_rules ?? {}) as PricingRules} />
      </div>
    );
  }

  if (!isPro) {
    return <PricingUpgradeGate />;
  }

  return (
    <div className="p-6">
      <DynamicPricingPage initial={(mp?.pricing_rules ?? {}) as PricingRules} />
    </div>
  );
}
