import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createPublicClient } from '@/lib/supabase/public';
import { cookies, headers } from 'next/headers';
import { toZonedTime } from 'date-fns-tz';
import { getNow } from '@/lib/utils/now';
import { PublicMasterPage } from '@/components/public/PublicMasterPage';
import type { TrustedPartner } from '@/components/public/TrustedPartnersBlock';
import { ALL_STEPS } from '@/components/shared/wizard/helpers';
import { CATEGORY_TEMPLATES } from '@/lib/constants/onboardingTemplates';
import { getMaster, getMasterCached, getMasterExtras } from './data';
import type { ProductRow, ReviewRow, ScheduleRow, LoyaltyRow, PartnerRow, PortfolioRow } from './data';
import { computeOccupancy } from '@/lib/utils/occupancy';
import { getBaseUrl } from '@/lib/utils/url';
import type { ProductIconName } from '@/lib/product-icons';

// ── Row types for the live (per-request) secondary queries ────────────────────

type FlashDealRow = {
  id: string;
  service_id: string | null;
  service_name: string;
  slot_date: string;
  slot_time: string;
  original_price: number;
  discount_pct: number;
  expires_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('master_profiles')
    .select('slug')
    .eq('is_published', true)
    .order('rating', { ascending: false })
    .limit(50);
  return (data ?? []).map(({ slug }) => ({ slug }));
}

// getMaster moved to data.ts for sharing with OG image generator

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const master = await getMasterCached(slug);
  // Сторінка неіснуючого майстра віддає HTTP 200, а не 404: кореневий layout читає
  // headers()/cookies(), тож кожен роут динамічний і стрімиться — статус іде в мережу
  // раніше, ніж спрацює notFound(). Полагодити статус можна лише перебудувавши
  // кореневий layout (ризик на весь застосунок), а SEO-шкода тут одна: індексація.
  // Її й вимикаємо явно — на noindex Google реагує однозначно, без огляду на статус.
  if (!master) return { title: 'Майстер не знайдений', robots: { index: false, follow: false } };

  const profile = master.profiles;
  const displayName = master.business_name || profile.full_name;

  // SEO Engine: Specialty + City + Brand
  const specialties = master.categories
    .map(val => CATEGORY_TEMPLATES[val]?.label || val)
    .slice(0, 2);
  const mainSpecialty = specialties[0] || "Б'юті-майстер";
  const location = master.city ? `у м. ${master.city}` : '';

  const seoTitle = `${mainSpecialty} ${location} | ${displayName}`;
  const seoDescription = master.bio
    ? (master.bio.length > 160 ? master.bio.slice(0, 157) + '...' : master.bio)
    : `Онлайн-запис до ${displayName}. ${specialties.join(', ')}. Бронюйте зручний час онлайн на Bookit.`;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `/${slug}`,
      siteName: 'Bookit',
      locale: 'uk_UA',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
    },
    keywords: [...master.categories, master.city, displayName, 'онлайн запис', 'bookit'].filter(Boolean) as string[],
  };
}

