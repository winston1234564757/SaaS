import type { Metadata } from 'next';
import { DashboardGreeting } from '@/components/master/dashboard/DashboardGreeting';
import { ProfileStrengthWidget } from '@/components/master/dashboard/ProfileStrengthWidget';
import { WelcomeBanner } from '@/components/master/dashboard/WelcomeBanner';
import { StatsStrip } from '@/components/master/dashboard/StatsStrip';
import { WeeklyOverview } from '@/components/master/dashboard/WeeklyOverview';
import { PushSubscribeCard } from '@/components/shared/PushSubscribeCard';
import { DashboardTourProvider } from '@/components/master/dashboard/DashboardTourContext';
import { ShareCardWithHint } from '@/components/master/dashboard/ShareCardWithHint';
import { TodayScheduleWithHint } from '@/components/master/dashboard/TodayScheduleWithHint';
import { QuickActionsWithHint } from '@/components/master/dashboard/QuickActionsWithHint';
import { DashboardDrawers } from '@/components/master/dashboard/DashboardDrawers';

export const metadata: Metadata = {
  title: 'Dashboard — Bookit',
};

export default async function DashboardPage() {
  return (
    <DashboardTourProvider>
      <div className="flex flex-col gap-4">
        <DashboardGreeting />
        <ProfileStrengthWidget />
        <WelcomeBanner />
        <StatsStrip />
        <TodayScheduleWithHint />
        <WeeklyOverview />
        <QuickActionsWithHint />
        <PushSubscribeCard role="master" />
        <ShareCardWithHint />
      </div>
      <DashboardDrawers />
    </DashboardTourProvider>
  );
}
