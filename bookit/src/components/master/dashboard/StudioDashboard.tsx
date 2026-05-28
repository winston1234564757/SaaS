'use client';

import { motion } from 'framer-motion';
import { GreetingWidget } from './widgets/studio/GreetingWidget';
import { StudioStatsWidget } from './widgets/studio/StatsWidget';
import { ScheduleWidget } from './widgets/studio/ScheduleWidget';
import { WeeklyChartWidget } from './widgets/studio/WeeklyChartWidget';
import { MonthlyCalendarWidget } from './widgets/studio/MonthlyCalendarWidget';
import { QuickActionsWidget } from './widgets/studio/QuickActionsWidget';
import { FreeSlotsWidget } from './widgets/studio/FreeSlotsWidget';
import { InsightsRow } from './widgets/studio/InsightsRow';
import { ChannelHealthWidget } from './widgets/studio/ChannelHealthWidget';
import { TopServicesWidget } from './widgets/studio/TopServicesWidget';
import { NextFreeDaysWidget } from './widgets/studio/NextFreeDaysWidget';
import { PeakHoursWidget } from './widgets/studio/PeakHoursWidget';
import { CancellationRateWidget } from './widgets/studio/CancellationRateWidget';

const item = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, duration: 0.6, bounce: 0.06 } },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const sidebarStagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
};

/* Thin editorial rule between sections */
function Divider() {
  return <div className="h-px w-full" style={{ background: 'var(--border)' }} />;
}

/* Section label — barbershop / Monocle style */
function Label({ children }: { children: string }) {
  return (
    <p className="text-[15px] font-semibold tracking-[0.1em] uppercase text-[var(--text-secondary)] mb-3">
      {children}
    </p>
  );
}

/* ── Compact right sidebar ── */
function StudioSidebar() {
  return (
    <motion.aside
      className="hidden lg:flex flex-col gap-3 lg:sticky lg:self-start"
      style={{ top: 'calc(var(--topbar-height) + 24px)' }}
      variants={sidebarStagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={item}><FreeSlotsWidget /></motion.div>
      <motion.div variants={item}><QuickActionsWidget /></motion.div>
      <motion.div variants={item}><PeakHoursWidget /></motion.div>
      <motion.div variants={item}><InsightsRow /></motion.div>
      <motion.div variants={item}><TopServicesWidget /></motion.div>
      <motion.div variants={item}><NextFreeDaysWidget /></motion.div>
      <motion.div variants={item}><ChannelHealthWidget /></motion.div>
    </motion.aside>
  );
}

/* ── Main editorial column ── */
function StudioMain() {
  return (
    <div className="flex flex-col gap-0 min-w-0">
      <motion.div
        className="flex flex-col"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Stats — architectural numbers, no extra wrapper */}
        <motion.div variants={item} className="py-6">
          <StudioStatsWidget />
        </motion.div>

        <Divider />

        {/* Mobile: quick actions + free slots */}
        <motion.div variants={item} className="py-5 lg:hidden">
          <Label>Швидкі дії</Label>
          <QuickActionsWidget />
        </motion.div>
        <div className="lg:hidden"><Divider /></div>

        <motion.div variants={item} className="py-5 lg:hidden">
          <FreeSlotsWidget />
        </motion.div>
        <div className="lg:hidden"><Divider /></div>

        {/* Schedule */}
        <motion.div variants={item} className="py-6">
          <Label>Розклад</Label>
          <ScheduleWidget />
        </motion.div>

        <Divider />

        {/* Mobile: Peak Hours */}
        <motion.div variants={item} className="py-5 lg:hidden">
          <PeakHoursWidget />
        </motion.div>
        <div className="lg:hidden"><Divider /></div>

        {/* Weekly chart */}
        <motion.div variants={item} className="py-6">
          <Label>Тиждень</Label>
          <WeeklyChartWidget />
        </motion.div>

        <Divider />

        {/* Monthly calendar */}
        <motion.div variants={item} className="py-6">
          <Label>Місяць</Label>
          <MonthlyCalendarWidget />
        </motion.div>

        <Divider />

        {/* Cancellation rate */}
        <motion.div variants={item} className="py-6">
          <CancellationRateWidget />
        </motion.div>

        {/* Mobile-only: remaining sidebar blocks */}
        <div className="lg:hidden">
          <Divider />
          <motion.div variants={item} className="py-5"><InsightsRow /></motion.div>
          <Divider />
          <motion.div variants={item} className="py-5"><TopServicesWidget /></motion.div>
          <Divider />
          <motion.div variants={item} className="py-5"><NextFreeDaysWidget /></motion.div>
          <Divider />
          <motion.div variants={item} className="py-5"><ChannelHealthWidget /></motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export function StudioDashboard() {
  return (
    <div className="max-w-[1280px] mx-auto px-3 pt-3 pb-28 md:px-6 lg:px-8 lg:pt-6">
      <GreetingWidget />
      <Divider />
      <div
        className="
          flex flex-col gap-0
          lg:grid lg:grid-cols-[1fr_260px] lg:items-start lg:gap-x-10
          xl:gap-x-14
        "
      >
        <StudioMain />
        <StudioSidebar />
      </div>
    </div>
  );
}
