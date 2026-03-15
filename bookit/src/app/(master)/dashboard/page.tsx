import type { Metadata } from 'next';
import { DashboardGreeting } from '@/components/master/dashboard/DashboardGreeting';
import { WelcomeBanner } from '@/components/master/dashboard/WelcomeBanner';
import { OnboardingChecklist } from '@/components/master/dashboard/OnboardingChecklist';
import { StatsStrip } from '@/components/master/dashboard/StatsStrip';
import { TodaySchedule } from '@/components/master/dashboard/TodaySchedule';
import { WeeklyOverview } from '@/components/master/dashboard/WeeklyOverview';
import { QuickActions } from '@/components/master/dashboard/QuickActions';
import { SharePageCard } from '@/components/master/dashboard/SharePageCard';
import { PushSubscribeCard } from '@/components/shared/PushSubscribeCard';

export const metadata: Metadata = {
  title: 'Dashboard — Bookit',
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <DashboardGreeting />
      <OnboardingChecklist />
      <WelcomeBanner />
      <StatsStrip />
      <TodaySchedule />
      <WeeklyOverview />
      <QuickActions />
      <PushSubscribeCard />
      <SharePageCard />
    </div>
  );
}
