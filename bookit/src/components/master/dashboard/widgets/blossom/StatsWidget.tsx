'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import Link from 'next/link';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { useClients } from '@/lib/supabase/hooks/useClients';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';
import { AnimatedNumber, TrendChip, fmt } from '../shared/StatsHelpers';
import { RevenueModal, ClientsModal } from '../shared/StatsModals';

const STATUS_ITEMS = [
  { key: 'confirmed', label: 'підтверджено', bg: 'var(--success)',       pulse: 'pulse-confirmed' },
  { key: 'pending',   label: 'очікує',       bg: 'var(--warning)',       pulse: 'pulse-pending'   },
  { key: 'completed', label: 'завершено',    bg: 'var(--text-tertiary)', pulse: ''                },
  { key: 'cancelled', label: 'скасовано',    bg: 'var(--error)',         pulse: ''                },
] as const;

function Hairline() {
  return <div className="h-px w-full" style={{ background: 'var(--border)' }} />;
}

export function BlossomStatsWidget() {
  const s = useDashboardStats();
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);

  const now       = getNow();
  const today     = format(now, 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd   = format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const prevRef   = new Date(now.getTime() - 7 * 86_400_000);
  const prevStart = format(startOfWeek(prevRef, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const prevEnd   = format(endOfWeek(prevRef,   { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { bookings: todayBookings }    = useBookings(today, today);
  const { bookings: weekBookings }     = useBookings(weekStart, weekEnd);
  const { bookings: prevWeekBookings } = useBookings(prevStart, prevEnd);
  const { clients }                    = useClients();

  const weekRevenue     = weekBookings.filter(b => b.status === 'completed').reduce((a, b) => a + b.total_price, 0);
  const prevWeekRevenue = prevWeekBookings.filter(b => b.status === 'completed').reduce((a, b) => a + b.total_price, 0);
  const barPct          = Math.round((weekRevenue / Math.max(weekRevenue, prevWeekRevenue, 1)) * 100);
  const activeCount     = s.todayCount - s.todayCancelled;

  const revTrend = (() => {
    if (s.prevDayRevenue === 0 && s.todayRevenue === 0) return { value: '—', positive: null as null };
    if (s.prevDayRevenue === 0) return { value: 'новий', positive: true };
    const pct = Math.round(((s.todayRevenue - s.prevDayRevenue) / s.prevDayRevenue) * 100);
    return { value: `${pct > 0 ? '+' : ''}${pct}%`, positive: pct >= 0 };
  })();

  const weekTrend = (() => {
    if (prevWeekRevenue === 0 && weekRevenue === 0) return { value: '—', positive: null as null };
    if (prevWeekRevenue === 0) return { value: 'перший тиждень', positive: true };
    const pct = Math.round(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100);
    return { value: `${pct > 0 ? '+' : ''}${pct}%`, positive: pct >= 0 };
  })();

  const counts = {
    confirmed: s.todayConfirmed,
    pending:   s.todayPending,
    completed: s.todayCompleted,
    cancelled: s.todayCancelled,
  } as const;

  const visibleItems = STATUS_ITEMS.filter(item => counts[item.key] > 0);

  return (
    <div className="flex flex-col">

      {/* ─── Section 1 · Today count ───────────────────────────────────────── */}
      <Link
        href="/dashboard/bookings"
        className="group py-6 flex items-start gap-8 active:opacity-75 transition-opacity duration-100"
      >
        {/* Left: Cormorant number */}
        <div className="flex flex-col">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-3">
            Сьогодні
          </p>

          {s.isLoading ? (
            <div className="skeleton-shimmer h-20 w-16 rounded-xl" />
          ) : (
            <motion.p
              className="leading-none group-hover:text-[var(--accent)] transition-colors duration-200"
              style={{
                fontFamily:    "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                fontSize:      'clamp(4rem, 12vw, 5.5rem)',
                fontWeight:    300,
                letterSpacing: '-0.01em',
                color:         'var(--text-primary)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring' as const, duration: 0.5, bounce: 0 }}
            >
              <AnimatedNumber value={activeCount} format={String} />
            </motion.p>
          )}

          <p className="font-service text-[14px] text-[var(--text-secondary)] mt-1.5 min-h-[20px]">
            {s.isLoading ? ' ' : pluralUk(activeCount, 'запис', 'записи', 'записів')}
          </p>
        </div>

        {/* Right: status breakdown */}
        {!s.isLoading && visibleItems.length > 0 && (
          <div className="flex flex-col gap-2 pt-[3.25rem]">
            {visibleItems.map(item => (
              <div key={item.key} className="flex items-center gap-2">
                <div
                  className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${item.pulse}`}
                  style={{ background: item.bg }}
                />
                <span className="text-[13px] whitespace-nowrap text-[var(--text-secondary)]">
                  {counts[item.key]} {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </Link>

      <Hairline />

      {/* ─── Section 2 · Revenue + Clients ────────────────────────────────── */}
      <div className="py-6 grid grid-cols-2 gap-x-6 gap-y-0">

        {/* Виручка */}
        <button
          type="button"
          onClick={() => setRevenueOpen(true)}
          className="text-left group active:scale-[0.98] transition-transform duration-100"
        >
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-2">
            Виручка
          </p>
          {s.isLoading ? (
            <div className="skeleton-shimmer h-8 w-24 rounded-lg" />
          ) : (
            <p className="metric-value text-[1.75rem] font-semibold leading-none text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-200">
              <AnimatedNumber value={s.todayRevenue} format={fmt} />
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap min-h-[22px]">
            <TrendChip value={revTrend.value} positive={revTrend.positive} />
            {!s.isLoading && s.todayCompleted > 0 && (
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {s.todayCompleted} завершених
              </span>
            )}
            {!s.isLoading && s.todayRevenue === 0 && s.todayCompleted === 0 && (
              <span className="text-[11px] text-[var(--text-tertiary)]">ще немає</span>
            )}
          </div>
        </button>

        {/* Клієнти тижня */}
        <button
          type="button"
          onClick={() => setClientsOpen(true)}
          className="text-left group active:scale-[0.98] transition-transform duration-100"
        >
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-2">
            Клієнти тижня
          </p>
          {s.isLoading ? (
            <div className="skeleton-shimmer h-8 w-16 rounded-lg" />
          ) : (
            <p className="metric-value text-[1.75rem] font-semibold leading-none text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-200">
              <AnimatedNumber value={s.weekClients} format={String} />
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap min-h-[22px]">
            <TrendChip
              value={s.weekNewClients > 0 ? `+${s.weekNewClients}` : '—'}
              positive={s.weekNewClients > 0 ? true : null}
            />
            {!s.isLoading && s.weekNewClients > 0 && (
              <span className="text-[11px] text-[var(--text-tertiary)]">нових</span>
            )}
          </div>
        </button>
      </div>

      <Hairline />

      {/* ─── Section 3 · Week revenue ──────────────────────────────────────── */}
      <div className="py-6">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)]">
            Виручка за тиждень
          </p>
          <div className="flex-shrink-0">
            <TrendChip value={weekTrend.value} positive={weekTrend.positive} />
          </div>
        </div>

        {s.isLoading ? (
          <div className="skeleton-shimmer h-6 w-32 rounded-lg mb-4" />
        ) : (
          <p className="metric-value text-[1.35rem] font-semibold text-[var(--text-primary)] mb-4">
            {fmt(weekRevenue)}
          </p>
        )}

        {/* Editorial 1px progress line — replaces the rounded progress bar */}
        <div className="relative h-px" style={{ background: 'var(--border)' }}>
          <motion.div
            className="absolute inset-y-0 left-0 h-px"
            style={{ background: 'var(--accent)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
          />
          {/* Accent dot at progress end */}
          {barPct > 2 && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full"
              style={{ background: 'var(--accent)', left: `${barPct}%`, marginLeft: -2.5 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.95 }}
            />
          )}
        </div>

        {!s.isLoading && prevWeekRevenue > 0 && (
          <p className="text-[11px] text-[var(--text-tertiary)] mt-2.5">
            Минулий тиждень: {fmt(prevWeekRevenue)}
          </p>
        )}
      </div>

      {/* Modals */}
      <RevenueModal
        isOpen={revenueOpen}
        onClose={() => setRevenueOpen(false)}
        bookings={todayBookings}
        totalRevenue={s.todayRevenue}
      />
      <ClientsModal
        isOpen={clientsOpen}
        onClose={() => setClientsOpen(false)}
        weekBookings={weekBookings}
        allClients={clients}
        newPhones={new Set(s.weekNewPhones)}
      />
    </div>
  );
}
