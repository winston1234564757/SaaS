import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { ExplorePage } from '@/components/public/ExplorePage';

export const metadata: Metadata = {
  title: 'Знайти майстра — Bookit',
  description: 'Знайди свого майстра краси: нігті, волосся, брови, макіяж та більше. Онлайн-запис одразу.',
};

export default async function Explore() {
  const supabase = createAdminClient();

  const { data: masters } = await supabase
    .from('master_profiles')
    .select(`
      id, slug, bio, city, rating, rating_count,
      avatar_emoji, categories, subscription_tier, created_at,
      profiles!inner ( full_name ),
      services ( id, active )
    `)
    .eq('is_published', true)
    .order('rating_count', { ascending: false })
    .limit(120);

  // Unique cities sorted alphabetically
  const cities = Array.from(
    new Set(
      (masters ?? [])
        .map((m: any) => m.city as string | null)
        .filter((c): c is string => !!c && c.trim().length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, 'uk'));

  const items = (masters ?? []).map((m: any) => ({
    id: m.id as string,
    slug: m.slug as string,
    name: (m.profiles?.full_name as string) ?? 'Майстер',
    bio: (m.bio as string) || null,
    city: (m.city as string) || null,
    rating: Number(m.rating ?? 0),
    ratingCount: Number(m.rating_count ?? 0),
    avatarEmoji: (m.avatar_emoji as string) ?? '💅',
    categories: (m.categories as string[]) ?? [],
    isPro: m.subscription_tier === 'pro' || m.subscription_tier === 'studio',
    serviceCount: ((m.services ?? []) as { active: boolean }[]).filter(s => s.active).length,
    createdAt: m.created_at as string,
  }));

  return <ExplorePage masters={items} cities={cities} />;
}
