import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { StudioPage } from '@/components/master/studio/StudioPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Студія — Bookit' };

export default async function Studio() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mp } = await supabase
    .from('master_profiles')
    .select('id, studio_id, subscription_tier')
    .eq('id', user.id)
    .single();

  // If in a studio — load studio data
  let studio = null;
  let members: {
    master_id: string;
    role: string;
    joined_at: string;
    profiles: { full_name: string } | null;
    master_profiles: { slug: string; avatar_emoji: string; bookings_this_month: number } | null;
  }[] = [];

  if (mp?.studio_id) {
    const { data: studioData } = await supabase
      .from('studios')
      .select('id, name, invite_token, owner_id')
      .eq('id', mp.studio_id)
      .single();

    studio = studioData;

    if (studioData) {
      const { data: membersData } = await supabase
        .from('studio_members')
        .select(`
          master_id, role, joined_at,
          profiles!studio_members_master_id_fkey ( full_name ),
          master_profiles!studio_members_master_id_fkey ( slug, avatar_emoji, bookings_this_month )
        `)
        .eq('studio_id', studioData.id)
        .order('joined_at');

      members = (membersData ?? []) as unknown as typeof members;
    }
  }

  return (
    <StudioPage
      currentUserId={user.id}
      subscriptionTier={mp?.subscription_tier ?? 'starter'}
      studio={studio ? {
        id: studio.id,
        name: studio.name,
        inviteToken: studio.invite_token,
        ownerId: studio.owner_id,
      } : null}
      members={members.map(m => ({
        masterId: m.master_id,
        role: m.role as 'owner' | 'member',
        joinedAt: m.joined_at,
        fullName: (m.profiles as any)?.full_name ?? 'Майстер',
        slug: (m.master_profiles as any)?.slug ?? '',
        avatarEmoji: (m.master_profiles as any)?.avatar_emoji ?? '💅',
        bookingsThisMonth: (m.master_profiles as any)?.bookings_this_month ?? 0,
      }))}
    />
  );
}
