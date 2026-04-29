import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { MarketingTabs } from '@/components/master/marketing/MarketingTabs';

export const metadata: Metadata = { title: 'Маркетинг — Bookit' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [mpResult, productsResult] = await Promise.all([
    admin
      .from('master_profiles')
      .select('subscription_tier, broadcasts_used')
      .eq('id', user.id)
      .single(),
    admin
      .from('products')
      .select('id, name, price')
      .eq('master_id', user.id)
      .eq('is_active', true)
      .order('name'),
  ]);

  const tier = mpResult.data?.subscription_tier ?? 'starter';
  const isStarter = tier === 'starter';
  const isPro = tier === 'pro' || tier === 'studio';
  const broadcastsUsed = mpResult.data?.broadcasts_used ?? 0;
  const products = productsResult.data ?? [];

  const { tab } = await searchParams;
  const activeTab = tab === 'broadcasts' ? 'broadcasts' : 'stories';

  return (
    <MarketingTabs
      initialTab={activeTab}
      isStarter={isStarter}
      isPro={isPro}
      broadcastsUsed={broadcastsUsed}
      products={products}
    />
  );
}
