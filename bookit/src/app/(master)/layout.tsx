import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/master/DashboardLayout';
import { PullToRefresh } from '@/components/ui/PullToRefresh';

export const dynamic = 'force-dynamic';

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  // getUser() re-validates the session, but can hang on cold starts.
  // getSession() is faster (cookie-only) but less secure.
  // We use a 5s timeout for getUser() then fallback to getSession().
  let user = null;
  try {
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 5000)
    );
    const { data: { user: u } } = await (Promise.race([userPromise, timeoutPromise]) as Promise<any>);
    user = u;
  } catch (err) {
    console.warn('[MasterLayout] getUser timed out or failed, falling back to getSession', err);
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user ?? null;
  }

  if (!user) redirect('/login');

  let profile = null;
  let masterProfile = null;

  try {
    const [profileRes, masterProfileRes] = await Promise.all([
      Promise.race([
        supabase.from('profiles')
          .select('id, role, full_name, phone, email, avatar_url, telegram_chat_id, onboarding_step, onboarding_data, created_at, updated_at')
          .eq('id', user.id)
          .single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('db-timeout')), 5000))
      ]),
      Promise.race([
        supabase.from('master_profiles')
          .select('id, slug, business_name, bio, categories, mood_theme, accent_color, subscription_tier, subscription_expires_at, commission_rate, rating, rating_count, is_published, address, city, latitude, longitude, floor, cabinet, instagram_url, telegram_url, telegram_chat_id, avatar_emoji, has_seen_tour, seen_tours, pricing_rules, working_hours, timezone, referral_code, referred_by, c2c_enabled, c2c_discount_pct, created_at, updated_at')
          .eq('id', user.id)
          .maybeSingle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('db-timeout')), 5000))
      ]),
    ]) as any[];

    profile = profileRes.data;
    masterProfile = masterProfileRes.data;
  } catch (err) {
    console.error('[MasterLayout] Data fetch failed or timed out:', err);
  }

  if (profile?.role === 'client') redirect('/my/bookings');

  // Onboarding guard — new masters must complete the multi-step onboarding.
  // Legacy masters who have an avatar_emoji but onboarding_step 'BASIC' are treated as onboarded.
  const isLegacyMaster = profile?.onboarding_step === 'BASIC' && !!masterProfile?.avatar_emoji;
  const needsOnboarding = profile?.role === 'master' 
    && profile?.onboarding_step !== 'SUCCESS' 
    && !isLegacyMaster;

  // x-pathname is forwarded from proxy.ts via request headers (not response),
  // so headers().get('x-pathname') correctly reflects the current page.
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const isOnboarding = pathname.startsWith('/dashboard/onboarding');
  const isBilling = pathname.startsWith('/dashboard/billing');

  if (needsOnboarding && !isOnboarding && !isBilling) {
    redirect('/dashboard/onboarding');
  }

  return (
    <DashboardLayout
      initialUser={user}
      initialProfile={profile ?? null}
      initialMasterProfile={masterProfile ?? null}
    >
      <PullToRefresh>
        {children}
      </PullToRefresh>
    </DashboardLayout>
  );
}
