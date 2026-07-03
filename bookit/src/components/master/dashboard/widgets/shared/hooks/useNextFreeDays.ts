'use client';

import { useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';
import { toISODate } from '@/lib/utils/dates';

const DOW_UA: Record<number, string> = { 1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб' };
const DOW_FULL: Record<number, string> = { 1: 'Понеділок', 2: 'Вівторок', 3: 'Середа', 4: 'Четвер', 5: 'Пʼятниця', 6: 'Субота' };

export interface FreeDay {
  iso: string;
  dayLabel: string;
  dayFull: string;
  dateLabel: string;
}

export interface NextFreeDaysData {
  /** Найближчі вільні дні для показу (кеп 5) — [0] герой, решта рейл. */
  freeDays: FreeDay[];
  /** Усього вільних робочих днів у вікні (без кепу) — 0 = все зайнято (win). */
  freeCount: number;
  /** Усього робочих днів у вікні (не-неділя) — денумератор openness. */
  workingDays: number;
  isLoading: boolean;
}

export function useNextFreeDays(): NextFreeDaysData {
  const now  = getNow();
  const from = toISODate(addDays(now, 1));
  const to   = toISODate(addDays(now, 14));
  const { bookings, isLoading } = useBookings(from, to);

  const { freeDays, freeCount, workingDays } = useMemo(() => {
    const booked = new Set<string>();
    (bookings ?? []).forEach(b => { if (b.status !== 'cancelled') booked.add(b.date); });
    const result: FreeDay[] = [];
    let freeCount = 0;
    let workingDays = 0;
    for (let i = 1; i <= 14; i++) {
      const d   = addDays(now, i);
      const dow = d.getDay();
      if (dow === 0) continue; // неділя — неробочий день
      workingDays++;
      const iso = toISODate(d);
      if (!booked.has(iso)) {
        freeCount++;
        if (result.length < 5) {
          result.push({
            iso,
            dayLabel: DOW_UA[dow] ?? '',
            dayFull: DOW_FULL[dow] ?? '',
            dateLabel: format(d, 'd MMM', { locale: uk }),
          });
        }
      }
    }
    return { freeDays: result, freeCount, workingDays };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  return { freeDays, freeCount, workingDays, isLoading };
}
