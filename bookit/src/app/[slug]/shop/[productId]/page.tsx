import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { createClient } from '@/lib/supabase/server';
import { ProductPage } from '@/components/public/ProductPage';
import type { Product } from '@/types/database';

export const revalidate = 60;

const PRODUCT_COLS = 'id, master_id, icon_name, name, description, category, price_kopecks, photos, stock_qty, is_active, sort_order, created_at, updated_at';

const getProductPage = cache(async (slug: string, productId: string) => {
  const supabase = createPublicClient();
  const { data: master } = await supabase
    .from('master_profiles')
    .select(`id, slug, subscription_tier, ships_nova_poshta, profiles!inner ( full_name )`)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (!master) return null;

  const { data: product } = await supabase
    .from('products')
    .select(PRODUCT_COLS)
    .eq('id', productId)
    .eq('master_id', master.id)
    .eq('is_active', true)
    .single();

  return { master, product: (product as Product | null) ?? null };
});

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; productId: string }> }
): Promise<Metadata> {
  const { slug, productId } = await params;
  const res = await getProductPage(slug, productId);
  if (!res?.product) return { title: 'Товар не знайдено' };
  const profile = res.master.profiles as unknown as { full_name: string };
  const title = `${res.product.name} — Магазин ${profile.full_name}`;
  const image = res.product.photos?.[0];
  return {
    title,
    description: res.product.description ?? undefined,
    openGraph: {
      title,
      description: res.product.description ?? undefined,
      images: image ? [image] : undefined,
    },
  };
}

export default async function Page(
  { params }: { params: Promise<{ slug: string; productId: string }> }
) {
  const { slug, productId } = await params;
  const res = await getProductPage(slug, productId);
  if (!res?.product) notFound();

  const { master, product } = res;
  const tier  = master.subscription_tier as string;
  const isPro = tier === 'pro' || tier === 'studio';
  if (!isPro) notFound();

  const profile = master.profiles as unknown as { full_name: string };

  const pub = createPublicClient();
  const { data: schedule } = await pub
    .from('schedule_templates')
    .select('day_of_week, is_working, start_time, end_time')
    .eq('master_id', master.id);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ProductPage
      product={product}
      masterId={master.id}
      masterSlug={slug}
      masterName={profile.full_name}
      shipsNovaPoshta={master.ships_nova_poshta ?? false}
      isAuth={!!user}
      schedule={(schedule ?? []) as { day_of_week: string; is_working: boolean; start_time: string; end_time: string }[]}
    />
  );
}
