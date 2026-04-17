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
    { data: partnersData }
  ] = await Promise.all([
    admin
      .from('master_profiles')
      .select('referral_code, subscription_tier, subscription_expires_at')
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
      .from('master_partners')
      .select(`
        id, partner_id, status, created_at,
        partner:master_profiles!master_partners_partner_id_fkey (
          id, slug, avatar_emoji,
          profiles ( full_name )
        )
      `)
      .eq('master_id', user.id)
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
    tier: mp?.subscription_tier ?? 'starter',
    expiresAt: mp?.subscription_expires_at ?? null,
  };

  const pData = {
    partners,
    inviteLink: partnersInviteLink,
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
