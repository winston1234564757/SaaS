import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ExplorePage } from '@/components/public/ExplorePage';
import { serviceCategories } from '@/lib/constants/categories';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Знайти майстра — Bookit',
  description: 'Знайди свого майстра краси: нігті, волосся, брови, макіяж та більше. Онлайн-запис одразу.',
};

const DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export default async function Explore() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [mastersResult, bookingsResult] = await Promise.all([
    supabase
      .from('master_profiles')
      .select(`
        id, slug, business_name, city, rating, rating_count,
        categories, subscription_tier, created_at,
        latitude, longitude,
        profiles ( full_name, avatar_url ),
        services ( is_active, price, name, is_popular ),
        schedule_templates ( day_of_week, is_working ),
        portfolio_items ( is_published, portfolio_item_photos ( url, display_order ) )
      `)
      .eq('is_published', true)
      .order('rating_count', { ascending: false })
      .limit(120),

    user
      ? supabase
          .from('bookings')
          .select('master_profiles!inner(categories)')
          .eq('client_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: null, error: null }),
  ]);

  // Smart sort: preferred categories from booking history
  let preferredCategories: string[] = [];
  if (bookingsResult.data?.length) {
    const counts: Record<string, number> = {};
    for (const b of bookingsResult.data) {
      const cats = (b.master_profiles as any)?.categories as string[] | undefined;
      for (const c of cats ?? []) {
        counts[c] = (counts[c] ?? 0) + 1;
      }
    }
    preferredCategories = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([cat]) => cat)
      .slice(0, 5);
  }

  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const todayDow    = DAY_MAP[today.getDay()]!;
  const tomorrowDow = DAY_MAP[tomorrow.getDay()]!;

  const items = ((mastersResult.data ?? []) as any[]).map(m => {
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

  // Client's C2B referral code for the inline "invite your master" CTA (read-only;
  // generation happens in /my/loyalty). Absent for anon/masters → CTA routes there.
  let inviteCode: string | null = null;
  if (user) {
    const { data: cp } = await supabase
      .from('client_profiles')
      .select('c2b_referral_code')
      .eq('id', user.id)
      .maybeSingle();
    inviteCode = (cp?.c2b_referral_code as string | null) ?? null;
  }

  return (
    <ExplorePage
      masters={items}
      categoryCounts={categoryCounts}
      preferredCategories={preferredCategories}
      inviteCode={inviteCode}
    />
  );
}
