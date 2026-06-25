'use client';

import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
import { StockWidget } from './widgets/frost/StockWidget';
import { ManualBookingForm } from '@/components/master/bookings/ManualBookingForm';
import { Sheet } from '@/components/ui/Sheet';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import { useSlotsFromStore } from '@/lib/supabase/hooks/useSlotsFromStore';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useMasterContext } from '@/lib/supabase/context';
import type { Service } from '@/components/master/services/types';
import type { WorkingHoursConfig } from '@/types/database';

const rise = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, duration: 0.6, bounce: 0.06, delay: i * 0.055 },
  }),
};

// Quick-actions tap: press feedback via pointer state + CSS transform (NOT
// framer whileTap — it captures the first tap on touch). Navigation stays on the
// native <Link> click → fires first-tap + auto-prefetch. Matches QuickActionsWidget.
const PRESS_EASE = 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)';

const BAR_ACTIONS = [
  { href: '/dashboard/flash',                     label: 'Flash Sale',  Icon: Zap        },
  { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс',      Icon: Sparkles   },
  { href: '/dashboard/clients',                   label: 'Клієнти',     Icon: Users      },
  { href: '/dashboard/analytics',                 label: 'Аналітика',   Icon: TrendingUp },
] as const;

const TIME_GROUPS_DAY = [
  { key: 'morning',   label: 'Ранок',  from: 0,  to: 12 },
  { key: 'afternoon', label: 'День',   from: 12, to: 17 },
  { key: 'evening',   label: 'Вечір',  from: 17, to: 24 },
] as const;

type WizardSlot = { date: string; time: string; serviceId: string };

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDayTitle(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getSlotHour(slot: string) { return parseInt(slot.split(':')[0], 10); }

function FrostDivider() {
  return <div className="my-5" style={{ height: '1px', background: 'var(--border)' }} />;
}

function BarAction({
  href, label, Icon, idx, reduce,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  idx: number;
  reduce: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const release = () => setPressed(false);

  return (
    <Link
      href={href}
      onPointerDown={() => setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      className="flex-1 flex transition-colors duration-150 cursor-pointer hover:bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]"
      style={{ borderLeft: idx > 0 ? '1px solid var(--border)' : 'none' }}
    >
      <span
        className="flex-1 flex items-center justify-center gap-2.5 py-4"
        style={{
          transform: pressed && !reduce ? 'scale(0.95)' : 'scale(1)',
          transition: reduce ? undefined : PRESS_EASE,
        }}
      >
        <span
          style={{
            color: 'var(--accent)',
            opacity: 0.7,
            display: 'flex',
            transform: pressed && !reduce ? 'translateY(-2px)' : 'translateY(0)',
            transition: reduce ? undefined : PRESS_EASE,
          }}
        >
          <Icon size={16} strokeWidth={1.8} />
        </span>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
      </span>
    </Link>
  );
}

function FrostActionsBar() {
  const reduce = useReducedMotion();

  return (
    <div className="bento-card overflow-hidden">
      <div className="flex">
        {BAR_ACTIONS.map(({ href, label, Icon }, idx) => (
          <BarAction
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            idx={idx}
            reduce={!!reduce}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── FreeDaySlotsContent — mounted only when a day is selected ─ */
interface FreeDaySlotsContentProps {
  date: string;
  onClose: () => void;
  onSlotClick: (time: string, serviceId: string) => void;
}

function FreeDaySlotsContent({ date, onClose, onSlotClick }: FreeDaySlotsContentProps) {
  const { profile, masterProfile } = useMasterContext();
  const masterId = masterProfile?.id ?? profile?.id;
  const { services, isLoading: servicesLoading } = useServices();
  const wh = (masterProfile?.working_hours as Partial<WorkingHoursConfig> | null) ?? {};
  const bufferMin = wh.buffer_time_minutes ?? 0;
  const { data: scheduleStore, isLoading: scheduleLoading } = useWizardSchedule(masterId, date, date);

  const activeServices = useMemo(() => (services ?? []).filter((s: Service) => s.active), [services]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const selectedService = useMemo(
    () => activeServices.find(s => s.id === selectedServiceId) ?? activeServices[0] ?? null,
    [activeServices, selectedServiceId],
  );

  const allSlots = useSlotsFromStore(
    selectedService ? date : null,
    selectedService?.duration ?? 0,
    bufferMin, wh, scheduleStore,
  );

  const isLoading = servicesLoading || scheduleLoading;

  const groupedSlots = useMemo(() =>
    TIME_GROUPS_DAY
      .map(g => ({ ...g, slots: allSlots.filter(s => { const h = getSlotHour(s); return h >= g.from && h < g.to; }) }))
      .filter(g => g.slots.length > 0),
    [allSlots],
  );

  function handleSlotClick(time: string) {
    if (!selectedService) return;
    onSlotClick(time, selectedService.id);
    onClose();
  }

  return (
    <div className="px-4 pb-6 flex flex-col gap-4">
      {!servicesLoading && activeServices.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {activeServices.map((svc: Service) => {
            const isActive = (selectedService?.id ?? activeServices[0]?.id) === svc.id;
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => setSelectedServiceId(svc.id)}
                aria-pressed={isActive}
                className="flex-shrink-0 px-2.5 py-2 rounded-full text-[11px] font-bold tracking-[0.04em] transition-colors duration-150 whitespace-nowrap"
                style={{
                  background: isActive ? 'var(--accent)' : 'var(--border)',
                  color:      isActive ? 'var(--accent-on)' : 'var(--text-tertiary)',
                  border:     '1px solid transparent',
                }}
              >
                {svc.name}
              </button>
            );
          })}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-4 gap-[3px]">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton-shimmer h-10 rounded-md" />)}
        </div>
      )}

      {!isLoading && groupedSlots.length > 0 && (
        <div className="flex flex-col gap-3">
          {groupedSlots.map(group => (
            <div key={group.key}>
              <p
                className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1.5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {group.label}
              </p>
              <div className="grid grid-cols-4 gap-[3px]">
                {group.slots.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSlotClick(t)}
                    aria-label={`Записати на ${t}`}
                    className="flex items-center justify-center py-2.5 text-[11px] font-bold tabular-nums transition-colors duration-150 active:scale-[0.93] hover:opacity-70"
                    style={{
                      borderRadius: '6px',
                      border:       '1px solid color-mix(in srgb, var(--accent) 12%, transparent)',
                      color:        'var(--text-primary)',
                      background:   'var(--surface)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && groupedSlots.length === 0 && (
        <p className="text-[13px] py-2" style={{ color: 'var(--text-tertiary)' }}>
          На цей день вільних слотів немає
        </p>
      )}
    </div>
  );
}

/* ─── Mobile layout ─────────────────────────────────────────── */
function FrostMobile({
  onSlotClick,
  onDayClick,
}: {
  onSlotClick: (time: string, serviceId: string) => void;
  onDayClick: (date: string) => void;
}) {
  return (
    <div className="frost-mobile-view flex flex-col gap-3 lg:hidden">
      <motion.div custom={0} variants={rise} initial="hidden" animate="visible" data-tour-step={0} data-tour-key="dash-0">
        <FrostGreeting />
      </motion.div>

      <motion.div custom={1} variants={rise} initial="hidden" animate="visible" data-tour-step={1}>
        <FrostMetricsStrip />
      </motion.div>

      <motion.div custom={2} variants={rise} initial="hidden" animate="visible" data-tour-step={2} data-tour-key="dash-2">
        <AdaptiveContextStrip />
      </motion.div>

      <motion.div custom={3} variants={rise} initial="hidden" animate="visible" data-tour-step={3} data-tour-key="dash-3">
        <QuickActionsWidget />
      </motion.div>

      <motion.div custom={4} variants={rise} initial="hidden" animate="visible" data-tour-step={4} data-tour-key="dash-1">
        <FreeSlotsWidget onSlotClick={onSlotClick} />
      </motion.div>

      <motion.div custom={5} variants={rise} initial="hidden" animate="visible" data-tour-step={5}>
        <ScheduleWidget />
      </motion.div>

      <motion.div custom={6} variants={rise} initial="hidden" animate="visible" data-tour-step={6}>
        <WeeklyChartWidget />
      </motion.div>

      <motion.div custom={7} variants={rise} initial="hidden" animate="visible" data-tour-step={7}>
        <PeakHoursWidget />
      </motion.div>

      <motion.div custom={8} variants={rise} initial="hidden" animate="visible" data-tour-step={8}>
        <MonthlyCalendarWidget />
      </motion.div>

      <motion.div custom={9} variants={rise} initial="hidden" animate="visible" data-tour-step={9}>
        <InsightsRow />
      </motion.div>

      <motion.div custom={10} variants={rise} initial="hidden" animate="visible" data-tour-step={10}>
        <CancellationRateWidget />
      </motion.div>

      <motion.div custom={11} variants={rise} initial="hidden" animate="visible" data-tour-step={11}>
        <TopServicesWidget />
      </motion.div>

      <motion.div custom={12} variants={rise} initial="hidden" animate="visible" data-tour-step={12}>
        <NextFreeDaysWidget onDayClick={onDayClick} />
      </motion.div>

      <motion.div custom={13} variants={rise} initial="hidden" animate="visible" data-tour-step={13}>
        <ChannelHealthWidget />
      </motion.div>

      <motion.div custom={14} variants={rise} initial="hidden" animate="visible">
        <ClientAlertsWidget />
      </motion.div>

      <motion.div custom={15} variants={rise} initial="hidden" animate="visible">
        <StockWidget />
      </motion.div>

      <motion.div custom={16} variants={rise} initial="hidden" animate="visible" data-tour-step={14}>
        <ReferralBoostWidget />
      </motion.div>
    </div>
  );
}

/* ─── Desktop — Variant F row layout ────────────────────────── */
function FrostDesktop({
  onSlotClick,
  onDayClick,
}: {
  onSlotClick: (time: string, serviceId: string) => void;
  onDayClick: (date: string) => void;
}) {
  return (
    <div className="hidden lg:block">

      <motion.div custom={0} variants={rise} initial="hidden" animate="visible" className="mb-4" data-tour-step={0} data-tour-key="dash-0">
        <FrostGreeting />
      </motion.div>

      <motion.div custom={1} variants={rise} initial="hidden" animate="visible" className="mb-4" data-tour-step={1}>
        <FrostMetricsStrip />
      </motion.div>

      <motion.div custom={2} variants={rise} initial="hidden" animate="visible" className="mb-4">
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: '3fr 2fr' }}>
          <div data-tour-step={2} data-tour-key="dash-2" className="flex flex-col">
            <AdaptiveContextStrip />
          </div>
          <EarningsPulseWidget />
        </div>
      </motion.div>

      <motion.div custom={3} variants={rise} initial="hidden" animate="visible" data-tour-step={3} data-tour-key="dash-3">
        <FrostActionsBar />
      </motion.div>

      <FrostDivider />

      <motion.div custom={4} variants={rise} initial="hidden" animate="visible">
        <div className="grid gap-4" style={{ gridTemplateColumns: '3fr 2fr' }}>
          <div data-tour-step={5} className="flex flex-col h-full">
            <ScheduleWidget />
          </div>
          <div data-tour-step={4} data-tour-key="dash-1">
            <FreeSlotsWidget onSlotClick={onSlotClick} />
          </div>
        </div>
      </motion.div>

      <FrostDivider />

      <motion.div custom={5} variants={rise} initial="hidden" animate="visible">
        <div className="grid gap-4" style={{ gridTemplateColumns: '40fr 60fr' }}>
          <div data-tour-step={6} className="flex flex-col">
            <WeeklyChartWidget />
          </div>
          <div data-tour-step={7}>
            <PeakHoursWidget />
          </div>
        </div>
      </motion.div>

      <FrostDivider />

      <motion.div custom={6} variants={rise} initial="hidden" animate="visible">
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'minmax(0, 480px) 1fr' }}>
          <div data-tour-step={8}>
            <MonthlyCalendarWidget />
          </div>
          <div data-tour-step={14}>
            <ReferralBoostWidget />
          </div>
        </div>
      </motion.div>

      <FrostDivider />

      <motion.div custom={7} variants={rise} initial="hidden" animate="visible">
        <div className="grid grid-cols-2 gap-4">
          <div data-tour-step={11}>
            <TopServicesWidget />
          </div>
          <div data-tour-step={10}>
            <CancellationRateWidget />
          </div>
        </div>
      </motion.div>

      <FrostDivider />

      <motion.div custom={8} variants={rise} initial="hidden" animate="visible">
        <div className="grid grid-cols-3 gap-4">
          <div data-tour-step={9} className="flex flex-col">
            <InsightsRow />
          </div>
          <div data-tour-step={12}>
            <NextFreeDaysWidget onDayClick={onDayClick} />
          </div>
          <div data-tour-step={13}>
            <ChannelHealthWidget />
          </div>
        </div>
      </motion.div>

      <FrostDivider />

      <motion.div custom={9} variants={rise} initial="hidden" animate="visible">
        <ClientAlertsWidget />
      </motion.div>

      <FrostDivider />

      <motion.div custom={10} variants={rise} initial="hidden" animate="visible">
        <StockWidget />
      </motion.div>

    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────── */
export function FrostDashboard() {
  const [wizard, setWizard] = useState<WizardSlot | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  function onSlotClick(time: string, serviceId: string) {
    setWizard({ date: todayISO(), time, serviceId });
  }

  function onDayClick(date: string) {
    setSelectedDay(date);
  }

  function onDaySlotClick(time: string, serviceId: string) {
    setWizard({ date: selectedDay!, time, serviceId });
    setSelectedDay(null);
  }

  return (
    <div className="max-w-[1360px] mx-auto px-3 pt-2 pb-28 md:px-6 lg:px-8 lg:pt-4">
      <FrostMobile onSlotClick={onSlotClick} onDayClick={onDayClick} />
      <FrostDesktop onSlotClick={onSlotClick} onDayClick={onDayClick} />
      <Sheet
        open={selectedDay !== null}
        onOpenChange={open => { if (!open) setSelectedDay(null); }}
        variant="bottom"
        title={selectedDay ? formatDayTitle(selectedDay) : ''}
      >
        {selectedDay && (
          <FreeDaySlotsContent
            date={selectedDay}
            onClose={() => setSelectedDay(null)}
            onSlotClick={onDaySlotClick}
          />
        )}
      </Sheet>
      <ManualBookingForm
        isOpen={wizard !== null}
        onClose={() => setWizard(null)}
        onSuccess={() => setWizard(null)}
        initialDate={wizard?.date}
        initialTime={wizard?.time}
        initialServiceId={wizard?.serviceId}
      />
    </div>
  );
}
