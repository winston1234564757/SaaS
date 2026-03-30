import { Suspense } from 'react';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { FloatingSidebar } from '@/components/shared/FloatingSidebar';
import { BottomNav } from '@/components/shared/BottomNav';
import { InstallBanner } from '@/components/shared/InstallBanner';
import { useRealtimeNotifications } from '@/lib/supabase/hooks/useRealtimeNotifications';
// TODO: port BookingDetailsModal
// import { BookingDetailsModal } from '@/components/master/bookings/BookingDetailsModal';

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
        {/* <BookingDetailsModal /> */}
      </Suspense>
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardInner>{children}</DashboardInner>;
}
