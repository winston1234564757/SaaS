'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, Minus, Send, Zap } from 'lucide-react';

const CANCEL_ACTIONS = [
  { href: '/dashboard/marketing', label: 'Розсилка',   Icon: Send },
  { href: '/dashboard/flash',     label: 'Пропозиція', Icon: Zap  },
] as const;
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';

function getWeekRange(offsetWeeks: number) {
  const now = getNow();
  const day = now.getDay();
  const mon = new Date(now);
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
      <div className="flex flex-col">
        <div className="skeleton-shimmer h-4 w-24 rounded-full mb-3" />
        <div className="skeleton-shimmer h-14 w-20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold tracking-[0.08em] uppercase text-[var(--text-secondary)] mb-2">
            Скасування
          </p>
          <div className="flex items-baseline gap-1.5">
            <span
              style={{
                fontFamily:    "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                fontSize:      'clamp(2.5rem, 8vw, 3.2rem)',
                fontWeight:    300,
                letterSpacing: '-0.01em',
                color:         'var(--text-primary)',
                lineHeight:    1,
              }}
            >
              {thisRate !== null ? `${thisRate}%` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1 opacity-70">цього тижня</p>
        </div>

        {delta !== null && (
          <div className="flex flex-col items-center gap-1">
            <span
              className="flex items-center gap-0.5 text-[12px] font-semibold"
              style={{ color: improved ? 'var(--success)' : delta === 0 ? 'var(--text-tertiary)' : 'var(--error)' }}
            >
              {improved ? <ArrowDown size={12} strokeWidth={2.5} /> : delta === 0 ? <Minus size={12} /> : <ArrowUp size={12} strokeWidth={2.5} />}
              {Math.abs(delta)}%
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)]">vs минулий</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
        {CANCEL_ACTIONS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150 active:scale-[0.95]"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
          >
            <span style={{ color: 'var(--accent-on)', display: 'flex' }}><Icon size={14} /></span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
