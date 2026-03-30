import { Navigate, Outlet } from 'react-router-dom';
import { useMasterContext } from '@/lib/supabase/context';

const Spinner = () => (
  <div className="min-h-dvh flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-[#789A99] border-t-transparent animate-spin" />
  </div>
);

/**
 * ProtectedRoute — блокує доступ неавторизованим.
 * Поки сесія завантажується — показує спінер.
 * Якщо user відсутній — редирект на /login.
 */
export function ProtectedRoute() {
  const { user, isLoading } = useMasterContext();

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

/**
 * PublicRoute — блокує авторизованих (щоб не бачили /login і /register).
 * Поки сесія завантажується — показує спінер.
 * Якщо user існує — редирект на /dashboard.
 * КРИТИЧНО: перехоплює magic link arrivals — Supabase створює сесію з URL hash,
 * onAuthStateChange спрацьовує, і цей guard миттєво перенаправляє на дашборд.
 */
export function PublicRoute() {
  const { user, isLoading } = useMasterContext();

  if (isLoading) return <Spinner />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
