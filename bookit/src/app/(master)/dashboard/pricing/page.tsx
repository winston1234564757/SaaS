import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { DynamicPricingPage } from '@/components/master/pricing/DynamicPricingPage';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mp } = await createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
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
