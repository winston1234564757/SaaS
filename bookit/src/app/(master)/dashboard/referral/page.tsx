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
    .select('referral_code, subscription_tier, subscription_expires_at, lifetime_discount, referral_bounties_pending, discount_reserve')
    .eq('id', user.id)
    .single();

  const [
    { count: totalCount },
    { count: activeCount },
    { data: historyData },
  ] = await Promise.all([
    supabase
      .from('master_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', mp?.referral_code ?? ''),
    supabase
      .from('master_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('master_referrals')
      .select(`
        referee_id,
        is_first_payment_made,
        created_at,
        referee:master_profiles!master_referrals_referee_id_fkey (
          profiles ( full_name )
        )
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const history = (historyData ?? []).map((r: any) => {
    const profile = Array.isArray(r.referee?.profiles) ? r.referee?.profiles[0] : r.referee?.profiles;
    return {
      refereeId:          r.referee_id,
      refereeName:        profile?.full_name ?? 'Майстер',
      joinedAt:           r.created_at,
      isFirstPaymentMade: r.is_first_payment_made ?? false,
    };
  });

  return (
    <ReferralPage
      masterId={user.id}
      referralCode={mp?.referral_code ?? ''}
      referralCount={totalCount ?? 0}
      activeReferralCount={activeCount ?? 0}
      lifetimeDiscount={mp?.lifetime_discount ?? 0}
      referralBountiesPending={mp?.referral_bounties_pending ?? 0}
      discountReserve={mp?.discount_reserve ?? 0}
      subscriptionTier={mp?.subscription_tier ?? 'starter'}
      subscriptionExpiresAt={mp?.subscription_expires_at ?? null}
      history={history}
    />
  );
}
