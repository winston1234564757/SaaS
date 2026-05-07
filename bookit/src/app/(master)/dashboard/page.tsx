import type { Metadata } from 'next';
import { DashboardGreeting } from '@/components/master/dashboard/DashboardGreeting';
import { StatsMosaicWidget } from '@/components/master/dashboard/widgets/StatsMosaicWidget';
import { ScheduleWidget } from '@/components/master/dashboard/widgets/ScheduleWidget';
import { WeeklyChartWidget } from '@/components/master/dashboard/widgets/WeeklyChartWidget';
import { MonthlyCalendarWidget } from '@/components/master/dashboard/widgets/MonthlyCalendarWidget';
import { QuickActionsWidget } from '@/components/master/dashboard/widgets/QuickActionsWidget';
import { FreeSlotsWidget } from '@/components/master/dashboard/widgets/FreeSlotsWidget';
import { InsightsRow } from '@/components/master/dashboard/widgets/InsightsRow';
import { DashboardDrawers } from '@/components/master/dashboard/DashboardDrawers';

export const metadata: Metadata = {
  title: 'Dashboard — Bookit',
};

export default async function DashboardPage() {
  return (
    <>
      <div className="flex flex-col gap-4 lg:gap-5">
        {/* Greeting */}
        <DashboardGreeting />

        {/* Stats mosaic */}
        <StatsMosaicWidget />

        {/* Free slots — live money signal */}
        <FreeSlotsWidget />

        {/* Insights: top client + avg check */}
        <InsightsRow />

        {/* Schedule + Weekly chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
          <div className="lg:col-span-7">
            <ScheduleWidget />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-5">
            <WeeklyChartWidget />
            {/* Quick actions — desktop sidebar column */}
            <div className="hidden lg:block">
              <QuickActionsWidget />
            </div>
          </div>
        </div>

        {/* Calendar — collapsed to current week by default */}
        <MonthlyCalendarWidget />

        {/* Quick actions — mobile (below calendar) */}
        <div className="lg:hidden">
          <QuickActionsWidget />
        </div>
      </div>

      <DashboardDrawers />
    </>
  );
}
