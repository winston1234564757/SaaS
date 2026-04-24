import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies, headers } from 'next/headers';
import { toZonedTime } from 'date-fns-tz';
import { getNow } from '@/lib/utils/now';
import { PublicMasterPage } from '@/components/public/PublicMasterPage';
import { ALL_STEPS } from '@/components/shared/wizard/helpers';

export const revalidate = 300;

export async function generateStaticParams() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('master_profiles')
    .select('slug')
    .eq('is_published', true)
    .order('rating', { ascending: false })
    .limit(50);
  return (data ?? []).map(({ slug }) => ({ slug }));
}

async function getMaster(slug: string) {
  // Admin client bypasses RLS — needed for profiles!inner join on public pages
  const supabase = createAdminClient();

  let query = supabase
    .from('master_profiles')
    .select(`
      id, slug, bio, city, address, latitude, longitude, floor, cabinet, rating, rating_count,
      subscription_tier, instagram_url, telegram_url, categories,
      mood_theme, avatar_emoji, pricing_rules, working_hours,
      profiles!inner ( full_name, avatar_url ),
      services ( id, name, emoji, category, price, duration_minutes, is_popular, is_active, sort_order, description )
    `)
    .eq('slug', slug);

  if (process.env.NODE_ENV === 'production') {
    query = query.eq('is_published', true);
  }

  const { data } = await query.single();
  return data;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const master = await getMaster(slug);
  if (!master) return { title: 'Майстер не знайдений' };

  const profile = master.profiles as unknown as { full_name: string; avatar_url: string | null };
  return {
    title: `${profile.full_name} — Bookit`,
    description: master.bio ?? `Онлайн-запис до ${profile.full_name}`,
    openGraph: {
      title: profile.full_name,
      description: master.bio ?? '',
    },
  };
}

