import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import type { WorkingHoursConfig, SubscriptionTier } from '@/types/database';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

// Freshness ceiling for the anon-cached public data. The master viewing their
// own page always reads live (see getMasterExtras `live`), so edits are visible
// to them immediately; everyone else shares a cached entry for this window.
const PUBLIC_REVALIDATE = 60;

export interface MasterServiceRow {
  id: string;
  name: string;
  icon_name: string | null;
  category: string | null;
  price: number;
  duration_minutes: number;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number | null;
  description: string | null;
  image_url: string | null;
}

export interface MasterData {
  id: string;
  slug: string;
  business_name: string | null;
  bio: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  floor: string | null;
  cabinet: string | null;
  rating: number;
  rating_count: number;
  subscription_tier: SubscriptionTier;
  instagram_url: string | null;
  telegram_url: string | null;
  categories: string[];
  mood_theme: string;
  avatar_emoji: string;
  pricing_rules: PricingRules | null;
  working_hours: WorkingHoursConfig | null;
  timezone: string | null;
  c2c_enabled: boolean | null;
  c2c_discount_pct: number | null;
  profiles: { full_name: string; avatar_url: string | null };
  services: MasterServiceRow[];
}

export const getMaster = cache(async (slug: string): Promise<MasterData | null> => {
  const supabase = createPublicClient();

  let q = supabase
    .from('master_profiles')
    .select(`
      id, slug, business_name, bio, city, address, latitude, longitude, floor, cabinet, rating, rating_count,
      subscription_tier, instagram_url, telegram_url, categories,
      mood_theme, avatar_emoji, pricing_rules, working_hours, timezone, c2c_enabled, c2c_discount_pct,
      profiles!inner ( full_name, avatar_url ),
      services ( id, name, icon_name, category, price, duration_minutes, is_popular, is_active, sort_order, description, image_url )
    `)
    .eq('slug', slug)
    .eq('services.is_active', true);

  if (process.env.NODE_ENV === 'production') {
    q = q.eq('is_published', true);
  }

  const { data, error } = await q.maybeSingle();

  if (error || !data) return null;

  return data as unknown as MasterData;
});

/**
 * Cached wrapper around getMaster. Used on the anon read path; for the master
 * viewing their own page the caller falls back to the live getMaster so their
 * edits appear immediately (no wait for the revalidate window).
 */
export const getMasterCached = (slug: string): Promise<MasterData | null> =>
  unstable_cache(() => getMaster(slug), ['master-profile', slug], {
    revalidate: PUBLIC_REVALIDATE,
    tags: [`master-public:${slug}`],
  })();

// ── Static, master-scoped extras (all anon-readable via RLS) ──────────────────

export type ProductRow = {
  id: string;
  name: string;
  price_kopecks: number;
  description: string | null;
  stock_qty: number;
  category: string | null;
  icon_name: string | null;
  recommend_always: boolean;
  product_service_links: { service_id: string }[] | null;
};

export type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string | null;
  created_at: string;
};

export type ScheduleRow = {
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  is_working: boolean;
};

export type LoyaltyRow = {
  target_visits: number;
  reward_type: string;
  reward_value: number;
};

type PartnerProfile = { full_name: string; avatar_url?: string | null };
type PartnerPartner = {
  id: string;
  slug: string;
  avatar_emoji: string | null;
  categories: string[];
  profiles: PartnerProfile | PartnerProfile[];
};
export type PartnerRow = {
  partner_id: string;
  partner: PartnerPartner;
};

export type PortfolioRow = {
  id: string;
  title: string;
  description: string | null;
  service_id: string | null;
  display_order: number;
  portfolio_item_photos: { url: string; display_order: number }[] | null;
  portfolio_item_reviews: { review_id: string }[] | null;
  services: { name: string } | null;
};

export interface MasterExtras {
  products: ProductRow[];
  reviews: ReviewRow[];
  schedule: ScheduleRow[];
  loyalty: LoyaltyRow[];
  partners: PartnerRow[];
  portfolio: PortfolioRow[];
}

async function fetchMasterExtras(masterId: string): Promise<MasterExtras> {
  const supabase = createPublicClient();
  const [productsRes, reviewsRes, scheduleRes, loyaltyRes, partnerRes, portfolioRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price_kopecks, description, stock_qty, category, icon_name, recommend_always, product_service_links(service_id)')
      .eq('master_id', masterId)
      .eq('is_active', true)
      .gt('stock_qty', 0)
      .order('sort_order')
      .limit(20),
    supabase
      .from('reviews')
      .select('id, rating, comment, client_name, created_at')
      .eq('master_id', masterId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('schedule_templates')
      .select('day_of_week, start_time, end_time, is_working')
      .eq('master_id', masterId),
    supabase
      .from('loyalty_programs')
      .select('target_visits, reward_type, reward_value')
      .eq('master_id', masterId)
      .eq('is_active', true)
      .order('target_visits', { ascending: true }),
    // M-GROW-02: visible accepted connections (partners + alliances). Works for
    // anon via mc_public_read RLS.
    supabase
      .from('master_connections')
      .select(`
        other_id,
        partner:master_profiles!master_connections_other_id_fkey (
          id, slug, avatar_emoji, categories,
          profiles ( full_name, avatar_url )
        )
      `)
      .eq('master_id', masterId)
      .eq('status', 'accepted')
      .eq('is_visible', true),
    supabase
      .from('portfolio_items')
      .select(`
        id, title, description, service_id, display_order,
        portfolio_item_photos ( url, display_order ),
        portfolio_item_reviews ( review_id ),
        services ( name )
      `)
      .eq('master_id', masterId)
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .limit(8),
  ]);

  return {
    products:  (productsRes.data ?? []) as ProductRow[],
    reviews:   (reviewsRes.data ?? []) as ReviewRow[],
    schedule:  (scheduleRes.data ?? []) as ScheduleRow[],
    loyalty:   (loyaltyRes.data ?? []) as LoyaltyRow[],
    partners:  (partnerRes.data ?? []) as unknown as PartnerRow[],
    portfolio: (portfolioRes.data ?? []) as unknown as PortfolioRow[],
  };
}

/**
 * Static master-scoped extras. `live=true` (master viewing own page) bypasses
 * the cache so edits appear immediately; otherwise served from the anon data
 * cache for PUBLIC_REVALIDATE seconds, tagged for future on-demand busting.
 */
export const getMasterExtras = (slug: string, masterId: string, live: boolean): Promise<MasterExtras> =>
  live
    ? fetchMasterExtras(masterId)
    : unstable_cache(() => fetchMasterExtras(masterId), ['master-extras', masterId], {
        revalidate: PUBLIC_REVALIDATE,
        tags: [`master-public:${slug}`],
      })();
