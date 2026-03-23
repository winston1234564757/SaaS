'use client';

import { Suspense } from 'react';
import type { User } from '@supabase/supabase-js';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { FloatingSidebar } from '@/components/shared/FloatingSidebar';
import { BottomNav } from '@/components/shared/BottomNav';
import { InstallBanner } from '@/components/shared/InstallBanner';
import { MasterProvider } from '@/lib/supabase/context';
import { useRealtimeNotifications } from '@/lib/supabase/hooks/useRealtimeNotifications';
import { BookingDetailsModal } from '@/components/master/bookings/BookingDetailsModal';
import type { Profile, MasterProfile } from '@/types/database';

function DashboardInner({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  return (
    <div className="min-h-dvh">
      <BlobBackground />
      <div className="hidden lg:block">
        <FloatingSidebar />
      </div>
      <main className="lg:ml-[292px] min-h-dvh pb-[88px] lg:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      <div className="lg:hidden">
        <InstallBanner />
        <BottomNav />
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
