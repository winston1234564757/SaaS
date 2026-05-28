'use client';

import { useState } from 'react';
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
  { key: 'confirmed', label: 'підтверджено', bg: 'var(--success)' },
  { key: 'pending',   label: 'очікує',       bg: 'var(--warning)' },
  { key: 'completed', label: 'завершено',    bg: 'var(--text-tertiary)' },
  { key: 'cancelled', label: 'скасовано',    bg: 'var(--error)' },
] as const;

function Divider() {
  return <div className="h-px w-full" style={{ background: 'var(--border)' }} />;
}

function Label({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--text-tertiary)]">
      {children}
    </p>
  );
}

export function StudioStatsWidget() {
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

      {/* Row 1 — Today */}
      <div className="py-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <Label>Сьогодні</Label>
            <div className="mt-3 flex items-baseline gap-2">
              {s.isLoading ? (
                <div className="skeleton-shimmer h-10 w-12 rounded-lg" />
              ) : (
                <Link
                  href="/dashboard/bookings"
                  className="group flex items-baseline gap-2 active:opacity-70 transition-opacity"
                >
                  <span className="metric-value text-[2.8rem] font-bold leading-none text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-200">
                    <AnimatedNumber value={activeCount} format={String} />
                  </span>
                  <span className="text-[14px] text-[var(--text-tertiary)]">
                    {pluralUk(activeCount, 'запис', 'записи', 'записів')}
                  </span>
                </Link>
              )}
            </div>
          </div>

          {!s.isLoading && visibleItems.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-6">
              {visibleItems.map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <div className="w-[4px] h-[4px] rounded-full flex-shrink-0" style={{ background: item.bg }} />
                  <span className="text-[12px] tracking-[0.04em] text-[var(--text-tertiary)] whitespace-nowrap">
                    {counts[item.key]} {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* Row 2 — Revenue / Clients */}
      <div className="py-5 grid grid-cols-2 gap-x-8">
        <button
          type="button"
          onClick={() => setRevenueOpen(true)}
          className="text-left group active:opacity-70 transition-opacity"
        >
          <Label>Виручка</Label>
          <div className="mt-3">
            {s.isLoading ? (
              <div className="skeleton-shimmer h-7 w-20 rounded-lg" />
            ) : (
              <p className="metric-value text-[1.6rem] font-bold leading-none text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-200">
                <AnimatedNumber value={s.todayRevenue} format={fmt} />
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2 min-h-[20px]">
              <TrendChip value={revTrend.value} positive={revTrend.positive} />
              {!s.isLoading && s.todayCompleted > 0 && (
                <span className="text-[11px] text-[var(--text-tertiary)] tracking-[0.03em]">
                  {s.todayCompleted} завершених
                </span>
              )}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setClientsOpen(true)}
          className="text-left group active:opacity-70 transition-opacity"
        >
          <Label>Клієнти тижня</Label>
          <div className="mt-3">
            {s.isLoading ? (
              <div className="skeleton-shimmer h-7 w-12 rounded-lg" />
            ) : (
              <p className="metric-value text-[1.6rem] font-bold leading-none text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-200">
                <AnimatedNumber value={s.weekClients} format={String} />
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2 min-h-[20px]">
              <TrendChip
                value={s.weekNewClients > 0 ? `+${s.weekNewClients}` : '—'}
                positive={s.weekNewClients > 0 ? true : null}
              />
              {!s.isLoading && s.weekNewClients > 0 && (
                <span className="text-[11px] text-[var(--text-tertiary)] tracking-[0.03em]">нових</span>
              )}
            </div>
          </div>
        </button>
      </div>

      <Divider />

      {/* Row 3 — Week revenue */}
      <div className="py-5">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <Label>Виручка за тиждень</Label>
          <TrendChip value={weekTrend.value} positive={weekTrend.positive} />
        </div>

        {s.isLoading ? (
          <div className="skeleton-shimmer h-6 w-28 rounded-lg mb-4" />
        ) : (
          <p className="metric-value text-[1.25rem] font-bold text-[var(--text-primary)] mb-4">
            {fmt(weekRevenue)}
          </p>
        )}

        {(() => {
          const pct = Math.round((weekRevenue / Math.max(weekRevenue, prevWeekRevenue, 1)) * 100);
          return (
            <div className="h-px relative" style={{ background: 'var(--border)' }}>
              <div
                className="absolute inset-y-0 left-0 h-px transition-all duration-700"
                style={{ background: 'var(--accent)', width: `${pct}%` }}
              />
              {pct > 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full pulse-accent-dot"
                  style={{ background: 'var(--accent)', left: `calc(${pct}% - 3px)` }}
                />
              )}
            </div>
          );
        })()}

        {!s.isLoading && prevWeekRevenue > 0 && (
          <p className="text-[11px] text-[var(--text-tertiary)] tracking-[0.03em] mt-2.5">
            Минулий тиждень: {fmt(prevWeekRevenue)}
          </p>
        )}
      </div>

      <RevenueModal
        isOpen={revenueOpen} onClose={() => setRevenueOpen(false)}
        bookings={todayBookings} totalRevenue={s.todayRevenue}
      />
      <ClientsModal
        isOpen={clientsOpen} onClose={() => setClientsOpen(false)}
        weekBookings={weekBookings} allClients={clients}
        newPhones={new Set(s.weekNewPhones)}
      />
    </div>
  );
}
