import { Navigate, Outlet } from 'react-router-dom';
import { useMasterContext } from '@/lib/supabase/context';
import { BlobBackground } from '@/components/shared/BlobBackground';

export function MyLayout() {
  const { user, masterProfile, isLoading } = useMasterContext();

  if (isLoading) return <div className="p-6 text-sm text-[#A8928D]">Завантаження...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-dvh">
      <BlobBackground />
      {/* TODO: port @/components/client/MasterModeBanner — shows when master visits in client mode */}
      {masterProfile && (
        <div className="bg-[#789A99] text-white text-xs text-center py-2 px-4">
          Ви переглядаєте як клієнт
        </div>
      )}
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <Outlet />
      </div>
    </div>
  );
}
