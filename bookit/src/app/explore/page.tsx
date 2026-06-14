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
      profiles ( full_name, avatar_url ),
      services ( id, is_active, price, name, is_popular ),
      schedule_templates ( day_of_week, is_working ),
      reviews ( comment, created_at ),
      portfolio_items ( id, is_published, portfolio_item_photos ( url, display_order ) )
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

  const cities = Array.from(
    new Set(
      (masters ?? [])
        .map((m: any) => m.city as string | null)
        .filter((c): c is string => !!c && c.trim().length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, 'uk'));

  const DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const todayDow = DAY_MAP[new Date().getDay()];

  const items = (masters ?? []).map((m: any) => {
    const allServices = ((m.services ?? []) as { is_active: boolean; price: number; name: string; is_popular: boolean }[]);
    const activeServices = allServices.filter(s => s.is_active);
    const prices = activeServices.map(s => Number(s.price || 0)).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;

    const popularServices = activeServices.filter(s => s.is_popular);
    const servicePool = popularServices.length > 0 ? popularServices : activeServices;
    const topServices = servicePool.slice(0, 3).map(s => ({
      name: s.name as string,
      price: Math.round(Number(s.price)),
    }));
    const serviceNames = activeServices.map(s => s.name).join(' ');

    const schedules = ((m.schedule_templates ?? []) as { day_of_week: string; is_working: boolean }[]);
    const availableToday = schedules.some(s => s.day_of_week === todayDow && s.is_working);

    const reviewList = ((m.reviews ?? []) as { comment: string; created_at: string }[]);
    const latestReview = reviewList.length > 0
      ? reviewList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.comment ?? null
      : null;

    const portfolioPhotos = ((m.portfolio_items ?? []) as { is_published: boolean; portfolio_item_photos: { url: string; display_order: number }[] }[])
      .filter(item => item.is_published)
      .flatMap(item => (item.portfolio_item_photos ?? []).sort((a, b) => a.display_order - b.display_order))
      .map(p => p.url as string)
      .filter(Boolean)
      .slice(0, 3);

    return {
      id: m.id as string,
      slug: m.slug as string,
      name: m.business_name || (m.profiles?.full_name as string) || 'Майстер',
      bio: (m.bio as string) || null,
      city: (m.city as string) || null,
      rating: Number(m.rating ?? 0),
      ratingCount: Number(m.rating_count ?? 0),
      avatarEmoji: (m.avatar_emoji as string) ?? '',
      avatarUrl: (m.profiles?.avatar_url as string) ?? null,
      categories: (m.categories as string[]) ?? [],
      isPro: m.subscription_tier === 'pro' || m.subscription_tier === 'studio',
      serviceCount: activeServices.length,
      createdAt: m.created_at as string,
      minPrice,
      availableToday,
      topServices,
      serviceNames,
      latestReview,
      portfolioPhotos,
    };
  });

  return <ExplorePage masters={items} cities={cities} />;
}
