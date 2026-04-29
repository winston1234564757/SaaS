import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { ArrowLeft, Scissors, Star, User, CheckCircle, Clock } from 'lucide-react';
import { formatDateFull } from '@/lib/utils/dates';
import { PortfolioBookingButton } from '@/components/public/portfolio/PortfolioBookingButton';

export const revalidate = 300;

async function getPortfolioItem(slug: string, id: string) {
  const admin = createAdminClient();

  const { data: mp } = await admin
    .from('master_profiles')
    .select('id, slug, subscription_tier, working_hours, pricing_rules, profiles!inner(full_name, avatar_url)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!mp) return null;

  const [itemRes, servicesRes, bookingsRes] = await Promise.all([
    admin
      .from('portfolio_items')
      .select(`
        id, title, description, service_id, tagged_client_id, consent_status, created_at,
        portfolio_item_photos ( id, url, display_order ),
        portfolio_item_reviews ( review_id )
      `)
      .eq('id', id)
      .eq('master_id', mp.id)
      .eq('is_published', true)
      .single(),

    admin
      .from('services')
      .select('id, name, price, duration_minutes, is_popular, emoji, category, sort_order')
      .eq('master_id', mp.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),

    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', mp.id)
      .gte('start_time', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  if (!itemRes.data) return null;
  const item = itemRes.data;

  const reviewIds = (item.portfolio_item_reviews ?? []).map(r => r.review_id);

  const [reviewsRes, clientRes] = await Promise.all([
    reviewIds.length > 0
      ? admin
          .from('reviews')
          .select('id, rating, comment, client_name, created_at')
          .in('id', reviewIds)
          .eq('is_published', true)
      : Promise.resolve({ data: [] }),
    item.tagged_client_id
      ? admin.from('profiles').select('full_name, avatar_url').eq('id', item.tagged_client_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const profile = mp.profiles as unknown as { full_name: string; avatar_url: string | null };

  const rawServices = servicesRes.data ?? [];
  const masterServices = rawServices.map(s => ({
    id: s.id as string,
    name: s.name as string,
    price: Number(s.price),
    duration: s.duration_minutes as number,
    popular: s.is_popular as boolean,
    emoji: (s.emoji as string) ?? '✨',
    category: (s.category as string) ?? 'Інше',
  }));

  const taggedClient = clientRes.data as { full_name: string; avatar_url: string | null } | null;

  return {
    masterSlug: slug,
    masterName: profile.full_name,
    masterAvatar: profile.avatar_url,
    masterId: mp.id,
    masterTier: (mp.subscription_tier ?? 'starter') as 'starter' | 'pro' | 'studio',
    masterWorkingHours: mp.working_hours as Record<string, unknown> | null,
    masterPricingRules: mp.pricing_rules as Record<string, unknown> | null,
    masterServices,
    bookingsThisMonth: bookingsRes.count ?? 0,
    item: {
      id: item.id,
      title: item.title,
      description: item.description,
      created_at: item.created_at,
      service_id: item.service_id ?? null,
      consent_status: (item.consent_status ?? null) as 'pending' | 'approved' | 'declined' | null,
      photos: [...(item.portfolio_item_photos ?? [])].sort((a, b) => a.display_order - b.display_order),
      serviceName: masterServices.find(s => s.id === item.service_id)?.name ?? null,
      taggedClientName: taggedClient?.full_name ?? null,
      taggedClientAvatar: taggedClient?.avatar_url ?? null,
      reviews: reviewsRes.data ?? [],
    },
  };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; id: string }> }
): Promise<Metadata> {
  const { slug, id } = await params;
  const data = await getPortfolioItem(slug, id);
  if (!data) return { title: 'Не знайдено' };
  return {
    title: `${data.item.title} — ${data.masterName} · Bookit`,
    description: data.item.description ?? `Робота майстра ${data.masterName}`,
    openGraph: {
      images: data.item.photos[0] ? [data.item.photos[0].url] : [],
    },
  };
}

export default async function PortfolioItemPage(
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const data = await getPortfolioItem(slug, id);
  if (!data) notFound();

  const { masterSlug, masterName, masterAvatar, masterId, masterTier, masterWorkingHours, masterPricingRules, masterServices, bookingsThisMonth, item } = data;

  return (
    <div className="min-h-dvh pb-24" style={{ background: '#FFE8DC' }}>
      {/* Blob */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #FFD4BE 0%, transparent 70%)' }} />
      </div>

      {/* Back header */}
      <div
        className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(255,232,220,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.4)' }}
      >
        <Link
          href={`/${masterSlug}/portfolio`}
          className="w-9 h-9 rounded-2xl bg-white/60 flex items-center justify-center text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <p className="text-sm font-bold text-foreground truncate flex-1">{item.title}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Photo gallery */}
        {item.photos.length > 0 && (
          <div className="space-y-2">
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden"
              style={{ boxShadow: '0 4px 24px rgba(44,26,20,0.10)' }}>
              <Image
                src={item.photos[0].url}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 512px"
                priority
              />
            </div>
            {item.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {item.photos.slice(1).map(photo => (
                  <div key={photo.id} className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                    <Image src={photo.url} alt="" fill className="object-cover" sizes="80px" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Title & meta */}
        <div
          className="rounded-3xl p-5 space-y-3"
          style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 2px 12px rgba(44,26,20,0.06)' }}
        >
          <h1 className="text-xl font-bold text-foreground font-display">{item.title}</h1>

          <div className="flex flex-wrap gap-2">
            {item.serviceName && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary rounded-full px-3 py-1">
                <Scissors size={11} /> {item.serviceName}
              </span>
            )}
            <span className="text-xs text-muted-foreground/60 py-1">
              {formatDateFull(item.created_at)}
            </span>
          </div>

          {item.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          )}
        </div>

        {/* Tagged client */}
        {item.taggedClientName && item.consent_status === 'approved' && (
          <div
            className="rounded-3xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.4)' }}
          >
            {item.taggedClientAvatar ? (
              <div className="relative w-10 h-10 rounded-2xl overflow-hidden shrink-0">
                <Image src={item.taggedClientAvatar} alt={item.taggedClientName} fill className="object-cover" sizes="40px" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                <User size={16} className="text-muted-foreground/60" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground/60">Клієнт</p>
              <p className="text-sm font-semibold text-foreground">{item.taggedClientName}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-success">
              <CheckCircle size={12} /> Підтверджено
            </div>
          </div>
        )}

        {item.taggedClientName && item.consent_status === 'pending' && (
          <div
            className="rounded-3xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.4)' }}
          >
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
              <User size={16} className="text-muted-foreground/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground/60">Клієнт</p>
              <p className="text-sm font-semibold text-foreground">{item.taggedClientName}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-warning">
              <Clock size={12} /> Очікує
            </div>
          </div>
        )}

        {/* Reviews */}
        {item.reviews.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Відгуки про цю роботу</h2>
            <div className="space-y-2">
              {item.reviews.map(r => (
                <div
                  key={r.id}
                  className="rounded-3xl p-4 space-y-2"
                  style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.4)' }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">{r.client_name ?? 'Клієнт'}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} size={11} fill="#D4935A" className="text-warning" />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>}
                  <p className="text-[10px] text-muted-foreground/60">{formatDateFull(r.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA — book master */}
        <div
          className="rounded-3xl p-5 flex items-center justify-between"
          style={{ background: '#2C1A14' }}
        >
          <div className="flex items-center gap-3">
            {masterAvatar ? (
              <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0">
                <Image src={masterAvatar} alt={masterName} width={40} height={40} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Scissors size={16} className="text-white/60" />
              </div>
            )}
            <div>
              <p className="text-xs text-white/60">Майстер</p>
              <p className="text-sm font-bold text-white">{masterName}</p>
            </div>
          </div>
          <PortfolioBookingButton
            masterId={masterId}
            masterName={masterName}
            services={masterServices}
            initialServiceId={item.service_id}
            subscriptionTier={masterTier}
            bookingsThisMonth={bookingsThisMonth}
            pricingRules={masterPricingRules}
            workingHours={masterWorkingHours}
          />
        </div>
      </div>
    </div>
  );
}