export default async function MasterPublicPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const data = await getMaster(slug);
  if (!data) notFound();

  // Server-side UA detection для native map deep links (no client JS needed)
  const headersList = await headers();
  const ua = headersList.get('user-agent') ?? '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  const locationQuery = data.address && data.city && data.address.toLowerCase().includes(data.city.toLowerCase())
    ? data.address
    : [data.city, data.address].filter(Boolean).join(', ');
  const lat = (data as any).latitude as number | null;
  const lng = (data as any).longitude as number | null;
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';

  // Prefer precise lat/lng deep links over text search
  const mapUrl = hasCoords
    ? isIOS
      ? `maps://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(locationQuery || 'Майстер')}`
      : isAndroid
        ? `comgooglemaps://?center=${lat},${lng}&q=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : locationQuery
      ? isIOS
        ? `maps://maps.apple.com/?q=${encodeURIComponent(locationQuery)}`
        : isAndroid
          ? `comgooglemaps://?q=${encodeURIComponent(locationQuery)}`
          : `https://maps.google.com/?q=${encodeURIComponent(locationQuery)}`
      : null;

  const supabase = await createClient();
  const cookieStore = await cookies();
  const debugNow = cookieStore.get('next-public-debug-now')?.value;
  const now = debugNow ? new Date(decodeURIComponent(debugNow)) : getNow();

  // Поточний юзер (null якщо не залогінений)
  const { data: { user } } = await supabase.auth.getUser();

  // Межа місячного ліміту — рахуємо динамічно з bookings (не з лічильника bookings_this_month)
  const masterTimezone = (data as any).timezone || 'Europe/Kyiv';
  const nowInMasterTZ = toZonedTime(getNow(), masterTimezone);
  const monthStart = new Date(
    nowInMasterTZ.getFullYear(), nowInMasterTZ.getMonth(), 1
  ).toISOString();

  // Паралельно завантажуємо products, reviews, schedule, monthly count, flash deals, loyalty
  const [productsRes, reviewsRes, scheduleRes, monthlyCountRes, flashDealsRes, loyaltyRes, relationRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price, description, emoji, stock_quantity, stock_unlimited')
      .eq('master_id', data.id)
      .eq('is_active', true)
      .order('sort_order')
      .limit(20),
    supabase
      .from('reviews')
      .select('id, rating, comment, client_name, created_at')
      .eq('master_id', data.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('schedule_templates')
      .select('day_of_week, start_time, end_time, is_working')
      .eq('master_id', data.id),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', data.id)
      .gte('created_at', monthStart)
      .neq('status', 'cancelled'),
    supabase
      .from('flash_deals')
      .select('id, service_id, service_name, slot_date, slot_time, original_price, discount_pct, expires_at')
      .eq('master_id', data.id)
      .eq('status', 'active')
      .gt('expires_at', getNow().toISOString())
      .order('expires_at', { ascending: true })
      .limit(5),
    supabase
      .from('loyalty_programs')
      .select('target_visits, reward_type, reward_value')
      .eq('master_id', data.id)
      .eq('is_active', true)
      .order('target_visits', { ascending: true }),
    user
      ? supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('master_id', data.id)
          .eq('client_id', user.id)
          .eq('status', 'completed')
      : Promise.resolve({ count: null, error: null }),
  ]);

  const profile = data.profiles as unknown as { full_name: string; avatar_url: string | null };

  const services = (data.services as any[])
    .filter(s => s.is_active)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(s => ({
      id: s.id as string,
      name: s.name as string,
      emoji: (s.emoji as string) ?? '✨',
      category: (s.category as string) ?? 'Інше',
      price: Number(s.price),
      duration: s.duration_minutes as number,
      popular: s.is_popular as boolean,
      description: (s.description as string) || null,
    }));

  const products = (productsRes.data ?? []).map((p: any) => ({
    id: p.id as string,
    name: p.name as string,
    price: Number(p.price),
    description: (p.description as string) || null,
    emoji: (p.emoji as string) ?? '✨',
    inStock: p.stock_unlimited ? true : (p.stock_quantity as number) > 0,
  }));

  const reviews = (reviewsRes.data ?? []).map((r: any) => ({
    id: r.id as string,
    rating: r.rating as number,
    comment: (r.comment as string) || null,
    clientName: (r.client_name as string) || 'Клієнт',
    createdAt: r.created_at as string,
  }));

  const schedule = (scheduleRes.data ?? []).map((s: any) => ({
    day: s.day_of_week as string,
    isWorking: s.is_working as boolean,
    startTime: (s.start_time as string | null)?.slice(0, 5) ?? '09:00',
    endTime: (s.end_time as string | null)?.slice(0, 5) ?? '18:00',
  }));

  const loyaltyTiers = (loyaltyRes.data ?? []).map((p: any) => ({
    targetVisits: p.target_visits as number,
    rewardType: p.reward_type as string,
    rewardValue: p.reward_value as number,
  }));
  const currentVisits = relationRes.count ?? 0;
  const loyalty = loyaltyTiers.length > 0
    ? { tiers: loyaltyTiers, currentVisits, isAuth: !!user }
    : null;

  const flashDeals = (flashDealsRes.data ?? []).map((d: any) => ({
    id: d.id as string,
    serviceId: (d.service_id as string) || undefined,
    serviceName: d.service_name as string,
    slotDate: d.slot_date as string,
    slotTime: (d.slot_time as string).slice(0, 5),
    originalPrice: Math.round(Number(d.original_price) / 100),
    discountPct: d.discount_pct as number,
    expiresAt: d.expires_at as string,
  }));

  const master = {
    id: data.id,
    slug: data.slug,
    name: profile.full_name,
    specialty: ((data.categories as string[]) ?? []).join(', ') || 'Майстер краси',
    location: locationQuery || 'Україна',
    mapUrl,
    lat: lat ?? null,
    lng: lng ?? null,
    floor: ((data as any).floor as string | null) ?? null,
    cabinet: ((data as any).cabinet as string | null) ?? null,
    emoji: '💅',
    rating: Number(data.rating) || 0,
    reviewsCount: data.rating_count || 0,
    isVerified: true,
    tier: data.subscription_tier as 'starter' | 'pro' | 'studio',
    bio: data.bio ?? '',
    services,
    products,
    reviews,
    instagram: data.instagram_url ?? null,
    telegram: data.telegram_url ?? null,
    themeKey: (data.mood_theme as string) || 'default',
    avatarEmoji: (data.avatar_emoji as string) || '💅',
    avatarUrl: profile.avatar_url ?? null,
    schedule,
    bookingsThisMonth: monthlyCountRes.count ?? 0,
    pricingRules: (data.pricing_rules as Record<string, any>) ?? {},
    workingHours: (data.working_hours as Record<string, unknown>) ?? null,
    flashDeals,
    loyalty,
  };

  return (
    <>
      <div id="e2e-debug-now" style={{ display: 'none' }} data-now={now.toISOString()}>
        {now.toISOString()}
      </div>
      <PublicMasterPage master={master} />
    </>
  );
}
