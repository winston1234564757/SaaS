import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { DynamicPricingPage } from '@/components/master/pricing/DynamicPricingPage';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mp } = await createAdminClient()
    .from('master_profiles')
    .select('pricing_rules')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-6">
      <DynamicPricingPage initial={(mp?.pricing_rules ?? {}) as PricingRules} />
    </div>
  );
}
