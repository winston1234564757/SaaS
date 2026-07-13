import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import { serviceCategories } from '@/lib/constants/categories';
import type { ExploreMaster } from '@/components/public/explore/shared';

// Freshness ceiling for the anon-cached masters catalog. The list is identical
// for every visitor (public directory), so a shared cache entry is safe; a
// master's profile edit shows up on /explore within this window.
const EXPLORE_REVALIDATE = 60;

const DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export interface ExploreData {
  items: ExploreMaster[];
  categoryCounts: Record<string, number>;
}

async function fetchExploreMasters(): Promise<ExploreData> {
  const supabase = createPublicClient();

  // `services!inner` + фільтр по is_active відсікає майстрів, у яких нема жодної
  // активної послуги: онбординг ставить is_published=true ще до створення послуг,
  // тож без цього у вітрині висять сторінки, на яких нема чого бронювати.
  // Особисте посилання /<slug> при цьому працює — з каталогу зникає лише порожній профіль.
  const { data } = await supabase
    .from('master_profiles')
    .select(`
      id, slug, business_name, city, rating, rating_count,
      categories, subscription_tier, created_at,
      latitude, longitude,
      profiles ( full_name, avatar_url ),
      services!inner ( is_active, price, name, is_popular ),
      schedule_templates ( day_of_week, is_working ),
      portfolio_items ( is_published, portfolio_item_photos ( url, display_order ) )
    `)
    .eq('is_published', true)
    .eq('services.is_active', true)
    .order('rating_count', { ascending: false })
    .limit(120);

  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const todayDow    = DAY_MAP[today.getDay()]!;
  const tomorrowDow = DAY_MAP[tomorrow.getDay()]!;

  const items: ExploreMaster[] = ((data ?? []) as any[]).map(m => {
    const allSvcs  = (m.services ?? []) as { is_active: boolean; price: number; name: string; is_popular: boolean }[];
    const active   = allSvcs.filter(s => s.is_active);
    const prices   = active.map(s => Number(s.price || 0)).filter(p => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : null;

    const pool        = active.filter(s => s.is_popular).length ? active.filter(s => s.is_popular) : active;
    const topServices = pool.slice(0, 2).map(s => ({
      name:  s.name  as string,
      price: Math.round(Number(s.price)),
    }));

    const schedules         = (m.schedule_templates ?? []) as { day_of_week: string; is_working: boolean }[];
    const availableToday    = schedules.some(s => s.day_of_week === todayDow    && s.is_working);
    const availableTomorrow = schedules.some(s => s.day_of_week === tomorrowDow && s.is_working);

    const portfolioPhotos = ((m.portfolio_items ?? []) as {
      is_published: boolean;
      portfolio_item_photos: { url: string; display_order: number }[];
    }[])
      .filter(item => item.is_published)
      .flatMap(item =>
        (item.portfolio_item_photos ?? []).sort((a, b) => a.display_order - b.display_order)
      )
      .map(p => p.url as string)
      .filter(Boolean)
      .slice(0, 3);

    return {
      id:               m.id           as string,
      slug:             m.slug         as string,
      name:             (m.business_name || m.profiles?.full_name || 'Майстер') as string,
      city:             (m.city        as string) ?? null,
      rating:           Number(m.rating      ?? 0),
      ratingCount:      Number(m.rating_count ?? 0),
      avatarUrl:        (m.profiles?.avatar_url as string) ?? null,
      categories:       (m.categories  as string[]) ?? [],
      isPro:            m.subscription_tier === 'pro' || m.subscription_tier === 'studio',
      createdAt:        m.created_at   as string,
      minPrice,
      availableToday,
      availableTomorrow,
      topServices,
      portfolioPhotos,
      latitude:         (m.latitude  as number) ?? null,
      longitude:        (m.longitude as number) ?? null,
    };
  });

  // Category counts normalised to category id
  const categoryCounts: Record<string, number> = {};
  for (const m of items) {
    for (const cat of m.categories) {
      const def = serviceCategories.find(c => c.id === cat || c.label === cat);
      const key = def?.id ?? cat;
      categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
    }
  }

  return { items, categoryCounts };
}

/**
 * Public masters catalog for /explore. Cached in the Next data cache for
 * EXPLORE_REVALIDATE seconds (tagged for future on-demand busting) — the query
 * is identical for all visitors, so this cuts the 120-master mega-query down to
 * one DB hit per window instead of one per pageview.
 */
export const getExploreMasters = (): Promise<ExploreData> =>
  unstable_cache(fetchExploreMasters, ['explore-masters'], {
    revalidate: EXPLORE_REVALIDATE,
    tags: ['explore-masters'],
  })();
