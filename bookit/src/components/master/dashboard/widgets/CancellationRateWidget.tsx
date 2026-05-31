'use client';

import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';

function getWeekRange(offsetWeeks: number) {
  const now = getNow();
  const day  = now.getDay();
  const mon  = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offsetWeeks * 7);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: fmt(mon), to: fmt(sun) };
}

function calcRate(bookings: { status: string }[]): number | null {
  const valid = bookings.filter(b =>
    ['confirmed', 'pending', 'completed', 'cancelled'].includes(b.status),
  );
  if (!valid.length) return null;
  return Math.round((valid.filter(b => b.status === 'cancelled').length / valid.length) * 100);
}

export function CancellationRateWidget() {
  const thisWeek = getWeekRange(0);
  const lastWeek = getWeekRange(-1);

  const { bookings: thisBk, isLoading: l1 } = useBookings(thisWeek.from, thisWeek.to);
  const { bookings: lastBk, isLoading: l2 } = useBookings(lastWeek.from, lastWeek.to);

  const thisRate = (thisBk ? calcRate(thisBk) : null);
  const lastRate = (lastBk ? calcRate(lastBk) : null);

  const delta    = thisRate !== null && lastRate !== null ? thisRate - lastRate : null;
  const improved = delta !== null ? delta < 0 : null;

  if (l1 || l2) {
    return (
      <div className="widget-card p-5">
        <div className="skeleton-shimmer h-4 w-28 rounded-full mb-3" />
        <div className="skeleton-shimmer h-10 w-20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="widget-card p-5 flex items-center gap-5">
      <div className="flex-1 min-w-0">
        <p className="widget-heading mb-1.5">Скасування</p>
        <p className="metric-value text-[2.4rem] leading-none text-[var(--text-primary)]">
          {thisRate !== null ? `${thisRate}%` : '—'}
        </p>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5 opacity-70">цього тижня</p>
      </div>

      {delta !== null && (
        <div
          className={`flex flex-col items-center justify-center w-[52px] h-[52px] rounded-xl text-[11px] font-bold shrink-0 ${
            improved
              ? 'bg-[var(--success)]/12 text-[var(--success)]'
              : delta === 0
              ? 'text-[var(--text-tertiary)]'
              : 'bg-[var(--error)]/12 text-[var(--error)]'
          }`}
          style={delta === 0 ? { background: 'var(--border)' } : undefined}
        >
          {improved ? (
            <ArrowDown size={15} strokeWidth={2.5} />
          ) : delta === 0 ? (
            <Minus size={15} />
          ) : (
            <ArrowUp size={15} strokeWidth={2.5} />
          )}
          <span className="mt-0.5 leading-none">{Math.abs(delta)}%</span>
        </div>
      )}

      {delta === null && thisRate !== null && (
        <p className="text-[11px] text-[var(--text-tertiary)] opacity-50 shrink-0">
          немає порівняння
        </p>
      )}
    </div>
  );
}
