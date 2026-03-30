import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ExplorePageView } from '@/components/public/ExplorePage';

interface MasterRow {
  id: string;
  slug: string;
  bio: string | null;
  city: string | null;
  rating: number;
  rating_count: number;
  avatar_emoji: string;
  categories: string[];
  subscription_tier: string;
  created_at: string;
  profiles: { full_name: string } | null;
  services: { id: string; is_active: boolean }[];
}

export function ExplorePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['explore-masters'],
    queryFn: async () => {
      const supabase = createClient();

      const { data: masters, error } = await supabase
        .from('master_profiles')
        .select(`
          id, slug, bio, city, rating, rating_count,
          avatar_emoji, categories, subscription_tier, created_at,
          profiles ( full_name ),
          services ( id, is_active )
        `)
        .eq('is_published', true)
        .order('rating_count', { ascending: false })
        .limit(120);

      if (error) {
        console.error('[Explore] Supabase Query Error:', error);
        throw error;
      }

      const citySet = new Set<string>();
      for (const m of (masters ?? [])) {
        if (m.city && m.city.trim().length > 0) citySet.add(m.city);
      }
      const cities: string[] = Array.from(citySet).sort((a, b) => a.localeCompare(b, 'uk'));

      const items = (masters ?? []).map((m: MasterRow) => ({
        id: m.id,
        slug: m.slug,
        name: m.profiles?.full_name ?? 'Майстер',
        bio: m.bio || null,
        city: m.city || null,
        rating: Number(m.rating ?? 0),
        ratingCount: Number(m.rating_count ?? 0),
        avatarEmoji: m.avatar_emoji ?? '💅',
        categories: m.categories ?? [],
        isPro: m.subscription_tier === 'pro' || m.subscription_tier === 'studio',
        serviceCount: (m.services ?? []).filter(s => s.is_active).length,
        createdAt: m.created_at,
      }));

      return { items, cities };
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #FFD2C2 0%, #F0EAE8 50%, #D4E8E7 100%)' }}
      >
        <div className="w-8 h-8 border-2 border-[#789A99] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ExplorePageView
      masters={data?.items ?? []}
      cities={data?.cities ?? []}
    />
  );
}
