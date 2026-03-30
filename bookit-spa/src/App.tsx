import { Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';

// Public pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ExplorePage } from './pages/ExplorePage';

// Master dashboard layout + pages
import { MasterLayout } from './pages/master/MasterLayout';
import { DashboardHomePage } from './pages/master/DashboardHomePage';
import { AnalyticsPage } from './pages/master/AnalyticsPage';
import { BookingsPage } from './pages/master/BookingsPage';
import { ClientsPage } from './pages/master/ClientsPage';
import { FlashPage } from './pages/master/FlashPage';
import { LoyaltyPage } from './pages/master/LoyaltyPage';
import { MorePage } from './pages/master/MorePage';
import { OnboardingPage } from './pages/master/OnboardingPage';
import { PricingPage } from './pages/master/PricingPage';
import { ReferralPage } from './pages/master/ReferralPage';
import { ReviewsPage } from './pages/master/ReviewsPage';
import { ServicesPage } from './pages/master/ServicesPage';
import { SettingsPage } from './pages/master/SettingsPage';
import { BillingPage } from './pages/master/BillingPage';
import { StudioPage } from './pages/master/StudioPage';

// Client portal (/my/*)
import { MyLayout } from './pages/my/MyLayout';
import { MyBookingsPage } from './pages/my/MyBookingsPage';
import { MyLoyaltyPage } from './pages/my/MyLoyaltyPage';
import { MyMastersPage } from './pages/my/MyMastersPage';
import { MyProfilePage } from './pages/my/MyProfilePage';

// Public booking page (/:slug)
import { MasterPublicPage } from './pages/public/MasterPublicPage';

// Studio pages
import { StudioJoinPage } from './pages/studio/StudioJoinPage';
import { StudioSlugPage } from './pages/studio/StudioSlugPage';

export default function App() {
  return (
    <Suspense>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/explore" element={<ExplorePage />} />

        {/* Master dashboard — protected by MasterLayout */}
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

        {/* Client portal — protected by MyLayout */}
        <Route path="/my" element={<MyLayout />}>
          <Route path="bookings" element={<MyBookingsPage />} />
          <Route path="loyalty" element={<MyLoyaltyPage />} />
          <Route path="masters" element={<MyMastersPage />} />
          <Route path="profile" element={<MyProfilePage />} />
        </Route>

        {/* Studio pages — /studio/join before /studio/:slug */}
        <Route path="/studio/join" element={<StudioJoinPage />} />
        <Route path="/studio/:slug" element={<StudioSlugPage />} />

        {/* Public master booking page — must be after all specific routes */}
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
