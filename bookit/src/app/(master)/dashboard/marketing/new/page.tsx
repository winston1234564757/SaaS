import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BroadcastEditorPage } from '@/components/master/marketing/BroadcastEditorPage';

export const metadata: Metadata = { title: 'Нова розсилка — Bookit' };

export default async function NewBroadcastPage() {
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

  return (
    <BroadcastEditorPage
      isStarter={tier === 'starter'}
      broadcastsUsed={mpResult.data?.broadcasts_used ?? 0}
      products={productsResult.data ?? []}
    />
  );
}
