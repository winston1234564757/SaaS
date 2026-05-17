'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
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
    <div className="bento-card px-5 py-4">
      <p
        className="text-[9px] font-bold uppercase tracking-[0.22em] mb-3"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Вільні дні
      </p>

      {isLoading ? (
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton-shimmer rounded-full" style={{ height: 42, width: 54 }} />
          ))}
        </div>
      ) : (
        <div className="flex gap-1.5 flex-wrap">
          {freeDays.map(({ iso, dayLabel, dateLabel }, i) => (
            <motion.span
              key={iso}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 28, delay: i * 0.06 }}
              className="inline-flex flex-col items-center px-3 py-1.5 rounded-full"
              style={{
                background: 'var(--background-deep)',
                border: '0.5px solid var(--border-strong)',
              }}
            >
              <span
                className="text-[9px] font-bold uppercase tracking-[0.08em]"
                style={{ color: 'var(--accent)' }}
              >
                {dayLabel}
              </span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {dateLabel}
              </span>
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}
