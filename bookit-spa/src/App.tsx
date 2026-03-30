import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './components/auth/AuthGuards';

// Lazy-loaded pages — route-level code splitting
const HomePage            = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage           = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage        = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const AuthCallbackPage    = lazy(() => import('./pages/auth/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const ExplorePage         = lazy(() => import('./pages/ExplorePage').then(m => ({ default: m.ExplorePage })));

const MasterLayout        = lazy(() => import('./pages/master/MasterLayout').then(m => ({ default: m.MasterLayout })));
const DashboardHomePage   = lazy(() => import('./pages/master/DashboardHomePage').then(m => ({ default: m.DashboardHomePage })));
const AnalyticsPage       = lazy(() => import('./pages/master/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const BookingsPage        = lazy(() => import('./pages/master/BookingsPage').then(m => ({ default: m.BookingsPage })));
const ClientsPage         = lazy(() => import('./pages/master/ClientsPage').then(m => ({ default: m.ClientsPage })));
const FlashPage           = lazy(() => import('./pages/master/FlashPage').then(m => ({ default: m.FlashPage })));
const LoyaltyPage         = lazy(() => import('./pages/master/LoyaltyPage').then(m => ({ default: m.LoyaltyPage })));
const MorePage            = lazy(() => import('./pages/master/MorePage').then(m => ({ default: m.MorePage })));
const OnboardingPage      = lazy(() => import('./pages/master/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const PricingPage         = lazy(() => import('./pages/master/PricingPage').then(m => ({ default: m.PricingPage })));
const ReferralPage        = lazy(() => import('./pages/master/ReferralPage').then(m => ({ default: m.ReferralPage })));
const ReviewsPage         = lazy(() => import('./pages/master/ReviewsPage').then(m => ({ default: m.ReviewsPage })));
const ServicesPage        = lazy(() => import('./pages/master/ServicesPage').then(m => ({ default: m.ServicesPage })));
const SettingsPage        = lazy(() => import('./pages/master/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BillingPage         = lazy(() => import('./pages/master/BillingPage').then(m => ({ default: m.BillingPage })));
const StudioPage          = lazy(() => import('./pages/master/StudioPage').then(m => ({ default: m.StudioPage })));

const MyLayout            = lazy(() => import('./pages/my/MyLayout').then(m => ({ default: m.MyLayout })));
const MyBookingsPage      = lazy(() => import('./pages/my/MyBookingsPage').then(m => ({ default: m.MyBookingsPage })));
const MyLoyaltyPage       = lazy(() => import('./pages/my/MyLoyaltyPage').then(m => ({ default: m.MyLoyaltyPage })));
const MyMastersPage       = lazy(() => import('./pages/my/MyMastersPage').then(m => ({ default: m.MyMastersPage })));
const MyProfilePage       = lazy(() => import('./pages/my/MyProfilePage').then(m => ({ default: m.MyProfilePage })));

const MasterPublicPage    = lazy(() => import('./pages/public/MasterPublicPage').then(m => ({ default: m.MasterPublicPage })));

const StudioJoinPage      = lazy(() => import('./pages/studio/StudioJoinPage').then(m => ({ default: m.StudioJoinPage })));
const StudioSlugPage      = lazy(() => import('./pages/studio/StudioSlugPage').then(m => ({ default: m.StudioSlugPage })));

const PageLoader = () => (
  <div className="min-h-dvh flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-[#789A99] border-t-transparent animate-spin" />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Повністю публічні — без guard */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* PublicRoute — редирект на /dashboard якщо вже авторизований */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ProtectedRoute — редирект на /login якщо не авторизований */}
        <Route element={<ProtectedRoute />}>
          {/* Master dashboard */}
          <Route path="/dashboard" element={<MasterLayout />}>
            <Route index element={<DashboardHomePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="flash" element={<FlashPage />} />
            <Route path="loyalty" element={<LoyaltyPage />} />
            <Route path="more" element={<MorePage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="referral" element={<ReferralPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="studio" element={<StudioPage />} />
          </Route>

          {/* Client portal */}
          <Route path="/my" element={<MyLayout />}>
            <Route path="bookings" element={<MyBookingsPage />} />
            <Route path="loyalty" element={<MyLoyaltyPage />} />
            <Route path="masters" element={<MyMastersPage />} />
            <Route path="profile" element={<MyProfilePage />} />
          </Route>
        </Route>

        {/* Studio pages — публічні */}
        <Route path="/studio/join" element={<StudioJoinPage />} />
        <Route path="/studio/:slug" element={<StudioSlugPage />} />

        {/* Public master booking page — після всіх специфічних маршрутів */}
        <Route path="/:slug" element={<MasterPublicPage />} />

        {/* 404 catch-all */}
        <Route
          path="*"
          element={
            <div className="min-h-dvh flex items-center justify-center p-6 text-center text-[#A8928D]">
              Сторінку не знайдено (404)
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
