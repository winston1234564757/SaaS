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
      services ( id, is_active, price_kopecks ),
      master_schedules ( day_of_week, is_enabled )
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

  // JS getDay(): 0=Sun, 1=Mon...6=Sat
  const todayDOW = new Date().getDay();

  const items = (masters ?? []).map((m: any) => {
    const activeServices = ((m.services ?? []) as { is_active: boolean; price_kopecks: number }[]).filter(s => s.is_active);
    const nonZeroPrices = activeServices.map(s => Number(s.price_kopecks || 0)).filter(p => p > 0);
    const minPriceKopecks = nonZeroPrices.length ? Math.min(...nonZeroPrices) : null;

    const availableToday = ((m.master_schedules ?? []) as { day_of_week: number; is_enabled: boolean }[])
      .some(s => s.day_of_week === todayDOW && s.is_enabled);

    return {
      id: m.id as string,
      slug: m.slug as string,
      name: m.business_name || (m.profiles?.full_name as string) || 'Майстер',
      bio: (m.bio as string) || null,
      city: (m.city as string) || null,
      rating: Number(m.rating ?? 0),
      ratingCount: Number(m.rating_count ?? 0),
      avatarEmoji: (m.avatar_emoji as string) ?? '💅',
      avatarUrl: (m.profiles?.avatar_url as string) ?? null,
      categories: (m.categories as string[]) ?? [],
      isPro: m.subscription_tier === 'pro' || m.subscription_tier === 'studio',
      serviceCount: activeServices.length,
      createdAt: m.created_at as string,
      minPrice: minPriceKopecks !== null ? Math.round(minPriceKopecks / 100) : null,
      availableToday,
    };
  });

  return <ExplorePage masters={items} cities={cities} />;
}
