'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PricingRules } from '@/lib/utils/dynamicPricing';
import { revalidatePath } from 'next/cache';
export async function savePricingRules(rules: PricingRules): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: mp } = await createAdminClient()
    .from('master_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const isPro = mp?.subscription_tier === 'pro' || mp?.subscription_tier === 'studio';
  if (!isPro) return { error: 'Динамічне ціноутворення доступне лише в тарифі Pro.' };

  await createAdminClient()
    .from('master_profiles')
    .update({ pricing_rules: rules })
    .eq('id', user.id);
  revalidatePath('/', 'layout');
  return {};
}
