import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

export const getMaster = cache(async (slug: string) => {
  const supabase = createAdminClient();

  let q = supabase
    .from('master_profiles')
    .select(`
      id, slug, business_name, bio, city, address, latitude, longitude, floor, cabinet, rating, rating_count,
      subscription_tier, instagram_url, telegram_url, categories,
      mood_theme, avatar_emoji, pricing_rules, working_hours, c2c_enabled, c2c_discount_pct,
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

  return data as any;
});
