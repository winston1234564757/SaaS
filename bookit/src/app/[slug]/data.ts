import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

export const getMaster = cache(async (slug: string) => {
  // Admin client bypasses RLS — needed for profiles!inner join on public pages
  const supabase = createAdminClient();

  let query = supabase
    .from('master_profiles')
    .select(`
      id, slug, business_name, bio, city, address, latitude, longitude, floor, cabinet, rating, rating_count,
      subscription_tier, instagram_url, telegram_url, categories,
      mood_theme, avatar_emoji, pricing_rules, working_hours, c2c_enabled, c2c_discount_pct,
      profiles!inner ( full_name, avatar_url ),
      services ( id, name, emoji, category, price, duration_minutes, is_popular, is_active, sort_order, description )
    `)
    .eq('slug', slug)
    .eq('services.is_active', true);

  if (process.env.NODE_ENV === 'production') {
    query = query.eq('is_published', true);
  }

  const { data } = await query.single();
  return data;
});
