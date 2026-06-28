'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

export async function savePricingRules(rules: PricingRules): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: mp } = await createAdminClient()
    .from('master_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const tier = mp?.subscription_tier;
  const isPro = tier === 'pro' || tier === 'studio';
  const isStarter = tier === 'starter';
  // Starter має trial-доступ до налаштування правил
  if (!isPro && !isStarter) return { error: 'Динамічне ціноутворення недоступне на вашому тарифі.' };

  const { error: dbError } = await createAdminClient()
    .from('master_profiles')
    .update({ pricing_rules: rules })
    .eq('id', user.id);

  if (dbError) return { error: dbError.message };
  return {};
}

/**
 * Кількість «врятованих слотів» — записів, які прийшли завдяки знижковому правилу
 * (Тихий час / Рання бронь / Остання хвилина). Чисто-знижкові = лейбл є, але
 * надбавки нема (dynamic_extra_kopecks = 0). Read-side, RLS майстра.
 */
export async function getDynamicPricingSavedSlots(): Promise<{ count: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0 };

  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('master_id', user.id)
    .in('status', ['confirmed', 'completed'])
    .not('dynamic_pricing_label', 'is', null)
    .eq('dynamic_extra_kopecks', 0);

  return { count: count ?? 0 };
}

export interface PricingRuleStats {
  usage_count: number;
  earned_kopecks: number;
  avg_pct: number | null;
  last_date: string | null;
  recent: { client_name: string | null; date: string | null }[];
}

/**
 * Статистика одного правила ціноутворення (для модалки). RPC фільтрує по auth.uid()
 * (без IDOR). marker = підрядок лейбла: 'Пік' / 'Тихий час' / 'Рання бронь' / 'Остання хвилина'.
 */
export async function getPricingRuleStats(marker: string): Promise<PricingRuleStats | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc('get_pricing_rule_stats', { p_rule_marker: marker });
  if (error) {
    console.error('[getPricingRuleStats]', error.message);
    return null;
  }
  return data as PricingRuleStats;
}

export interface PricingRulesOverview {
  peak: { count: number; earned_kopecks: number };
  quiet: { count: number };
  early_bird: { count: number };
  last_minute: { count: number };
}

/**
 * Огляд усіх 4 правил за один виклик (M-REV-05). RPC через auth.uid() (без IDOR).
 * Надбавка: count + earned_kopecks. Знижки: count (врятовані слоти).
 */
export async function getPricingRulesOverview(): Promise<PricingRulesOverview | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc('get_pricing_rules_overview');
  if (error) {
    console.error('[getPricingRulesOverview]', error.message);
    return null;
  }
  return data as PricingRulesOverview;
}
