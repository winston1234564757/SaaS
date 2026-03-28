import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PublicMasterPage } from '@/components/public/PublicMasterPage';

async function getMaster(slug: string) {
  // Admin client bypasses RLS — needed for profiles!inner join on public pages
  const supabase = createAdminClient();

  let query = supabase
    .from('master_profiles')
    .select(`
      id, slug, bio, city, address, rating, rating_count,
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

  const supabase = await createClient();

  // Межа місячного ліміту — рахуємо динамічно з bookings (не з лічильника bookings_this_month)
  const monthStart = new Date(
    new Date().getFullYear(), new Date().getMonth(), 1
  ).toISOString();

  // Паралельно завантажуємо products, reviews, schedule, portfolio, monthly count, flash deals
  const [productsRes, reviewsRes, scheduleRes, portfolioRes, monthlyCountRes, flashDealsRes] = await Promise.all([
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
      .from('portfolio_photos')
      .select('id, url, caption, service_id, services(id, name, price)')
      .eq('master_id', data.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(30),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', data.id)
      .gte('created_at', monthStart)
      .neq('status', 'cancelled'),
    supabase
      .from('flash_deals')
      .select('id, service_name, slot_date, slot_time, original_price, discount_pct, expires_at')
      .eq('master_id', data.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true })
      .limit(5),
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

  const portfolio = (portfolioRes.data ?? []).map((p: any) => {
    const svc = p.services as { id: string; name: string; price: number } | null;
    return {
      id: p.id as string,
      url: p.url as string,
      caption: (p.caption as string) || null,
      serviceId: (p.service_id as string) || null,
      serviceName: svc?.name ?? null,
      servicePrice: svc ? Number(svc.price) : null,
    };
  });

  const flashDeals = (flashDealsRes.data ?? []).map((d: any) => ({
    id: d.id as string,
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
    location: [data.city, data.address].filter(Boolean).join(', ') || 'Україна',
    emoji: '💅',
    rating: Number(data.rating) || 0,
    reviewsCount: data.rating_count || 0,
    isVerified: true,
    tier: data.subscription_tier as 'starter' | 'pro' | 'studio',
    bio: data.bio ?? '',
    services,
    products,
    reviews,
    portfolio,
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
  };

  return <PublicMasterPage master={master} />;
}
