import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ReferralPage } from '@/components/master/referral/ReferralPage';

export const metadata: Metadata = { title: 'Реферальна програма — Bookit' };

export default async function Referral() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Use admin client for referral queries: RLS on master_profiles only allows
  // is_published=true, which would hide unpublished referees from counts/history.
  const admin = createAdminClient();

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
    admin
      .from('master_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', mp?.referral_code ?? ''),
    admin
      .from('master_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .eq('status', 'active'),
    admin
      .from('master_referrals')
      .select('referee_id, is_first_payment_made, created_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  // Fetch names separately to avoid RLS blocking unpublished referee profiles
  const refereeIds = (historyData ?? []).map((r: any) => r.referee_id as string);
  const { data: profilesData } = refereeIds.length > 0
    ? await admin.from('profiles').select('id, full_name').in('id', refereeIds)
    : { data: [] };
  const nameMap = Object.fromEntries((profilesData ?? []).map((p: any) => [p.id, p.full_name]));

  const history = (historyData ?? []).map((r: any) => ({
    refereeId:          r.referee_id,
    refereeName:        nameMap[r.referee_id] ?? 'Майстер',
    joinedAt:           r.created_at,
    isFirstPaymentMade: r.is_first_payment_made ?? false,
  }));

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
