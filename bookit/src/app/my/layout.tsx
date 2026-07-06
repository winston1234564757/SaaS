import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { MasterModeBanner } from '@/components/client/MasterModeBanner';
import { ChannelBanner } from '@/components/client/ChannelBanner';
import { B2CRouteGuard } from '@/components/client/B2CRouteGuard';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { ClientNotificationsBell } from '@/components/client/ClientNotificationsBell';
import { SmartBackButton } from '@/components/shared/SmartBackButton';
import { SupportWidget } from '@/components/shared/support/SupportWidget';
import { GlassSafeArea } from '@/components/shared/GlassSafeArea';

export default async function MyLayout({ children }: { children: React.ReactNode }) {
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
    console.warn('[MyLayout] getUser timed out or failed, falling back to getSession', err);
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user ?? null;
  }

  if (!user) redirect('/login');

  // DB queries with 5s timeout to prevent infinite loading.
  const timeoutId = setTimeout(() => {}, 5000);

  let profile = null;
  let hasTelegram = false;
  let hasPush = false;

  try {
    const [profileRes, pushRes] = await Promise.race([
      Promise.all([
        supabase.from('profiles').select('role, phone, telegram_chat_id').eq('id', user.id).single(),
        supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('db-timeout')), 5000)),
    ]);
    profile = profileRes.data;
    hasTelegram = !!(profile as { telegram_chat_id?: string | null } | null)?.telegram_chat_id;
    hasPush = (pushRes.count ?? 0) > 0;
  } catch (err) {
    console.error('[MyLayout] Data fetch failed or timed out:', err);
  } finally {
    clearTimeout(timeoutId);
  }

  const botName = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? '').replace('@', '').trim();

  const cookieStore = await cookies();
  const viewMode = cookieStore.get('view_mode')?.value;

  // Check if this is a master visiting in client mode
  const isMasterInClientMode = viewMode === 'client' && profile?.role === 'master';

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  // Full-screen chat surfaces bypass the padded chrome (navbar, max-w-lg,
  // bottom padding, floating SupportWidget): support chat + any DM thread.
  const isChatRoute =
    pathname === '/my/support/chat' || /^\/my\/messages\/[^/]+$/.test(pathname);

  // Desktop master-detail / gallery surfaces need the full content width on lg
  // (the `max-w-lg` column would squeeze the layout). Mobile/tablet keep the
  // narrow column untouched. C-DESK-01 Фаза 2.
  const isWideDesktopRoute =
    pathname === '/my/bookings' || pathname === '/my/messages' || pathname === '/my/masters';
  // The desktop two-pane messenger fills the viewport: drop the phantom navbar
  // gap and the floating chrome on lg (support already lives inside the pane).
  const isDesktopChatSurface = pathname === '/my/messages';

  if (isChatRoute) {
    return (
      <div className="min-h-dvh pt-[env(safe-area-inset-top)]">
        <BlobBackground />
        <B2CRouteGuard phone={profile?.phone || null}>
          {children}
        </B2CRouteGuard>
      </div>
    );
  }

  const banners = (
    <>
      {isMasterInClientMode && <MasterModeBanner />}
      {(!hasTelegram || !hasPush) && (
        <ChannelBanner
          userId={user.id}
          hasTelegram={hasTelegram}
          hasPush={hasPush}
          botName={botName}
        />
      )}
    </>
  );

  return (
    <div
      data-theme="frost"
      className={`min-h-dvh pt-[env(safe-area-inset-top)] md:pt-20${isDesktopChatSurface ? ' lg:pt-0' : ''}`}
    >
      <GlassSafeArea />
      <PublicNavbar notifBell={<ClientNotificationsBell userId={user.id} />} />
      <SmartBackButton floating />
      <BlobBackground />
      {isDesktopChatSurface ? <div className="lg:hidden">{banners}</div> : banners}
      <div
        className={
          isWideDesktopRoute
            ? 'max-w-lg mx-auto px-4 py-6 pb-32 lg:max-w-none lg:mx-0 lg:px-0 lg:py-0 lg:pb-0'
            : 'max-w-lg mx-auto px-4 py-6 pb-32'
        }
      >
        <B2CRouteGuard phone={profile?.phone || null}>
          {children}
        </B2CRouteGuard>
      </div>
      {isDesktopChatSurface ? <div className="lg:hidden"><SupportWidget /></div> : <SupportWidget />}
    </div>
  );
}
