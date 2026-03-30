import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/master/DashboardLayout';
import { useMasterContext } from '@/lib/supabase/context';
import { PullToRefresh } from '@/components/ui/PullToRefresh';

export function MasterLayout() {
  const { user, masterProfile, isLoading } = useMasterContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#FFE8DC' }}>
        <div className="w-8 h-8 border-2 border-[#789A99] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isOnboarding = location.pathname.includes('/dashboard/onboarding');
  const isBilling    = location.pathname.includes('/dashboard/billing');

  if (!masterProfile?.avatar_emoji && !isOnboarding && !isBilling) {
    return <Navigate to="/dashboard/onboarding" replace />;
  }

  return (
    <DashboardLayout>
      <PullToRefresh>
        <Outlet />
      </PullToRefresh>
    </DashboardLayout>
  );
}