export default async function MasterPublicPage(
  { params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }
) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const refCode = sp?.ref ?? null;

  const supabase = await createClient();
  // Поточний юзер (null якщо не залогінений)
  const { data: { user } } = await supabase.auth.getUser();

  // Anon visitors read the cached profile+extras; the master viewing their own
  // page reads live so their edits appear immediately (no revalidate wait).
  const cached = await getMasterCached(slug);
  if (!cached) notFound();
  const isOwner = !!user && user.id === cached.id;
  const data = isOwner ? (await getMaster(slug)) ?? cached : cached;

  // Server-side UA detection для native map deep links (no client JS needed)
  const headersList = await headers();
  const ua = headersList.get('user-agent') ?? '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  const locationQuery = data.address && data.city && data.address.toLowerCase().includes(data.city.toLowerCase())
    ? data.address
    : [data.city, data.address].filter(Boolean).join(', ');
  const lat = data.latitude;
  const lng = data.longitude;
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

  const cookieStore = await cookies();
  const debugNow = cookieStore.get('next-public-debug-now')?.value;
  const now = debugNow ? new Date(decodeURIComponent(debugNow)) : getNow();

  // Static master-scoped extras (cached for anon, live for the owner).
  const extras = await getMasterExtras(slug, data.id, isOwner);

  // Validate C2C ref param — resolve referrer client id and discount %
  let c2cRefCode: string | null = null;
  let c2cDiscountPct: number | null = null;
  const masterC2cEnabled = data.c2c_enabled;
  if (refCode && masterC2cEnabled) {
    const adminC = createPublicClient();
    const { data: referrerProfile } = await adminC
      .from('client_profiles')
      .select('id')
      .eq('referral_code', refCode)
      .maybeSingle();
    if (referrerProfile) {
      // Don't apply if the visitor is the referrer themselves
      const isSelf = user && user.id === referrerProfile.id;
      if (!isSelf) {
        c2cRefCode = refCode;
        c2cDiscountPct = data.c2c_discount_pct ?? 10;
      }
    }
  }

  // Межа місячного ліміту — рахуємо динамічно з bookings (не з лічильника bookings_this_month)
  const masterTimezone = data.timezone || 'Europe/Kyiv';
  const nowInMasterTZ = toZonedTime(getNow(), masterTimezone);
  const monthStartDate = new Date(nowInMasterTZ.getFullYear(), nowInMasterTZ.getMonth(), 1);
  const monthEndDate   = new Date(nowInMasterTZ.getFullYear(), nowInMasterTZ.getMonth() + 1, 0);
  const monthStart = monthStartDate.toISOString();
  const monthEnd   = monthEndDate.toISOString().slice(0, 10);

  // Live (per-request) data only — monthly count, flash deals, this user's visit
  // count and occupancy bookings. Static master-scoped data comes from `extras`.
  const [monthlyCountRes, flashDealsRes, relationRes, occupancyBookingsRes] = await Promise.all([
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
    user
      ? supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('master_id', data.id)
          .eq('client_id', user.id)
          .eq('status', 'completed')
      : Promise.resolve({ count: null, error: null }),
    // Occupancy: anon client with public read RLS — consistent for all visitors
    createPublicClient()
      .from('bookings')
      .select('start_time, end_time, status')
      .eq('master_id', data.id)
      .gte('date', monthStartDate.toISOString().slice(0, 10))
      .lte('date', monthEnd)
      .limit(300),
  ]);

  const profile = data.profiles;

  const services = data.services
    .filter(s => s.is_active)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(s => ({
      id: s.id,
      name: s.name,
      icon_name: s.icon_name ?? 'sparkles',
      category: s.category ?? 'Інше',
      price: Number(s.price),
      duration: s.duration_minutes,
      popular: s.is_popular,
      description: s.description || null,
      image_url: s.image_url || null,
    }));

  const products = extras.products.map((p: ProductRow) => ({
    id:               p.id,
    name:             p.name,
    price:            Math.round(Number(p.price_kopecks) / 100),
    description:      p.description,
    icon_name:        (p.icon_name ?? 'package') as ProductIconName,
    inStock:          p.stock_qty > 0,
    stock:            p.stock_qty,
    recommendAlways:  p.recommend_always,
    linkedServiceIds: (p.product_service_links ?? []).map(l => l.service_id),
  }));

  const reviews = extras.reviews.map((r: ReviewRow) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    clientName: r.client_name || 'Клієнт',
    createdAt: r.created_at,
  }));

  const schedule = extras.schedule.map((s: ScheduleRow) => ({
    day: s.day_of_week,
    isWorking: s.is_working,
    startTime: s.start_time?.slice(0, 5) ?? '09:00',
    endTime: s.end_time?.slice(0, 5) ?? '18:00',
  }));

  const occupancyRate = computeOccupancy(
    extras.schedule,
    (occupancyBookingsRes.data ?? []) as { start_time: string; end_time: string; status: string }[],
    monthStartDate,
    monthEndDate,
  );

  const loyaltyTiers = extras.loyalty.map((p: LoyaltyRow) => ({
    targetVisits: p.target_visits,
    rewardType: p.reward_type,
    rewardValue: p.reward_value,
  }));
  const currentVisits = relationRes.count ?? 0;
  const loyalty = loyaltyTiers.length > 0
    ? { tiers: loyaltyTiers, currentVisits, isAuth: !!user }
    : null;

  // Build trusted partners list from accepted+visible master_connections (partner+alliance)
  const trustedPartners: TrustedPartner[] = extras.partners.map((row: PartnerRow) => {
    const partnerProfile = Array.isArray(row.partner.profiles) ? row.partner.profiles[0] : row.partner.profiles;
    return {
      id:          row.partner.id,
      slug:        row.partner.slug,
      name:        partnerProfile?.full_name ?? 'Майстер',
      avatarEmoji: row.partner.avatar_emoji ?? '💅',
      avatarUrl:   (partnerProfile as any)?.avatar_url ?? null,
      specialty:   row.partner.categories.join(', ') || 'Майстер краси',
    };
  });

  const flashDeals = (flashDealsRes.data ?? []).map((d: FlashDealRow) => ({
    id: d.id,
    serviceId: d.service_id || undefined,
    serviceName: d.service_name,
    slotDate: d.slot_date,
    slotTime: d.slot_time.slice(0, 5),
    originalPrice: Math.round(Number(d.original_price) / 100),
    discountPct: d.discount_pct,
    expiresAt: d.expires_at,
  }));

  const master = {
    id: data.id,
    slug: data.slug,
    name: data.business_name || profile.full_name,
    specialty: data.categories
      .map(val => CATEGORY_TEMPLATES[val]?.label || val)
      .join(', ') || 'Майстер краси',
    location: locationQuery || 'Україна',
    mapUrl,
    lat: lat ?? null,
    lng: lng ?? null,
    floor: data.floor,
    cabinet: data.cabinet,
    emoji: '💅',
    rating: Number(data.rating) || 0,
    reviewsCount: data.rating_count || 0,
    isVerified: true,
    tier: data.subscription_tier,
    bio: data.bio ?? '',
    services,
    products,
    reviews,
    instagram: data.instagram_url ?? null,
    telegram: data.telegram_url ?? null,
    themeKey: 'frost',
    avatarEmoji: data.avatar_emoji || '💅',
    avatarUrl: profile.avatar_url ?? null,
    schedule,
    bookingsThisMonth: monthlyCountRes.count ?? 0,
    occupancyRate,
    pricingRules: data.pricing_rules ?? {},
    workingHours: data.working_hours as Record<string, unknown> | null,
    flashDeals,
    loyalty,
    trustedPartners,
    portfolio: extras.portfolio.map((item: PortfolioRow) => {
      const photos = [...(item.portfolio_item_photos ?? [])].sort((a, b) => a.display_order - b.display_order);
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        cover_url: photos[0]?.url || null,
        photo_count: photos.length,
        service_name: item.services?.name ?? null,
        review_count: (item.portfolio_item_reviews ?? []).length,
      };
    }),
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: master.name,
    description: master.bio,
    image: master.avatarUrl || undefined,
    url: `${getBaseUrl()}/${master.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: data.city,
      streetAddress: data.address,
    },
    geo: lat && lng ? {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lng,
    } : undefined,
    aggregateRating: master.rating > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: master.rating,
      reviewCount: master.reviewsCount,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
    priceRange: '₴₴',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026') }}
      />
      <div id="e2e-debug-now" style={{ display: 'none' }} data-now={now.toISOString()}>
        {now.toISOString()}
      </div>
      <PublicMasterPage
        master={master}
        c2cRefCode={c2cRefCode}
        c2cDiscountPct={c2cDiscountPct}
        masterC2cEnabled={masterC2cEnabled === true}
        masterC2cDiscountPct={masterC2cEnabled ? (data.c2c_discount_pct ?? 10) : null}
      />
    </>
  );
}
