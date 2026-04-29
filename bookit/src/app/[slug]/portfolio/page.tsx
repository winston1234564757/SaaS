import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { ArrowLeft, Scissors, Star, Images } from 'lucide-react';

export const revalidate = 300;

async function getMasterPortfolio(slug: string) {
  const admin = createAdminClient();

  const { data: mp } = await admin
    .from('master_profiles')
    .select('id, slug, profiles!inner(full_name)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!mp) return null;

  const masterName = (mp.profiles as unknown as { full_name: string }).full_name;

  const { data: items } = await admin
    .from('portfolio_items')
    .select(`
      id, title, description, service_id, display_order, is_published,
      portfolio_item_photos ( url, display_order ),
      portfolio_item_reviews ( review_id ),
      services ( name )
    `)
    .eq('master_id', mp.id)
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  return { masterName, slug, items: items ?? [] };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMasterPortfolio(slug);
  if (!data) return { title: 'Не знайдено' };
  return {
    title: `Портфоліо — ${data.masterName} · Bookit`,
    description: `Роботи майстра ${data.masterName}`,
  };
}

export default async function PortfolioGridPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getMasterPortfolio(slug);
  if (!data) notFound();

  const { masterName, items } = data;

  return (
    <div className="min-h-dvh" style={{ background: '#FFE8DC' }}>
      {/* Fixed blob background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #FFD4BE 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #789A99 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(255,232,220,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.4)' }}
      >
        <Link
          href={`/${slug}`}
          className="w-9 h-9 rounded-2xl bg-white/60 flex items-center justify-center text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">Портфоліо</p>
          <p className="text-xs text-muted-foreground">{masterName}</p>
        </div>
      </div>

      <div className="px-4 py-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center">
              <Images size={28} className="text-[#C8B8B2]" />
            </div>
            <p className="text-base font-bold text-foreground">Портфоліо порожнє</p>
            <p className="text-sm text-muted-foreground">Майстер ще не додав роботи</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map(item => {
              const photos = [...(item.portfolio_item_photos ?? [])].sort((a, b) => a.display_order - b.display_order);
              const cover = photos[0];
              const serviceName = (item.services as unknown as { name: string } | null)?.name ?? null;
              const reviewCount = (item.portfolio_item_reviews ?? []).length;

              return (
                <Link key={item.id} href={`/${slug}/portfolio/${item.id}`}>
                  <div
                    className="rounded-3xl overflow-hidden transition-transform active:scale-[0.97] hover:shadow-md"
                    style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 2px 12px rgba(44,26,20,0.06)' }}
                  >
                    {/* Cover */}
                    <div className="relative w-full aspect-square bg-secondary">
                      {cover ? (
                        <Image src={cover.url} alt={item.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Scissors size={24} className="text-[#C8B8B2]" />
                        </div>
                      )}
                      {photos.length > 1 && (
                        <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/40 rounded-full px-1.5 py-0.5">
                          {photos.length}
                        </span>
                      )}
                    </div>

                    <div className="p-3 space-y-1">
                      <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {serviceName && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                            <Scissors size={9} /> {serviceName}
                          </span>
                        )}
                        {reviewCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                            <Star size={9} /> {reviewCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
