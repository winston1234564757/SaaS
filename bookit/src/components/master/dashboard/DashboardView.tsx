'use client';

import { DashboardGreeting } from './DashboardGreeting';
import { StatsMosaicWidget } from './widgets/StatsMosaicWidget';
import { ScheduleWidget } from './widgets/ScheduleWidget';
import { WeeklyChartWidget } from './widgets/WeeklyChartWidget';
import { MonthlyCalendarWidget } from './widgets/MonthlyCalendarWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { FreeSlotsWidget } from './widgets/FreeSlotsWidget';
import { InsightsRow } from './widgets/InsightsRow';
import { ChannelHealthWidget } from './widgets/ChannelHealthWidget';
import { TopServicesWidget } from './widgets/TopServicesWidget';
import { NextFreeDaysWidget } from './widgets/NextFreeDaysWidget';
import { DashboardDrawers } from './DashboardDrawers';

/* Editorial section label — Monocle-style small caps divider */
function Section({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      {label && (
        <p
          className="text-[9px] font-bold uppercase tracking-[0.26em] px-1"
          style={{ color: 'var(--text-tertiary)', opacity: 0.7 }}
        >
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

/* Sidebar content — reused on mobile and desktop */
function SidebarContent() {
  return (
    <>
      <FreeSlotsWidget />
      <NextFreeDaysWidget />
      <TopServicesWidget />
      <ChannelHealthWidget />
      <InsightsRow />
      <QuickActionsWidget />
    </>
  );
}

export function DashboardView() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_284px] gap-5 items-start">

        {/* ── Main column ── */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Zone 1 — Greeting (no section label, it speaks for itself) */}
          <DashboardGreeting />

          {/* Zone 2+3 — Today stats block */}
          <StatsMosaicWidget />

          {/* Zone 4 — Schedule */}
          <Section label="Розклад">
            <ScheduleWidget />
          </Section>

          {/* Zone 5 — Weekly chart */}
          <Section label="Тиждень">
            <WeeklyChartWidget />
          </Section>

          {/* Zone 6 — Calendar */}
          <Section label="Місяць">
            <MonthlyCalendarWidget />
          </Section>
        </div>

        {/* ── Sidebar (md+, sticky) ── */}
        <aside className="hidden md:flex flex-col gap-4 sticky top-[88px] h-fit pb-16">
          <SidebarContent />
        </aside>
      </div>

      {/* ── Mobile sidebar (below main content) ── */}
      <div className="md:hidden flex flex-col gap-5 mt-6">
        <SidebarContent />
      </div>

      <DashboardDrawers />
    </>
  );
}
