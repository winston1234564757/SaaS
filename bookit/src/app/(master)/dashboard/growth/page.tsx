import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { GrowthHubClient } from '@/components/master/growth/GrowthHubClient';

export default async function GrowthHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Fetch data for all three Growth sections in parallel
  const [
    { data: mp },
    { count: loyaltyCount },
    { count: referralCount },
    { count: activeReferralCount },
    { data: partnersData },
    { data: alliancesData },
  ] = await Promise.all([
    admin
      .from('master_profiles')
      .select('referral_code, subscription_tier, subscription_expires_at, lifetime_discount, referral_bounties_pending, discount_reserve')
      .eq('id', user.id)
      .single(),
    admin
      .from('loyalty_programs')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', user.id),
    admin
      .from('master_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', (await admin.from('master_profiles').select('referral_code').eq('id', user.id).single()).data?.referral_code ?? '___NONE___'),
    admin
      .from('master_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .eq('status', 'active'),
    admin
      .from('master_partners')
      .select(`
        id, partner_id, status, created_at,
        partner:master_profiles!master_partners_partner_id_fkey (
          id, slug, avatar_emoji,
          profiles ( full_name )
        )
      `)
      .eq('master_id', user.id),
    // Alliance rows for visibility toggle (Network section)
    admin
      .from('master_alliances')
      .select(`
        id, is_visible, inviter_id, invitee_id,
        inviter:master_profiles!master_alliances_inviter_id_fkey (
          id, slug, avatar_emoji,
          profiles ( full_name )
        ),
        invitee:master_profiles!master_alliances_invitee_id_fkey (
          id, slug, avatar_emoji,
          profiles ( full_name )
        )
      `)
      .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`),
  ]);

  // Transform partners data
  const partners = (partnersData ?? []).map((p: any) => {
    const partnerProfile = Array.isArray(p.partner.profiles) ? p.partner.profiles[0] : p.partner.profiles;
    return {
      id: p.id,
      partnerId: p.partner_id,
      status: p.status,
      createdAt: p.created_at,
      slug: p.partner.slug,
      name: partnerProfile?.full_name || 'Невідомий майстер',
      emoji: p.partner.avatar_emoji || '💅',
    };
  });

  const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${mp?.referral_code || ''}`;
  const partnersInviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/partners/join?token=${mp?.referral_code || ''}`;

  const loyaltyData = {
    activeCount: loyaltyCount ?? 0,
  };

  const referralData = {
    masterId: user.id,
    code: mp?.referral_code ?? '',
    count: referralCount ?? 0,
    activeCount: activeReferralCount ?? 0,
    lifetimeDiscount: mp?.lifetime_discount ?? 0,
    bountiesPending:  mp?.referral_bounties_pending ?? 0,
    discountReserve:  mp?.discount_reserve ?? 0,
    tier: mp?.subscription_tier ?? 'starter',
    expiresAt: mp?.subscription_expires_at ?? null,
  };

  // Build alliance list — pick the "other" side of each row
  const alliances = (alliancesData ?? []).map((row: any) => {
    const other = row.inviter_id === user.id ? row.invitee : row.inviter;
    const otherProfile = Array.isArray(other?.profiles) ? other?.profiles[0] : other?.profiles;
    return {
      id:        row.id as string,
      isVisible: row.is_visible as boolean,
      otherId:   other?.id ?? '',
      slug:      other?.slug ?? '',
      name:      otherProfile?.full_name ?? 'Майстер',
      emoji:     other?.avatar_emoji ?? '💅',
    };
  });

  const pData = {
    partners,
    inviteLink: partnersInviteLink,
    alliances,
  };

  return (
    <div className="p-4 md:p-6 lg:p-0">
      <GrowthHubClient 
        loyaltyData={loyaltyData} 
        referralData={referralData} 
        partnersData={pData}
      />
    </div>
  );
}
