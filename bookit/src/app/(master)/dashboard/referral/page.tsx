import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ReferralPage } from '@/components/master/referral/ReferralPage';

export const metadata: Metadata = { title: 'Реферальна програма — Bookit' };

export default async function Referral() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mp } = await supabase
    .from('master_profiles')
    .select('referral_code, subscription_tier, subscription_expires_at')
    .eq('id', user.id)
    .single();

  // Count masters who registered with this code
  const { count } = await supabase
    .from('master_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by', mp?.referral_code ?? '');

  return (
    <ReferralPage
      referralCode={mp?.referral_code ?? ''}
      referralCount={count ?? 0}
      subscriptionTier={mp?.subscription_tier ?? 'starter'}
      subscriptionExpiresAt={mp?.subscription_expires_at ?? null}
    />
  );
}
