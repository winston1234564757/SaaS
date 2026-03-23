import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { StudioPublicPage, type StudioMemberPublic } from '@/components/public/StudioPublicPage';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: mp } = await admin
    .from('master_profiles')
    .select('business_name, studios!master_profiles_studio_id_fkey(name)')
    .eq('slug', slug)
    .not('studio_id', 'is', null)
    .maybeSingle();

  const studioName = (mp?.studios as any)?.name ?? mp?.business_name ?? 'Студія';
  return {
    title: `${studioName} — Bookit`,
    description: `Онлайн-запис до майстрів студії ${studioName}`,
  };
}

export default async function StudioSlugPage({ params }: Props) {
  const { slug } = await params;
  const admin = createAdminClient();

  // Find the owner master by slug — must belong to a studio
  const { data: ownerMp } = await admin
    .from('master_profiles')
    .select('id, slug, studio_id')
    .eq('slug', slug)
    .not('studio_id', 'is', null)
    .maybeSingle();

  if (!ownerMp?.studio_id) return notFound();

  // Get studio info + all members in parallel
  const [studioRes, membersRes] = await Promise.all([
    admin
      .from('studios')
      .select('id, name, owner_id')
      .eq('id', ownerMp.studio_id)
      .single(),
    admin
      .from('studio_members')
      .select(`
        master_id,
        role,
        profiles!studio_members_master_id_fkey ( full_name ),
        master_profiles!studio_members_master_id_fkey ( slug, business_name, bio, avatar_emoji, rating, rating_count, categories )
      `)
      .eq('studio_id', ownerMp.studio_id)
      .order('joined_at'),
  ]);

  if (!studioRes.data) return notFound();
  const studio = studioRes.data;
  const membersRaw = membersRes.data ?? [];

  // Fetch services for all members
  const masterIds = membersRaw.map(m => m.master_id);
  const { data: servicesRaw } = masterIds.length > 0
    ? await admin
        .from('services')
        .select('id, master_id, name, price, duration_minutes, is_popular, sort_order')
        .in('master_id', masterIds)
        .eq('is_active', true)
        .order('sort_order')
    : { data: [] };

  // Build members array — owner first, then members by join order
  const members: StudioMemberPublic[] = membersRaw.map(m => {
    const mp = (m.master_profiles as any) ?? {};
    const profile = (m.profiles as any) ?? {};
    return {
      masterId:    m.master_id,
      role:        m.role as 'owner' | 'member',
      slug:        mp.slug ?? '',
      name:        mp.business_name || profile.full_name || 'Майстер',
      bio:         mp.bio ?? null,
      avatarEmoji: mp.avatar_emoji ?? '💅',
      rating:      Number(mp.rating ?? 0),
      ratingCount: Number(mp.rating_count ?? 0),
      categories:  (mp.categories ?? []) as string[],
      services:    (servicesRaw ?? [])
        .filter(s => s.master_id === m.master_id)
        .slice(0, 5)
        .map(s => ({
          id:        s.id,
          name:      s.name,
          price:     Number(s.price),
          duration:  s.duration_minutes,
          isPopular: s.is_popular,
        })),
    };
  }).sort((a, b) => {
    // Owner always first
    if (a.role === 'owner') return -1;
    if (b.role === 'owner') return 1;
    return 0;
  });

  return (
    <StudioPublicPage
      studio={{ id: studio.id, name: studio.name }}
      members={members}
    />
  );
}
