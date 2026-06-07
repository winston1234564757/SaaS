'use client';

import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getWeekRange } from '@/lib/utils/dates';

function calcRate(bookings: { status: string }[]): number | null {
  const valid = bookings.filter(b =>
    ['confirmed', 'pending', 'completed', 'cancelled'].includes(b.status),
  );
  if (!valid.length) return null;
  return Math.round((valid.filter(b => b.status === 'cancelled').length / valid.length) * 100);
}

export interface CancellationRateData {
  thisRate: number | null;
  lastRate: number | null;
  delta: number | null;
  improved: boolean | null;
  isLoading: boolean;
}

export function useCancellationRate(): CancellationRateData {
  const thisWeek = getWeekRange(0);
  const lastWeek = getWeekRange(-1);
  const { bookings: thisBk, isLoading: l1 } = useBookings(thisWeek.from, thisWeek.to);
  const { bookings: lastBk, isLoading: l2 } = useBookings(lastWeek.from, lastWeek.to);
  const thisRate = thisBk ? calcRate(thisBk) : null;
  const lastRate = lastBk ? calcRate(lastBk) : null;
  const delta    = thisRate !== null && lastRate !== null ? thisRate - lastRate : null;
  const improved = delta !== null ? delta < 0 : null;
  return { thisRate, lastRate, delta, improved, isLoading: l1 || l2 };
}
