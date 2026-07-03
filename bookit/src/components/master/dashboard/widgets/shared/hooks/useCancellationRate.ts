'use client';

import { useBookings, type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { getWeekRange } from '@/lib/utils/dates';

const VALID_STATUSES = ['confirmed', 'pending', 'completed', 'cancelled'];

function calcRate(bookings: { status: string }[]): number | null {
  const valid = bookings.filter(b => VALID_STATUSES.includes(b.status));
  if (!valid.length) return null;
  return Math.round((valid.filter(b => b.status === 'cancelled').length / valid.length) * 100);
}

function countValid(bookings: { status: string }[] | null | undefined): number {
  return (bookings ?? []).filter(b => VALID_STATUSES.includes(b.status)).length;
}

export interface CancelledEntry {
  id: string;
  clientName: string;
  service: string | null;
  /** Момент скасування (status_changed_at); null для старих записів */
  when: string | null;
  /** Дата самого запису — фолбек для when */
  bookingDate: string;
  /** Інференс ініціатора: client_requested → клієнт, інакше → майстер */
  by: 'client' | 'master';
}

function toCancelledEntry(b: BookingWithServices): CancelledEntry {
  return {
    id: b.id,
    clientName: b.client_name,
    service: b.services[0]?.name ?? null,
    when: b.status_changed_at,
    bookingDate: b.date,
    by: b.cancellation_reason === 'client_requested' ? 'client' : 'master',
  };
}

export interface CancellationRateData {
  thisRate: number | null;
  lastRate: number | null;
  delta: number | null;
  improved: boolean | null;
  /** Денумератор: valid-записи цього тижня. % — шум коли мало; поріг для домінанти. */
  thisTotal: number;
  /** Скасовані записи поточного тижня, найновіші зверху */
  cancelledList: CancelledEntry[];
  isLoading: boolean;
}

export function useCancellationRate(): CancellationRateData {
  const thisWeek = getWeekRange(0);
  const lastWeek = getWeekRange(-1);
  const { bookings: thisBk, isLoading: l1 } = useBookings(thisWeek.from, thisWeek.to);
  const { bookings: lastBk, isLoading: l2 } = useBookings(lastWeek.from, lastWeek.to);
  const thisRate  = thisBk ? calcRate(thisBk) : null;
  const lastRate  = lastBk ? calcRate(lastBk) : null;
  const thisTotal = countValid(thisBk);
  const delta     = thisRate !== null && lastRate !== null ? thisRate - lastRate : null;
  const improved  = delta !== null ? delta < 0 : null;
  const cancelledList = (thisBk ?? [])
    .filter(b => b.status === 'cancelled')
    .map(toCancelledEntry)
    .sort((a, c) => {
      const ta = a.when ? new Date(a.when).getTime() : new Date(a.bookingDate).getTime();
      const tc = c.when ? new Date(c.when).getTime() : new Date(c.bookingDate).getTime();
      return tc - ta;
    });
  return { thisRate, lastRate, delta, improved, thisTotal, cancelledList, isLoading: l1 || l2 };
}
