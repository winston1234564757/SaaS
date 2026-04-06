import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { DashboardGreeting } from '@/components/master/dashboard/DashboardGreeting';
import { WelcomeBanner } from '@/components/master/dashboard/WelcomeBanner';
import { ProfileStrengthWidget } from '@/components/master/dashboard/ProfileStrengthWidget';
import { StatsStrip } from '@/components/master/dashboard/StatsStrip';
import { WeeklyOverview } from '@/components/master/dashboard/WeeklyOverview';
import { PushSubscribeCard } from '@/components/shared/PushSubscribeCard';
import { DashboardTourProvider } from '@/components/master/dashboard/DashboardTourContext';
import { ShareCardWithHint } from '@/components/master/dashboard/ShareCardWithHint';
import { TodayScheduleWithHint } from '@/components/master/dashboard/TodayScheduleWithHint';
import { QuickActionsWithHint } from '@/components/master/dashboard/QuickActionsWithHint';

export const metadata: Metadata = {
  title: 'Dashboard — Bookit',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialHasSeenTour = false;
  if (user) {
    const { data: profile } = await supabase
      .from('master_profiles')
      .select('has_seen_tour')
      .eq('id', user.id)
      .single();
    initialHasSeenTour = profile?.has_seen_tour ?? false;
  }

  return (
    <DashboardTourProvider initialHasSeenTour={initialHasSeenTour}>
      <div className="flex flex-col gap-4">
        <DashboardGreeting />
        <ProfileStrengthWidget />
        <WelcomeBanner />
        <StatsStrip />
        <TodayScheduleWithHint />
        <WeeklyOverview />
        <QuickActionsWithHint />
        <PushSubscribeCard />
        <ShareCardWithHint />
      </div>
    </DashboardTourProvider>
  );
}
