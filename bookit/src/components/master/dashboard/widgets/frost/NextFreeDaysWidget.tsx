'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Zap, Sparkles, FileText, Send } from 'lucide-react';
import { format, addDays } from 'date-fns';

const DAY_ACTIONS = [
  { href: '/dashboard/revenue?drawer=flash_deals', label: 'Flash',    Icon: Zap,      primary: true  },
  { href: '/dashboard/marketing?mode=free_slots',  label: 'Сторіс',   Icon: Sparkles, primary: true  },
  { href: '/dashboard/marketing?mode=templates',   label: 'Шаблони',  Icon: FileText, primary: false },
  { href: '/dashboard/marketing',                  label: 'Розсилки', Icon: Send,     primary: false },
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
    const result: { iso: string; dayLabel: string; dateLabel: string }[] = [];
    for (let i = 1; i <= 14 && result.length < 5; i++) {
      const d = addDays(now, i);
      const dow = d.getDay();
      if (dow === 0) continue;
      const iso = toISO(d);
      if (!booked.has(iso)) {
        result.push({ iso, dayLabel: DOW_UA[dow] ?? '', dateLabel: format(d, 'd MMM', { locale: uk }) });
      }
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  if (!isLoading && freeDays.length === 0) return null;

  return (
    <div className="bento-card p-4 flex flex-col">
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)] mb-3">
        Вільні дні
      </p>

      {isLoading ? (
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton-shimmer h-12 w-12 rounded-lg flex-shrink-0" />)}
        </div>
      ) : (
        <div className="flex gap-2">
          {freeDays.map(({ iso, dayLabel, dateLabel }) => (
            <span
              key={iso}
              className="flex-1 flex flex-col items-center py-2.5 gap-[2px]"
              style={{
                borderRadius: '8px',
                border:       '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
                background:   'var(--surface)',
              }}
            >
              <span className="text-[9px] font-bold tracking-[0.1em] uppercase" style={{ color: 'var(--text-tertiary)' }}>
                {dayLabel}
              </span>
              <span className="metric-value text-[13px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {dateLabel.split(' ')[0]}
              </span>
              <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                {dateLabel.split(' ')[1]}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-3 mt-auto" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
        {DAY_ACTIONS.map(({ href, label, Icon, primary }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-center gap-2 h-11 rounded-[14px] font-semibold text-[12px] transition-all duration-150 active:scale-[0.96]"
            style={primary
              ? { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 3px 10px color-mix(in srgb, var(--accent) 22%, transparent)' }
              : { background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--text-primary)' }
            }
          >
            <Icon size={14} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
