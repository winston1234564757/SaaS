import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/public';
import { StudioPublicPage, type StudioMemberPublic } from '@/components/public/StudioPublicPage';

interface Props {
  params: Promise<{ slug: string }>;
}

interface StudioRow {
  name: string | null;
}

interface MemberMasterProfile {
  slug: string | null;
  business_name: string | null;
  bio: string | null;
  avatar_emoji: string | null;
  rating: number | null;
  rating_count: number | null;
  categories: string[] | null;
}

interface MemberProfile {
  full_name: string | null;
  avatar_url: string | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data: mp } = await supabase
    .from('master_profiles')
    .select('business_name, studios!master_profiles_studio_id_fkey(name)')
    .eq('slug', slug)
    .not('studio_id', 'is', null)
    .maybeSingle();

  const studioName = (mp?.studios as unknown as StudioRow | null)?.name ?? mp?.business_name ?? 'Студія';
  return {
    title: `${studioName} — Bookit`,
    description: `Онлайн-запис до майстрів студії ${studioName}`,
  };
}

export default async function StudioSlugPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: ownerMp } = await supabase
    .from('master_profiles')
    .select('id, slug, studio_id')
    .eq('slug', slug)
    .not('studio_id', 'is', null)
    .maybeSingle();

  if (!ownerMp?.studio_id) return notFound();

  const [studioRes, membersRes] = await Promise.all([
    supabase
      .from('studios')
      .select('id, name, owner_id')
      .eq('id', ownerMp.studio_id)
      .single(),
    supabase
      .from('studio_members')
      .select(`
        master_id,
        role,
        profiles!studio_members_master_id_fkey ( full_name, avatar_url ),
        master_profiles!studio_members_master_id_fkey ( slug, business_name, bio, avatar_emoji, rating, rating_count, categories )
      `)
      .eq('studio_id', ownerMp.studio_id)
      .order('joined_at'),
  ]);

  if (!studioRes.data) return notFound();
  const studio = studioRes.data;
  const membersRaw = membersRes.data ?? [];

  const masterIds = membersRaw.map(m => m.master_id);
  const { data: servicesRaw } = masterIds.length > 0
    ? await supabase
        .from('services')
        .select('id, master_id, name, price, duration_minutes, is_popular, sort_order')
        .in('master_id', masterIds)
        .eq('is_active', true)
        .order('sort_order')
    : { data: [] };

  const members: StudioMemberPublic[] = membersRaw.map(m => {
    const mp = (m.master_profiles as unknown as MemberMasterProfile | null) ?? {} as MemberMasterProfile;
    const profile = (m.profiles as unknown as MemberProfile | null) ?? {} as MemberProfile;
    return {
      masterId:    m.master_id,
      role:        m.role as 'owner' | 'member',
      slug:        mp.slug ?? '',
      name:        mp.business_name || profile.full_name || 'Майстер',
      bio:         mp.bio ?? null,
      avatarEmoji: mp.avatar_emoji ?? '💅',
      avatarUrl:  (profile.avatar_url as string) ?? null,
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
