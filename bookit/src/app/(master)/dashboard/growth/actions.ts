'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken } from '@/lib/utils/token';

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
    partners: { id: string; partnerId: string; status: string; createdAt: string; slug: string; name: string; emoji: string; isVisible: boolean }[];
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
    .select('referral_code, partner_invite_token, subscription_tier, subscription_expires_at, lifetime_discount, referral_bounties_pending, discount_reserve')
    .eq('id', user.id)
    .single();

  const referralCode = mp?.referral_code ?? '___NONE___';

  const [
    { count: loyaltyCount },
    { count: referralCount },
    { count: activeReferralCount },
    { data: historyRpc },
    { data: connectionsData },
  ] = await Promise.all([
    admin.from('loyalty_programs').select('id', { count: 'exact', head: true }).eq('master_id', user.id),
    admin.from('master_profiles').select('id', { count: 'exact', head: true }).eq('referred_by', referralCode),
    admin.from('master_referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id).eq('status', 'active'),
    admin.rpc('get_master_referral_history', { p_referrer_id: user.id }),
    // M-GROW-02: партнери + альянси обʼєднані в master_connections (bilateral). Один запит, спліт за kind нижче.
    admin.from('master_connections').select(`
      id, other_id, kind, status, created_at, is_visible, role,
      other:master_profiles!master_connections_other_id_fkey (
        id, slug, avatar_emoji,
        profiles ( full_name )
      )
    `).eq('master_id', user.id),
  ]);

  const conns = (connectionsData ?? []) as any[];

  const partners = conns.filter(c => c.kind === 'partner').map((p: any) => {
    const prof = Array.isArray(p.other?.profiles) ? p.other.profiles[0] : p.other?.profiles;
    return {
      id: p.id as string,
      partnerId: p.other_id as string,
      status: p.status as string,
      createdAt: p.created_at as string,
      slug: (p.other?.slug as string) ?? '',
      name: (prof?.full_name as string) || 'Невідомий майстер',
      emoji: (p.other?.avatar_emoji as string) || '',
      isVisible: (p.is_visible as boolean) ?? true,
    };
  });

  const alliances = conns.filter(c => c.kind === 'alliance').map((row: any) => {
    const prof = Array.isArray(row.other?.profiles) ? row.other.profiles[0] : row.other?.profiles;
    return {
      id: row.id as string,
      isVisible: row.is_visible as boolean,
      otherId: (row.other?.id as string) ?? (row.other_id as string) ?? '',
      slug: (row.other?.slug as string) ?? '',
      name: (prof?.full_name as string) ?? 'Майстер',
      emoji: (row.other?.avatar_emoji as string) ?? '',
    };
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Generate partner_invite_token if not yet set
  let partnerToken = mp?.partner_invite_token as string | null;
  if (!partnerToken) {
    partnerToken = generateSecureToken(8);
    const { error } = await admin.from('master_profiles').update({ partner_invite_token: partnerToken }).eq('id', user.id);
    if (error?.code === '23505') {
      partnerToken = generateSecureToken(8);
      await admin.from('master_profiles').update({ partner_invite_token: partnerToken }).eq('id', user.id);
    }
  }

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
      inviteLink: `${siteUrl}/dashboard/partners/join?token=${partnerToken}`,
      alliances,
    },
  };
}
