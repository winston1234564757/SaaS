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
