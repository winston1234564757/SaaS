'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Runtime Zod schema matching PricingRules interface in dynamicPricing.ts
const dayEnum = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
const hoursRange = z.tuple([
  z.number().int().min(0).max(23),
  z.number().int().min(1).max(24),
]).refine(([s, e]) => e > s, 'Кінець має бути більше початку');

const pricingRulesSchema = z.object({
  peak: z.object({
    days: z.array(dayEnum).min(1).max(7),
    hours: hoursRange,
    markup_pct: z.number().min(1).max(50),
  }).optional(),
  quiet: z.object({
    days: z.array(dayEnum).min(1).max(7),
    hours: hoursRange,
    discount_pct: z.number().min(1).max(30),
  }).optional(),
  early_bird: z.object({
    days_ahead: z.number().int().min(1).max(30),
    discount_pct: z.number().min(1).max(30),
  }).optional(),
  last_minute: z.object({
    hours_ahead: z.number().int().min(1).max(72),
    discount_pct: z.number().min(1).max(30),
  }).optional(),
}).strict();

export async function savePricingRules(rules: unknown): Promise<{ error?: string }> {
  // BL-04: Validate at runtime — TypeScript types are compile-time only
  const parsed = pricingRulesSchema.safeParse(rules);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Невірні дані правил' };
  }

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
  if (!isPro && !isStarter) return { error: 'Динамічне ціноутворення недоступне на вашому тарифі.' };

  const { error: dbError } = await createAdminClient()
    .from('master_profiles')
    .update({ pricing_rules: parsed.data })
    .eq('id', user.id);

  if (dbError) return { error: dbError.message };
  return {};
}
