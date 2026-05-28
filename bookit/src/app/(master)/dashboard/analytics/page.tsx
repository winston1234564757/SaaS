import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsClientLoader } from '@/components/master/analytics/AnalyticsClientLoader';

export const metadata: Metadata = { title: 'Аналітика — Bookit' };

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isPro = false;
  if (user) {
    const { data } = await supabase
      .from('master_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    isPro =
      data?.subscription_tier === 'pro' ||
      data?.subscription_tier === 'studio';
  }

  return <AnalyticsClientLoader isPro={isPro} />;
}
