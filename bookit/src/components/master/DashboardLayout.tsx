'use client';

import { Suspense } from 'react';
import type { User } from '@supabase/supabase-js';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { FloatingSidebar } from '@/components/shared/FloatingSidebar';
import { BottomNav } from '@/components/shared/BottomNav';
import { InstallBanner } from '@/components/shared/InstallBanner';
import { MasterProvider, useMasterContext } from '@/lib/supabase/context';
import { useRealtimeNotifications } from '@/lib/supabase/hooks/useRealtimeNotifications';
import { BookingDetailsModal } from '@/components/master/bookings/BookingDetailsModal';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { Profile, MasterProfile } from '@/types/database';

function RouteGuard() {
  const { profile, masterProfile, isLoading } = useMasterContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    
    // Safely redirect to client portal if role is definitively client
    if (profile?.role === 'client') {
      router.replace('/my/bookings');
      return;
    }

    if (!profile) return; // Wait for profile initialization

    const isOnboarding = pathname.includes('/dashboard/onboarding');
    const isBilling = pathname.includes('/dashboard/billing');

    if (profile.role === 'master' && !masterProfile?.avatar_emoji && !isOnboarding && !isBilling) {
      router.replace('/dashboard/onboarding');
    }
  }, [profile, masterProfile, isLoading, pathname, router]);

  return null;
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  return (
    <div className="min-h-dvh">
      <RouteGuard />
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
