'use client';

import { motion } from 'framer-motion';
import { DashboardGreeting } from './DashboardGreeting';
import { StatsMosaicWidget } from './widgets/StatsMosaicWidget';
import { ScheduleWidget } from './widgets/ScheduleWidget';
import { WeeklyChartWidget } from './widgets/WeeklyChartWidget';
import { MonthlyCalendarWidget } from './widgets/MonthlyCalendarWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { FreeSlotsWidget } from './widgets/FreeSlotsWidget';
import { InsightsRow } from './widgets/InsightsRow';
import { ChannelHealthWidget } from './widgets/ChannelHealthWidget';
import { DashboardDrawers } from './DashboardDrawers';

export function DashboardView() {
  return (
    <>
      <motion.div 
        layout
        transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-5 auto-rows-auto items-start"
      >
        {/* Main Content Column (3/4) */}
        <motion.div 
          layout 
          transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
          className="lg:col-span-3 flex flex-col gap-4 lg:gap-5"
        >
          <DashboardGreeting />

          <motion.div 
            layout 
            transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
            className="flex flex-col gap-4 lg:gap-5"
          >
            <StatsMosaicWidget />
            <WeeklyChartWidget />
            <ScheduleWidget />
          </motion.div>

          {/* Monthly Calendar — Now inside main flow but still wide enough */}
          <motion.div 
            layout 
            transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
            className="mt-2"
          >
            <MonthlyCalendarWidget />
          </motion.div>
        </motion.div>

        {/* Sidebar Column (1/4) — STICKY */}
        <motion.aside 
          layout
          transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
          className="hidden lg:flex flex-col gap-4 lg:gap-5 sticky top-[104px] self-start h-fit pb-10"
        >
          <FreeSlotsWidget />
          <ChannelHealthWidget />
          <InsightsRow />
          <QuickActionsWidget />
        </motion.aside>

        {/* Mobile-only Quick Actions */}
        <div className="lg:hidden">
          <QuickActionsWidget />
        </div>
      </motion.div>

      <DashboardDrawers />
    </>
  );
}
