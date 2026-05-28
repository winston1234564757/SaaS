'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Zap, Sparkles, FileText, Send } from 'lucide-react';
import { format, addDays } from 'date-fns';

const DAY_ACTIONS = [
  { href: '/dashboard/flash',                      label: 'Flash',     Icon: Zap      },
  { href: '/dashboard/marketing?mode=free_slots',  label: 'Сторіс',    Icon: Sparkles },
  { href: '/dashboard/marketing?mode=templates',   label: 'Шаблони',   Icon: FileText },
  { href: '/dashboard/marketing',                  label: 'Розсилки',  Icon: Send     },
] as const;
import { uk } from 'date-fns/locale';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DOW_UA: Record<number, string> = { 1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб' };

export function NextFreeDaysWidget() {
  const now  = getNow();
  const from = toISO(addDays(now, 1));
  const to   = toISO(addDays(now, 14));
  const { bookings, isLoading } = useBookings(from, to);

  const freeDays = useMemo(() => {
    const booked = new Set<string>();
    (bookings ?? []).forEach(b => { if (b.status !== 'cancelled') booked.add(b.date); });
    const result: { iso: string; dow: string; day: string; month: string }[] = [];
    for (let i = 1; i <= 14 && result.length < 5; i++) {
      const d   = addDays(now, i);
      const dow = d.getDay();
      if (dow === 0) continue;
      const iso = toISO(d);
      if (!booked.has(iso)) {
        result.push({
          iso,
          dow:   DOW_UA[dow] ?? '',
          day:   format(d, 'd'),
          month: format(d, 'MMM', { locale: uk }),
        });
      }
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  if (!isLoading && freeDays.length === 0) return null;

  return (
    <div className="flex flex-col">
      <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--text-tertiary)] mb-3">
        Вільні дні
      </p>

      {isLoading ? (
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton-shimmer rounded-lg flex-1" style={{ height: 56 }} />
          ))}
        </div>
      ) : (
        <div className="flex gap-2">
          {freeDays.slice(0, 5).map(({ iso, dow, day, month }) => (
            <div
              key={iso}
              className="flex-1 flex flex-col items-center py-2 rounded-lg"
              style={{
                background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                border:     '1px solid color-mix(in srgb, var(--accent) 14%, transparent)',
              }}
            >
              <span
                className="font-mono text-[9px] font-bold tracking-[0.1em] uppercase mb-1"
                style={{ color: 'var(--accent)' }}
              >
                {dow}
              </span>
              <span
                className="font-mono text-[18px] font-bold leading-none tabular-nums"
                style={{ color: 'var(--text-primary)' }}
              >
                {day}
              </span>
              <span
                className="font-mono text-[9px] tracking-[0.05em] mt-1 capitalize"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {month}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
        {DAY_ACTIONS.map(({ href, label, Icon }) => (
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
