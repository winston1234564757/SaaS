'use client';

import { useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';
import { toISODate } from '@/lib/utils/dates';

const DOW_UA: Record<number, string> = { 1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб' };

export interface FreeDay {
  iso: string;
  dayLabel: string;
  dateLabel: string;
}

export interface NextFreeDaysData {
  freeDays: FreeDay[];
  isLoading: boolean;
}

export function useNextFreeDays(): NextFreeDaysData {
  const now  = getNow();
  const from = toISODate(addDays(now, 1));
  const to   = toISODate(addDays(now, 14));
  const { bookings, isLoading } = useBookings(from, to);

  const freeDays = useMemo(() => {
    const booked = new Set<string>();
    (bookings ?? []).forEach(b => { if (b.status !== 'cancelled') booked.add(b.date); });
    const result: FreeDay[] = [];
    for (let i = 1; i <= 14 && result.length < 5; i++) {
      const d   = addDays(now, i);
      const dow = d.getDay();
      if (dow === 0) continue;
      const iso = toISODate(d);
      if (!booked.has(iso)) {
        result.push({ iso, dayLabel: DOW_UA[dow] ?? '', dateLabel: format(d, 'd MMM', { locale: uk }) });
      }
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  return { freeDays, isLoading };
}
