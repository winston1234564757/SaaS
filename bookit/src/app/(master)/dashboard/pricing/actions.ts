'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import type { PricingRules } from '@/lib/utils/dynamicPricing';
import { revalidatePath } from 'next/cache';

export async function savePricingRules(rules: PricingRules): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
    .from('master_profiles')
    .update({ pricing_rules: rules })
    .eq('id', user.id);

  revalidatePath('/dashboard/pricing');
}
