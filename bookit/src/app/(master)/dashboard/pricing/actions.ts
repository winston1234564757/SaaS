'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PricingRules } from '@/lib/utils/dynamicPricing';
import { revalidatePath } from 'next/cache';

export async function savePricingRules(rules: PricingRules): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await createAdminClient()
    .from('master_profiles')
    .update({ pricing_rules: rules })
    .eq('id', user.id);

  revalidatePath('/dashboard/pricing');
}
