import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { PartnersPage } from '@/components/master/partners/PartnersPage';

export const metadata: Metadata = { title: 'Партнерська мережа — Bookit' };

export default async function PartnersRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Get current master details & invite link
  const [{ data: mp }, { data: partnersData }] = await Promise.all([
    supabase
      .from('master_profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single(),
    supabase
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

  const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/partners/join?token=${mp?.referral_code || ''}`;

  return (
    <PartnersPage 
      partners={partners}
      inviteLink={inviteLink}
    />
  );
}
