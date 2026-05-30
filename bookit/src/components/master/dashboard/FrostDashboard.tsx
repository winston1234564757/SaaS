'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, Sparkles, Users, TrendingUp } from 'lucide-react';
import { GreetingWidget as FrostGreeting } from './widgets/frost/GreetingWidget';
import { FrostMetricsStrip } from './widgets/FrostMetricsStrip';
import { ScheduleWidget } from './widgets/frost/ScheduleWidget';
import { WeeklyChartWidget } from './widgets/frost/WeeklyChartWidget';
import { MonthlyCalendarWidget } from './widgets/frost/MonthlyCalendarWidget';
import { QuickActionsWidget } from './widgets/frost/QuickActionsWidget';
import { FreeSlotsWidget } from './widgets/frost/FreeSlotsWidget';
import { InsightsRow } from './widgets/frost/InsightsRow';
import { ChannelHealthWidget } from './widgets/frost/ChannelHealthWidget';
import { TopServicesWidget } from './widgets/frost/TopServicesWidget';
import { NextFreeDaysWidget } from './widgets/frost/NextFreeDaysWidget';
import { PeakHoursWidget } from './widgets/frost/PeakHoursWidget';
import { CancellationRateWidget } from './widgets/frost/CancellationRateWidget';
import { AdaptiveContextStrip } from './widgets/AdaptiveContextStrip';
import { ReferralBoostWidget } from './widgets/ReferralBoostWidget';
import { EarningsPulseWidget } from './widgets/EarningsPulseWidget';
import { ClientAlertsWidget } from './widgets/ClientAlertsWidget';

const rise = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, duration: 0.6, bounce: 0.06, delay: i * 0.055 },
  }),
};

