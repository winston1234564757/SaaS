'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Zap, Sparkles, FileText, Send } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';

const DAY_ACTIONS = [
  { href: '/dashboard/flash',                      label: 'Flash',     Icon: Zap      },
  { href: '/dashboard/marketing?mode=free_slots',  label: 'Сторіс',    Icon: Sparkles },
  { href: '/dashboard/marketing?mode=templates',   label: 'Шаблони',   Icon: FileText },
  { href: '/dashboard/marketing',                  label: 'Розсилки',  Icon: Send     },
] as const;

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
    (bookings ?? []).forEach(b => {
      if (b.status !== 'cancelled') booked.add(b.date);
    });
    const result: { iso: string; dayLabel: string; dateLabel: string }[] = [];
    for (let i = 1; i <= 14 && result.length < 5; i++) {
      const d   = addDays(now, i);
      const dow = d.getDay();
      if (dow === 0) continue;
      const iso = toISO(d);
      if (!booked.has(iso)) {
        result.push({
          iso,
          dayLabel:  DOW_UA[dow] ?? '',
          dateLabel: format(d, 'd MMM', { locale: uk }),
        });
      }
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  if (!isLoading && freeDays.length === 0) return null;

  return (
    <div className="flex flex-col">
      <p className="text-[15px] font-semibold tracking-[0.08em] uppercase mb-4" style={{ color: 'var(--text-secondary)' }}>
        Вільні дні
      </p>

      {isLoading ? (
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="skeleton-shimmer h-[54px] w-[60px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {freeDays.map(({ iso, dayLabel, dateLabel }) => (
            <span
              key={iso}
              className="flex flex-col items-center px-3.5 py-2.5 rounded-xl gap-[4px]"
              style={{
                background:  'var(--surface)',
                border:      '1px solid var(--border)',
              }}
            >
              <span
                className="text-[9px] font-bold tracking-[0.14em] uppercase"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {dayLabel}
              </span>
              <span
                style={{
                  fontFamily:    "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      '1.1rem',
                  fontWeight:    400,
                  color:         'var(--text-primary)',
                  lineHeight:    1,
                  letterSpacing: '0.01em',
                }}
              >
                {dateLabel.split(' ')[0]}
              </span>
              <span className="text-[9px] text-[var(--text-tertiary)]">
                {dateLabel.split(' ')[1]}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-4 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
        {DAY_ACTIONS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150 active:scale-[0.95]"
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
