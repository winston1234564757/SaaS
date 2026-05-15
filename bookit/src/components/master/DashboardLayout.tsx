'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { MasterProvider, useMasterContext } from '@/lib/supabase/context';
import { useRealtimeNotifications } from '@/lib/supabase/hooks/useRealtimeNotifications';
import { BookingDetailsModal } from '@/components/master/bookings/BookingDetailsModal';
import { DashboardTopBar } from '@/components/master/DashboardTopBar';
import { MobileHub } from '@/components/shared/MobileHub';
import { InstallBanner } from '@/components/shared/InstallBanner';
import type { Profile, MasterProfile } from '@/types/database';

function ThemeApplier() {
  const { masterProfile } = useMasterContext();
  const moodTheme = masterProfile?.mood_theme ?? '';

  useEffect(() => {
    const isStudio = moodTheme === 'dark' || moodTheme === 'studio';
    if (isStudio) {
      document.documentElement.setAttribute('data-theme', 'studio');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    return () => { document.documentElement.removeAttribute('data-theme'); };
  }, [moodTheme]);

  return null;
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  const router = useRouter();

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

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      <ThemeApplier />

      {/* Desktop horizontal topbar */}
      <div className="hidden lg:block">
        <DashboardTopBar />
        <div className="h-24" />
      </div>

      {/* Content */}
      <main className="flex-1 w-full">
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
