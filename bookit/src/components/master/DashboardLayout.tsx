'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { MasterProvider, useMasterContext } from '@/lib/supabase/context';
import { useRealtimeNotifications } from '@/lib/supabase/hooks/useRealtimeNotifications';
import { BookingDetailsModal } from '@/components/master/bookings/BookingDetailsModal';
import { DashboardTopBar } from '@/components/master/DashboardTopBar';
import { MobileHub } from '@/components/shared/MobileHub';
import { InstallBanner } from '@/components/shared/InstallBanner';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { SupportWidget } from '@/components/shared/support/SupportWidget';
import type { Profile, MasterProfile } from '@/types/database';

function ThemeApplier() {
  const { masterProfile } = useMasterContext();
  const moodTheme = masterProfile?.mood_theme ?? '';

  useEffect(() => {
    const isStudio = moodTheme === 'dark' || moodTheme === 'studio';
    const isFrost  = moodTheme === 'frost';
    const activeTheme = isStudio ? 'studio' : isFrost ? 'frost' : '';
    
    if (isStudio) {
      document.documentElement.setAttribute('data-theme', 'studio');
    } else if (isFrost) {
      document.documentElement.setAttribute('data-theme', 'frost');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Dynamic theme-color update for iOS PWA/TMA
    const colors = { studio: '#0E1D21', frost: '#EFF2FF', '': '#DDD5C6' };
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', colors[activeTheme as 'studio' | 'frost' | ''] || '#DDD5C6');
    }

    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [moodTheme]);

  return null;
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const isChatRoute = pathname === '/dashboard/support/chat';

  useEffect(() => {
    if (!navigator.serviceWorker) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SW_NAVIGATE' && typeof e.data.url === 'string') {
        router.push(e.data.url);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [router]);

  if (isChatRoute) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'transparent' }}>
        <ImpersonationBanner />
        <ThemeApplier />
        <main className="flex-1 w-full h-dvh overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'transparent' }}>
      <ImpersonationBanner />
      <ThemeApplier />

      {/* Desktop horizontal topbar */}
      <div className="hidden lg:block">
        <DashboardTopBar />
        <div className="h-24" />
      </div>

      {/* Content */}
      <main className="flex-1 w-full pt-[env(safe-area-inset-top)] lg:pt-0">
        <div
          className="max-w-7xl mx-auto px-4 py-5 lg:px-8 lg:py-8"
          style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 1rem)' }}
        >
          {children}
        </div>
      </main>

      {/* Mobile nav */}
      <div className="lg:hidden">
        <InstallBanner />
        <MobileHub />
      </div>

      <SupportWidget />

      <Suspense>
        <BookingDetailsModal />
      </Suspense>
    </div>
  );
}

interface DashboardLayoutProps {
  children:              React.ReactNode;
  initialUser?:          User | null;
  initialProfile?:       Profile | null;
  initialMasterProfile?: MasterProfile | null;
}

export function DashboardLayout({
  children,
  initialUser,
  initialProfile,
  initialMasterProfile,
}: DashboardLayoutProps) {
  return (
    <MasterProvider
      initialUser={initialUser}
      initialProfile={initialProfile}
      initialMasterProfile={initialMasterProfile}
    >
      <DashboardInner>{children}</DashboardInner>
    </MasterProvider>
  );
}
