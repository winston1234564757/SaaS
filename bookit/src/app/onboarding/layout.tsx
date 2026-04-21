import { createClient } from '@/lib/supabase/server';
import { MasterProvider } from '@/lib/supabase/context';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let masterProfile = null;

  if (user) {
    const [{ data: p }, { data: mp }] = await Promise.all([
      supabase.from('profiles').select('id, role, full_name, phone, email, avatar_url, telegram_chat_id, created_at, updated_at').eq('id', user.id).single(),
      supabase.from('master_profiles').select('id, slug, business_name, bio, categories, mood_theme, accent_color, subscription_tier, subscription_expires_at, commission_rate, rating, rating_count, is_published, address, city, latitude, longitude, floor, cabinet, instagram_url, telegram_url, telegram_chat_id, avatar_emoji, has_seen_tour, seen_tours, pricing_rules, working_hours, timezone, referral_code, referred_by, created_at, updated_at').eq('id', user.id).maybeSingle(),
    ]);
    profile = p;
    masterProfile = mp;
  }

  return (
    <MasterProvider
      initialUser={user}
      initialProfile={profile}
      initialMasterProfile={masterProfile}
    >
      {children}
    </MasterProvider>
  );
}
