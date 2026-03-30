import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function StudioSlugPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['studio-public', slug],
    queryFn: async () => {

      const { data: ownerMp } = await supabase
        .from('master_profiles')
        .select('id, slug, studio_id')
        .eq('slug', slug!)
        .not('studio_id', 'is', null)
        .maybeSingle();

      if (!ownerMp?.studio_id) return null;

      const [studioRes, membersRes] = await Promise.all([
        supabase
          .from('studios')
          .select('id, name, owner_id')
          .eq('id', ownerMp.studio_id)
          .single(),
        supabase
          .from('studio_members')
          .select(`
            master_id, role,
            profiles!studio_members_master_id_fkey ( full_name ),
            master_profiles!studio_members_master_id_fkey ( slug, business_name, bio, avatar_emoji, rating, rating_count, categories )
          `)
          .eq('studio_id', ownerMp.studio_id)
          .order('joined_at'),
      ]);

      if (!studioRes.data) return null;

      const membersRaw = (membersRes.data ?? []) as any[];
      const masterIds = membersRaw.map((m: any) => m.master_id as string);

      const servicesRaw: any[] = masterIds.length > 0
        ? ((await supabase
            .from('services')
            .select('id, master_id, name, price, duration_minutes, is_popular, sort_order')
            .in('master_id', masterIds)
            .eq('is_active', true)
            .order('sort_order')).data ?? [])
        : [];

      const members = membersRaw.map((m: any) => {
        const mp = (m.master_profiles as any) ?? {};
        const profile = (m.profiles as any) ?? {};
        return {
          masterId: m.master_id,
          role: m.role as 'owner' | 'member',
          slug: mp.slug ?? '',
          name: mp.business_name || profile.full_name || 'Майстер',
          bio: mp.bio ?? null,
          avatarEmoji: mp.avatar_emoji ?? '💅',
          rating: Number(mp.rating ?? 0),
          ratingCount: Number(mp.rating_count ?? 0),
          categories: (mp.categories ?? []) as string[],
          services: servicesRaw
            .filter((s: any) => s.master_id === m.master_id)
            .slice(0, 5)
            .map((s: any) => ({
              id: s.id,
              name: s.name,
              price: Number(s.price),
              duration: s.duration_minutes,
              isPopular: s.is_popular,
            })),
        };
      }).sort((a: any, b: any) => {
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        return 0;
      });

      return { studio: studioRes.data, members };
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="p-6 text-sm text-[#A8928D]">Завантаження...</div>;
  if (!data) return <div className="p-6 text-center text-[#A8928D]">Студію не знайдено</div>;

  // TODO: <StudioPublicPage studio={data.studio} members={data.members} /> from @/components/public/StudioPublicPage
  return (
    <div className="p-6 text-sm text-[#A8928D]">
      StudioPublicPage ({data.studio.name}, {data.members.length} майстрів) — TODO
    </div>
  );
}
