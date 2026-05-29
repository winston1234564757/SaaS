import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/master/DashboardLayout';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { MasterProvider } from '@/lib/supabase/context';

export const dynamic = 'force-dynamic';

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const impersonatedId = cookieStore.get('impersonate_master_id')?.value;
  const role = cookieStore.get('user_role')?.value;
  const isImpersonating = role === 'admin' && !!impersonatedId;
  
  // getUser() re-validates the session, but can hang on cold starts.
  // We use a tight 3s timeout then fallback to getSession().
  let user = null;
  try {
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 3000)
    );
    const { data: { user: u } } = await (Promise.race([userPromise, timeoutPromise]) as Promise<any>);
    user = u;
  } catch (err) {
    console.warn('[MasterLayout] getUser timed out or failed, falling back to getSession', err);
    try {
      const { data: { session } } = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('session-timeout')), 3000))
      ]) as any;
      user = session?.user ?? null;
    } catch {
      user = null;
    }
  }

  if (!user) redirect('/login');

  let profile = null;
  let masterProfile = null;

  const targetId = isImpersonating ? impersonatedId : user.id;

  try {
    const [profileRes, masterProfileRes] = await Promise.all([
      Promise.race([
        supabase.from('profiles')
          .select('id, role, full_name, phone, email, avatar_url, telegram_chat_id, onboarding_step, onboarding_data, created_at, updated_at')
          .eq('id', targetId)
          .single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('db-timeout')), 4000))
      ]),
      Promise.race([
        supabase.from('master_profiles')
          .select('id, slug, business_name, bio, categories, mood_theme, accent_color, subscription_tier, subscription_expires_at, commission_rate, rating, rating_count, is_published, address, city, latitude, longitude, floor, cabinet, instagram_url, telegram_url, telegram_chat_id, avatar_emoji, has_seen_tour, seen_tours, pricing_rules, working_hours, timezone, referral_code, referred_by, retention_cycle_days, dynamic_pricing_extra_earned, c2c_enabled, c2c_discount_pct, segment_config, created_at, updated_at')
          .eq('id', targetId)
          .maybeSingle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('db-timeout')), 4000))
      ]),
    ]) as any[];

    profile = profileRes.data;
    masterProfile = masterProfileRes.data;
  } catch (err) {
    console.warn('[MasterLayout] Data fetch timed out:', err);
  }

  if (profile?.role === 'client' && !isImpersonating) redirect('/my/bookings');

  // Onboarding guard — new masters must complete the multi-step onboarding.
  // Legacy masters who have an avatar_emoji but onboarding_step 'BASIC' are treated as onboarded.
  const isLegacyMaster = profile?.onboarding_step === 'BASIC' && !!masterProfile?.avatar_emoji;
  const needsOnboarding = profile?.role === 'master' 
    && profile?.onboarding_step !== 'SUCCESS' 
    && !isLegacyMaster
    && !isImpersonating;

  // x-pathname is forwarded from proxy.ts via request headers (not response),
  // so headers().get('x-pathname') correctly reflects the current page.
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const isOnboarding = pathname.startsWith('/dashboard/onboarding');
  const isBilling = pathname.startsWith('/dashboard/billing');

  if (needsOnboarding && !isOnboarding && !isBilling) {
    redirect('/dashboard/onboarding');
  }

  if (isOnboarding) {
    return (
      <MasterProvider
        initialUser={user}
        initialProfile={profile ?? null}
        initialMasterProfile={masterProfile ?? null}
      >
        {/* Force Frost on html/body immediately — overrides the beforeInteractive inline script
            that reads client_theme cookie (Blossom) and sets body.style.backgroundColor.
            CSS !important beats JS inline style. Works for SSR and client-side navigation. */}
        <style>{`html,body{background-color:#EFF2FF!important;}`}</style>
        <div
          data-theme="frost"
          style={{
            minHeight: '100dvh',
            backgroundColor: '#EFF2FF',
            background: [
              'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(99,102,241,0.16) 0%, transparent 55%)',
              'radial-gradient(ellipse 50% 40% at 92% 8%, rgba(139,92,246,0.10) 0%, transparent 50%)',
              'radial-gradient(ellipse 40% 35% at 5% 92%, rgba(59,130,246,0.09) 0%, transparent 45%)',
              '#EFF2FF',
            ].join(', '),
          }}
        >
          {children}
        </div>
      </MasterProvider>
    );
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
