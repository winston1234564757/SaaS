'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface GrowthPageData {
  loyaltyData: { activeCount: number };
  referralData: {
    masterId: string;
    code: string;
    count: number;
    activeCount: number;
    lifetimeDiscount: number;
    bountiesPending: number;
    discountReserve: number;
    tier: string;
    expiresAt: string | null;
    history: { refereeName: string; joinedAt: string; isFirstPaymentMade: boolean }[];
  };
  partnersData: {
    partners: { id: string; partnerId: string; status: string; createdAt: string; slug: string; name: string; emoji: string }[];
    inviteLink: string;
    alliances: { id: string; isVisible: boolean; otherId: string; slug: string; name: string; emoji: string }[];
  };
}

export async function getGrowthPageData(): Promise<GrowthPageData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  const { data: mp } = await admin
    .from('master_profiles')
    .select('referral_code, subscription_tier, subscription_expires_at, lifetime_discount, referral_bounties_pending, discount_reserve')
    .eq('id', user.id)
    .single();

  const referralCode = mp?.referral_code ?? '___NONE___';

  const [
    { count: loyaltyCount },
    { count: referralCount },
    { count: activeReferralCount },
    { data: historyRpc },
    { data: partnersData },
    { data: alliancesData },
  ] = await Promise.all([
    admin.from('loyalty_programs').select('id', { count: 'exact', head: true }).eq('master_id', user.id),
    // Cross-user: count other masters who joined via this referral code
    admin.from('master_profiles').select('id', { count: 'exact', head: true }).eq('referred_by', referralCode),
    admin.from('master_referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id).eq('status', 'active'),
    admin.rpc('get_master_referral_history', { p_referrer_id: user.id }),
    admin.from('master_partners').select(`
      id, partner_id, status, created_at,
      partner:master_profiles!master_partners_partner_id_fkey (
        id, slug, avatar_emoji,
        profiles ( full_name )
      )
    `).eq('master_id', user.id),
    admin.from('master_alliances').select(`
      id, is_visible, inviter_id, invitee_id,
      inviter:master_profiles!master_alliances_inviter_id_fkey (
        id, slug, avatar_emoji,
        profiles ( full_name )
      ),
      invitee:master_profiles!master_alliances_invitee_id_fkey (
        id, slug, avatar_emoji,
        profiles ( full_name )
      )
    `).or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`),
  ]);

  const partners = (partnersData ?? []).map((p: any) => {
    const partnerProfile = Array.isArray(p.partner.profiles) ? p.partner.profiles[0] : p.partner.profiles;
    return {
      id: p.id as string,
      partnerId: p.partner_id as string,
      status: p.status as string,
      createdAt: p.created_at as string,
      slug: p.partner.slug as string,
      name: (partnerProfile?.full_name as string) || 'Невідомий майстер',
      emoji: (p.partner.avatar_emoji as string) || '',
    };
  });

  const alliances = (alliancesData ?? []).map((row: any) => {
    const other = row.inviter_id === user.id ? row.invitee : row.inviter;
    const otherProfile = Array.isArray(other?.profiles) ? other?.profiles[0] : other?.profiles;
    return {
      id: row.id as string,
      isVisible: row.is_visible as boolean,
      otherId: other?.id ?? '',
      slug: other?.slug ?? '',
      name: otherProfile?.full_name ?? 'Майстер',
      emoji: other?.avatar_emoji ?? '',
    };
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    loyaltyData: { activeCount: loyaltyCount ?? 0 },
    referralData: {
      masterId: user.id,
      code: mp?.referral_code ?? '',
      count: referralCount ?? 0,
      activeCount: activeReferralCount ?? 0,
      lifetimeDiscount: mp?.lifetime_discount ?? 0,
      bountiesPending: mp?.referral_bounties_pending ?? 0,
      discountReserve: mp?.discount_reserve ?? 0,
      tier: mp?.subscription_tier ?? 'starter',
      expiresAt: mp?.subscription_expires_at ?? null,
      history: (historyRpc ?? []).map((r: any) => ({
        refereeName: r.referee_name as string,
        joinedAt: r.joined_at as string,
        isFirstPaymentMade: (r.is_first_payment_made as boolean) ?? false,
      })),
    },
    partnersData: {
      partners,
      inviteLink: `${siteUrl}/dashboard/partners/join?token=${mp?.referral_code || ''}`,
      alliances,
    },
  };
}
