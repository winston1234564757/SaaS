'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { FloatingSidebar } from '@/components/shared/FloatingSidebar';
import { BentoBottomNav } from '@/components/shared/BentoBottomNav';
import { InstallBanner } from '@/components/shared/InstallBanner';
import { MasterProvider } from '@/lib/supabase/context';
import { useRealtimeNotifications } from '@/lib/supabase/hooks/useRealtimeNotifications';
import { BookingDetailsModal } from '@/components/master/bookings/BookingDetailsModal';
import type { Profile, MasterProfile } from '@/types/database';

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
    <div className="min-h-dvh">
      <BlobBackground />
      <div className="hidden lg:block">
        <FloatingSidebar />
      </div>
      <main className="relative z-0 lg:ml-[292px] min-h-dvh pb-[88px] lg:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      <div className="lg:hidden">
        <InstallBanner />
        <BentoBottomNav />
      </div>
      <Suspense>
        <BookingDetailsModal />
      </Suspense>
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  initialUser?: User | null;
  initialProfile?: Profile | null;
  initialMasterProfile?: MasterProfile | null;
}

export function DashboardLayout({ children, initialUser, initialProfile, initialMasterProfile }: DashboardLayoutProps) {
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
