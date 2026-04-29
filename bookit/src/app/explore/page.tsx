import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ExplorePage } from '@/components/public/ExplorePage';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Знайти майстра — Bookit',
  description: 'Знайди свого майстра краси: нігті, волосся, брови, макіяж та більше. Онлайн-запис одразу.',
};

export default async function Explore() {
  const supabase = await createClient();

  const { data: masters, error: mastersError } = await supabase
    .from('master_profiles')
    .select(`
      id, slug, business_name, bio, city, rating, rating_count,
      avatar_emoji, categories, subscription_tier, created_at,
      profiles ( full_name ),
      services ( id, is_active )
    `)
    .eq('is_published', true)
    .order('rating_count', { ascending: false })
    .limit(120);

  if (mastersError) {
    console.error('[Explore] Supabase Query Error:', mastersError);
  }
  if (!masters?.length) {
    console.error('[Explore] No masters returned. is_published filter may be too strict, or RLS is blocking reads.');
  }

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
    name: m.business_name || (m.profiles?.full_name as string) || 'Майстер',
    bio: (m.bio as string) || null,
    city: (m.city as string) || null,
    rating: Number(m.rating ?? 0),
    ratingCount: Number(m.rating_count ?? 0),
    avatarEmoji: (m.avatar_emoji as string) ?? '💅',
    categories: (m.categories as string[]) ?? [],
    isPro: m.subscription_tier === 'pro' || m.subscription_tier === 'studio',
    serviceCount: ((m.services ?? []) as { is_active: boolean }[]).filter(s => s.is_active).length,
    createdAt: m.created_at as string,
  }));

  return <ExplorePage masters={items} cities={cities} />;
}
