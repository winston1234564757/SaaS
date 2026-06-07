'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';
import { toISODate } from '@/lib/utils/dates';

export interface TopServiceItem {
  name: string;
  count: number;
}

export interface TopServicesData {
  top: TopServiceItem[];
  maxCount: number;
  monthLabel: string;
  isLoading: boolean;
}

export function useTopServices(): TopServicesData {
  const now = getNow();
  const from = toISODate(startOfMonth(now));
  const to   = toISODate(endOfMonth(now));
  const { bookings, isLoading } = useBookings(from, to);
  const monthLabel = format(now, 'LLLL', { locale: uk });

  const top = useMemo(() => {
    if (!bookings) return [];
    const map = new Map<string, { count: number }>();
    bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const name = b.services[0]?.name;
      if (!name) return;
      const prev = map.get(name) ?? { count: 0 };
      map.set(name, { count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [bookings]);

  const maxCount = top[0]?.count ?? 1;
  return { top, maxCount, monthLabel, isLoading };
}
