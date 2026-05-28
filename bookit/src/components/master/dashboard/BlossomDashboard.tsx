'use client';

import { motion } from 'framer-motion';
import { DashboardGreeting } from './DashboardGreeting';
import { BlossomStatsWidget } from './widgets/blossom/StatsWidget';
import { ScheduleWidget } from './widgets/blossom/ScheduleWidget';
import { WeeklyChartWidget } from './widgets/blossom/WeeklyChartWidget';
import { MonthlyCalendarWidget } from './widgets/blossom/MonthlyCalendarWidget';
import { QuickActionsWidget } from './widgets/blossom/QuickActionsWidget';
import { FreeSlotsWidget } from './widgets/blossom/FreeSlotsWidget';
import { InsightsRow } from './widgets/blossom/InsightsRow';
import { ChannelHealthWidget } from './widgets/blossom/ChannelHealthWidget';
import { TopServicesWidget } from './widgets/blossom/TopServicesWidget';
import { NextFreeDaysWidget } from './widgets/blossom/NextFreeDaysWidget';
import { PeakHoursWidget } from './widgets/blossom/PeakHoursWidget';
import { CancellationRateWidget } from './widgets/blossom/CancellationRateWidget';

const item = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, duration: 0.65, bounce: 0.08 } },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const sidebarStagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

function Label({ children }: { children: string }) {
  return (
    <p className="heading-serif text-[18px] tracking-[0.12em] uppercase text-[var(--text-primary)] px-0.5 mb-3">
      {children}
    </p>
  );
}

/* ── Left utility col — xl only ── */
function LeftCol() {
  return (
    <motion.aside
      className="hidden xl:flex flex-col gap-4 sticky self-start"
      style={{ top: 'calc(var(--topbar-height) + 24px)' }}
      variants={sidebarStagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={item}><QuickActionsWidget /></motion.div>
      <motion.div variants={item}><ChannelHealthWidget /></motion.div>
    </motion.aside>
  );
}

/* ── Right sidebar — lg+ ── */
function RightSidebar() {
  return (
    <motion.aside
      className="hidden lg:flex flex-col gap-4 lg:sticky lg:self-start"
      style={{ top: 'calc(var(--topbar-height) + 24px)' }}
      variants={sidebarStagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={item}><FreeSlotsWidget /></motion.div>
      <motion.div variants={item}><PeakHoursWidget /></motion.div>
      <motion.div variants={item}><InsightsRow /></motion.div>
      <motion.div variants={item}><TopServicesWidget /></motion.div>
      <motion.div variants={item}><NextFreeDaysWidget /></motion.div>
      {/* ChannelHealth: lg sidebar only (xl has it in left col) */}
      <motion.div variants={item} className="hidden lg:block xl:hidden">
        <ChannelHealthWidget />
      </motion.div>
    </motion.aside>
  );
}

/* ── Main content column ── */
function MainCol() {
  return (
    <div className="flex flex-col gap-6 min-w-0">
      <DashboardGreeting />

      <motion.div
        className="flex flex-col gap-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={item}>
          <BlossomStatsWidget />
        </motion.div>

        {/* QuickActions — mobile: inline here / lg+: in sidebar / xl: in left col */}
        <motion.div variants={item} className="lg:hidden">
          <QuickActionsWidget />
        </motion.div>

        {/* FreeSlotsWidget — mobile only (lg+ it's in sidebar) */}
        <motion.div variants={item} className="lg:hidden">
          <FreeSlotsWidget />
        </motion.div>

        <motion.div variants={item}>
          <Label>Розклад</Label>
          <ScheduleWidget />
        </motion.div>

        {/* PeakHours — mobile inline, lg+ in sidebar */}
        <motion.div variants={item} className="lg:hidden">
          <PeakHoursWidget />
        </motion.div>

        <motion.div variants={item}>
          <Label>Тиждень</Label>
          <WeeklyChartWidget />
        </motion.div>

        <motion.div variants={item}>
          <Label>Місяць</Label>
          <MonthlyCalendarWidget />
        </motion.div>

        {/* Mobile-only: insights + channel health */}
        <motion.div variants={item} className="lg:hidden">
          <InsightsRow />
        </motion.div>

        <motion.div variants={item}>
          <CancellationRateWidget />
        </motion.div>

        {/* Mobile-only: remaining sidebar widgets */}
        <motion.div variants={item} className="lg:hidden">
          <TopServicesWidget />
        </motion.div>
        <motion.div variants={item} className="lg:hidden">
          <NextFreeDaysWidget />
        </motion.div>
        <motion.div variants={item} className="lg:hidden">
          <ChannelHealthWidget />
        </motion.div>
      </motion.div>
    </div>
  );
}

export function BlossomDashboard() {
  return (
    <div className="max-w-[1440px] mx-auto px-3 pt-3 pb-28 md:px-6 lg:px-8 lg:pt-6">
      <div
        className="
          flex flex-col gap-6
          lg:grid lg:grid-cols-[1fr_310px] lg:items-start lg:gap-x-8
          xl:grid-cols-[248px_1fr_296px] xl:gap-x-10
        "
      >
        <LeftCol />
        <MainCol />
        <RightSidebar />
      </div>
    </div>
  );
}
