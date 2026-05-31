'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Send, Zap } from 'lucide-react';
import { useBookings } from '@/lib/supabase/hooks/useBookings';

const CANCEL_ACTIONS = [
  { href: '/dashboard/marketing', label: 'Розсилка',   Icon: Send },
  { href: '/dashboard/flash',     label: 'Пропозиція', Icon: Zap  },
] as const;
import { getNow } from '@/lib/utils/now';

function getWeekRange(offsetWeeks: number) {
  const now = getNow();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offsetWeeks * 7);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
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
      <div>
        <div className="skeleton-shimmer h-4 w-24 rounded-full mb-2" />
        <div className="skeleton-shimmer h-8 w-20 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--text-tertiary)] mb-3">
        Скасування
      </p>

      <div className="flex items-baseline gap-6">
        <div>
          <span className="text-[11px] tracking-[0.1em] uppercase text-[var(--text-tertiary)]">Цей тиждень</span>
          <p className="metric-value text-[1.8rem] font-bold leading-none text-[var(--text-primary)] mt-1">
            {thisRate !== null ? `${thisRate}%` : '—'}
          </p>
        </div>
        {lastRate !== null && (
          <div>
            <span className="text-[11px] tracking-[0.1em] uppercase text-[var(--text-tertiary)]">Минулий</span>
            <p
              className="metric-value text-[1.8rem] font-bold leading-none mt-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {lastRate}%
            </p>
          </div>
        )}
        {delta !== null && delta !== 0 && (
          <div className="self-end pb-0.5">
            <span
              className="text-[12px] font-bold"
              style={{ color: improved ? 'var(--success)' : 'var(--error)' }}
            >
              {delta > 0 ? '+' : ''}{delta}%
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
        {CANCEL_ACTIONS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 active:scale-[0.94]"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <span style={{ color: 'var(--text-tertiary)', display: 'flex' }}><Icon size={11} /></span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