const BAR_ACTIONS = [
  { href: '/dashboard/flash',                     label: 'Flash Sale',  Icon: Zap        },
  { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс',      Icon: Sparkles   },
  { href: '/dashboard/clients',                   label: 'Клієнти',     Icon: Users      },
  { href: '/dashboard/analytics',                 label: 'Аналітика',   Icon: TrendingUp },
] as const;

function FrostDivider() {
  return <div className="my-5" style={{ height: '1px', background: 'var(--border)' }} />;
}

function FrostActionsBar() {
  return (
    <div className="bento-card overflow-hidden">
      <div className="flex">
        {BAR_ACTIONS.map(({ href, label, Icon }, idx) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 transition-colors duration-150 active:scale-[0.97] active:transition-none cursor-pointer hover:bg-[rgba(15,23,42,0.04)]"
            style={{ borderLeft: idx > 0 ? '1px solid var(--border)' : 'none' }}
          >
            <span style={{ color: 'var(--accent)', opacity: 0.7, display: 'flex' }}>
              <Icon size={16} strokeWidth={1.8} />
            </span>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Mobile layout ─────────────────────────────────────────── */
function FrostMobile() {
  return (
    <div className="frost-mobile-view flex flex-col gap-3 lg:hidden">
      <motion.div custom={0} variants={rise} initial="hidden" animate="visible">
        <FrostGreeting />
      </motion.div>

      {/* Metrics strip — full bleed, scrollable on narrow */}
      <motion.div custom={1} variants={rise} initial="hidden" animate="visible">
        <FrostMetricsStrip />
      </motion.div>

      <motion.div custom={2} variants={rise} initial="hidden" animate="visible">
        <AdaptiveContextStrip />
      </motion.div>

      <motion.div custom={3} variants={rise} initial="hidden" animate="visible">
        <QuickActionsWidget />
      </motion.div>

      <motion.div custom={4} variants={rise} initial="hidden" animate="visible">
        <FreeSlotsWidget />
      </motion.div>

      <motion.div custom={5} variants={rise} initial="hidden" animate="visible">
        <ScheduleWidget />
      </motion.div>

      <motion.div custom={6} variants={rise} initial="hidden" animate="visible">
        <WeeklyChartWidget />
      </motion.div>

      <motion.div custom={7} variants={rise} initial="hidden" animate="visible">
        <PeakHoursWidget />
      </motion.div>

      <motion.div custom={8} variants={rise} initial="hidden" animate="visible">
        <MonthlyCalendarWidget />
      </motion.div>

      <motion.div custom={9} variants={rise} initial="hidden" animate="visible">
        <InsightsRow />
      </motion.div>

      <motion.div custom={10} variants={rise} initial="hidden" animate="visible">
        <CancellationRateWidget />
      </motion.div>

      <motion.div custom={11} variants={rise} initial="hidden" animate="visible">
        <TopServicesWidget />
      </motion.div>

      <motion.div custom={12} variants={rise} initial="hidden" animate="visible">
        <NextFreeDaysWidget />
      </motion.div>

      <motion.div custom={13} variants={rise} initial="hidden" animate="visible">
        <ChannelHealthWidget />
      </motion.div>

      <motion.div custom={14} variants={rise} initial="hidden" animate="visible">
        <ClientAlertsWidget />
      </motion.div>

      <motion.div custom={15} variants={rise} initial="hidden" animate="visible">
        <ReferralBoostWidget />
      </motion.div>
    </div>
  );
}

/* ─── Desktop — Variant F row layout ────────────────────────── */
function FrostDesktop() {
  return (
    <div className="hidden lg:block">

      <motion.div custom={0} variants={rise} initial="hidden" animate="visible" className="mb-4">
        <FrostGreeting />
      </motion.div>

      <motion.div custom={1} variants={rise} initial="hidden" animate="visible" className="mb-4">
        <FrostMetricsStrip />
      </motion.div>

      <motion.div custom={2} variants={rise} initial="hidden" animate="visible" className="mb-4">
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: '3fr 2fr' }}>
          <AdaptiveContextStrip />
          <EarningsPulseWidget />
        </div>
      </motion.div>

      <motion.div custom={3} variants={rise} initial="hidden" animate="visible">
        <FrostActionsBar />
      </motion.div>

      <FrostDivider />

      <motion.div custom={4} variants={rise} initial="hidden" animate="visible">
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: '3fr 2fr' }}>
          <ScheduleWidget />
          <FreeSlotsWidget />
        </div>
      </motion.div>

      <FrostDivider />

      <motion.div custom={5} variants={rise} initial="hidden" animate="visible">
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: '55fr 45fr' }}>
          <WeeklyChartWidget />
          <PeakHoursWidget />
        </div>
      </motion.div>

      <FrostDivider />

      <motion.div custom={6} variants={rise} initial="hidden" animate="visible">
        <MonthlyCalendarWidget />
      </motion.div>

      <FrostDivider />

      <motion.div custom={7} variants={rise} initial="hidden" animate="visible">
        <div className="grid grid-cols-2 gap-4 items-start">
          <TopServicesWidget />
          <CancellationRateWidget />
        </div>
      </motion.div>

      <FrostDivider />

      <motion.div custom={8} variants={rise} initial="hidden" animate="visible">
        <div className="grid grid-cols-3 gap-4 items-start">
          <InsightsRow />
          <NextFreeDaysWidget />
          <ChannelHealthWidget />
        </div>
      </motion.div>

      <FrostDivider />

      <motion.div custom={9} variants={rise} initial="hidden" animate="visible">
        <ClientAlertsWidget />
      </motion.div>

      <FrostDivider />

      <motion.div custom={10} variants={rise} initial="hidden" animate="visible">
        <ReferralBoostWidget />
      </motion.div>

    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────── */
export function FrostDashboard() {
  return (
    <div className="max-w-[1360px] mx-auto px-3 pt-2 pb-28 md:px-6 lg:px-8 lg:pt-4">
      <FrostMobile />
      <FrostDesktop />
    </div>
  );
}
