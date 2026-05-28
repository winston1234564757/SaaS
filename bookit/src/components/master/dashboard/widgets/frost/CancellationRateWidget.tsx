'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, Minus, Send, Zap } from 'lucide-react';

const CANCEL_ACTIONS = [
  { href: '/dashboard/marketing', label: 'Розсилка',   Icon: Send, primary: false },
  { href: '/dashboard/flash',     label: 'Пропозиція', Icon: Zap,  primary: true  },
] as const;
import { useBookings } from '@/lib/supabase/hooks/useBookings';
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

  const thisRate = useMemo(() => (thisBk ? calcRate(thisBk) : null), [thisBk]);
  const lastRate = useMemo(() => (lastBk ? calcRate(lastBk) : null), [lastBk]);
  const delta    = thisRate !== null && lastRate !== null ? thisRate - lastRate : null;
  const improved = delta !== null ? delta < 0 : null;

  if (l1 || l2) {
    return (
      <div className="bento-card p-4">
        <div className="skeleton-shimmer h-4 w-24 rounded-full mb-2" />
        <div className="skeleton-shimmer h-10 w-16 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bento-card p-4 flex flex-col">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)] mb-1.5">
            Скасування
          </p>
          <p className="metric-value text-[2rem] font-bold leading-tight text-[var(--text-primary)]">
            {thisRate !== null ? `${thisRate}%` : '—'}
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">цього тижня</p>
        </div>

        {delta !== null && (
          <div
            className="flex flex-col items-center justify-center w-[48px] h-[48px] rounded-xl text-[11px] font-bold flex-shrink-0"
            style={{
              background: improved
                ? 'color-mix(in srgb, var(--success) 12%, transparent)'
                : delta === 0
                ? 'var(--border)'
                : 'color-mix(in srgb, var(--error) 12%, transparent)',
              color: improved ? 'var(--success)' : delta === 0 ? 'var(--text-tertiary)' : 'var(--error)',
              border: '1px solid color-mix(in srgb, var(--accent) 8%, transparent)',
            }}
          >
            {improved ? <ArrowDown size={14} strokeWidth={2.5} /> : delta === 0 ? <Minus size={14} /> : <ArrowUp size={14} strokeWidth={2.5} />}
            <span className="mt-0.5">{Math.abs(delta)}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-3 mt-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
        {CANCEL_ACTIONS.map(({ href, label, Icon, primary }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-center gap-2 h-12 rounded-[14px] font-semibold text-[13px] transition-all duration-150 active:scale-[0.96]"
            style={primary
              ? { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 3px 10px color-mix(in srgb, var(--accent) 22%, transparent)' }
              : { background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--text-primary)' }
            }
          >
            <Icon size={15} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
