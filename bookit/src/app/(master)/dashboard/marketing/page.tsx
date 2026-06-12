import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MarketingTabs } from '@/components/master/marketing/MarketingTabs';

export const metadata: Metadata = { title: 'Маркетинг — Bookit' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mode?: string; portfolioId?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [mpResult, productsResult] = await Promise.all([
    supabase
      .from('master_profiles')
      .select('subscription_tier, broadcasts_used')
      .eq('id', user.id)
      .single(),
    supabase
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

  const { tab, mode, portfolioId } = await searchParams;
  const activeTab = tab === 'broadcasts' ? 'broadcasts' : 'stories';
  const activeMode = mode ?? (portfolioId ? 'portfolio_item' : undefined);

  return (
    <MarketingTabs
      initialTab={activeTab}
      initialMode={activeMode}
      initialPortfolioId={portfolioId}
      isStarter={isStarter}
      isPro={isPro}
      broadcastsUsed={broadcastsUsed}
      products={products}
    />
  );
}
