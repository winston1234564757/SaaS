import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { ShopPage } from '@/components/public/ShopPage';
import type { Product } from '@/types/database';

export const revalidate = 60;

async function getMasterShop(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('master_profiles')
    .select(`
      id, slug, subscription_tier, ships_nova_poshta, working_hours,
      profiles!inner ( full_name, avatar_url )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  return data;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const master = await getMasterShop(slug);
  if (!master) return { title: 'Магазин не знайдено' };
  const profile = master.profiles as unknown as { full_name: string };
  return { title: `Магазин ${profile.full_name} — Bookit` };
}

export default async function Page(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const master = await getMasterShop(slug);
  if (!master) notFound();

  const tier = master.subscription_tier as string;
  const isPro = tier === 'pro' || tier === 'studio';

  const profile = master.profiles as unknown as { full_name: string; avatar_url: string | null };

  if (!isPro) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-2">
          Магазин недоступний
        </h1>
        <p className="text-sm text-[#A8928D]">
          Майстер ще не підключив магазин
        </p>
      </div>
    );
  }

  // Fetch active products
  const admin = createAdminClient();
  const { data: productsData } = await admin
    .from('products')
    .select('id, master_id, name, description, category, price_kopecks, photos, stock_qty, is_active, sort_order, created_at, updated_at')
    .eq('master_id', master.id)
    .eq('is_active', true)
    .gt('stock_qty', 0)
    .order('sort_order', { ascending: true });

  // Current user for checkout pre-fill
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch schedule
  const { data: schedule } = await admin
    .from('schedule_templates')
    .select('*')
    .eq('master_id', master.id);

  return (
    <ShopPage
      masterId={master.id}
      masterSlug={slug}
      masterName={profile.full_name}
      shipsNovaPoshta={master.ships_nova_poshta ?? false}
      products={(productsData ?? []) as Product[]}
      isAuth={!!user}
      workingHours={master.working_hours as any}
      schedule={schedule ?? []}
    />
  );
}
