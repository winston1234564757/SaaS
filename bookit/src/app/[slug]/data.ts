import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import type { WorkingHoursConfig, SubscriptionTier } from '@/types/database';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

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
