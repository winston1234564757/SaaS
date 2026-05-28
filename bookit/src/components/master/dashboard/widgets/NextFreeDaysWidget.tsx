'use client';

import { useMemo } from 'react';
import { format, addDays } from 'date-fns';
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
  }, [bookings]);

  if (!isLoading && freeDays.length === 0) return null;

  return (
    <div>
      <p className="widget-heading mb-3">
        Вільні дні
      </p>

      {isLoading ? (
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="skeleton-shimmer h-[50px] w-[58px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {freeDays.map(({ iso, dayLabel, dateLabel }) => (
            <span
              key={iso}
              className="flex flex-col items-center px-3.5 py-2 rounded-xl gap-[3px]"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-strong)',
              }}
            >
              <span
                className="text-[10px] font-bold tracking-[0.12em] uppercase"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {dayLabel}
              </span>
              <span
                className="metric-value text-[14px] font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {dateLabel}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
