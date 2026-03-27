'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import type { BookingStatus } from '@/types/database';
import { safeQuery, safeMutation } from '../safeQuery';

const STARTER_LIMIT = 30;

export interface BookingWithServices {
  id: string;
  client_name: string;
  client_phone: string;
  date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_price: number;
  notes: string | null;
  master_notes: string | null;
  source: string | null;
  services: { name: string; price: number; duration: number }[];
}

interface BookingRow {
  id: string;
  client_name: string;
  client_phone: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: BookingStatus;
  total_price: number | string;
  notes: string | null;
  master_notes: string | null;
  source: string | null;
  booking_services: { service_name: string; service_price: number | string; duration_minutes: number }[] | null;
}

function rowToBooking(row: BookingRow): BookingWithServices {
  return {
    id: row.id,
    client_name: row.client_name,
    client_phone: row.client_phone,
    date: row.date,
    start_time: row.start_time?.slice(0, 5) ?? '',
    end_time: row.end_time?.slice(0, 5) ?? '',
    status: row.status,
    total_price: Number(row.total_price),
    notes: row.notes,
    master_notes: row.master_notes ?? null,
    source: row.source ?? null,
    services: (row.booking_services ?? []).map(s => ({
      name: s.service_name,
      price: Number(s.service_price),
      duration: s.duration_minutes,
    })),
  };
}

export function useBookings(dateFrom: string, dateTo: string) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const key = ['bookings', masterId, dateFrom, dateTo] as const;

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const supabase = createClient();
      const result = await safeQuery<any[]>(
        'bookings:list',
        () =>
          supabase
            .from('bookings')
            .select('*, booking_services(service_name, service_price, duration_minutes)')
            .eq('master_id', masterId!)
            .gte('date', dateFrom)
            .lte('date', dateTo)
            .order('date', { ascending: true })
            .order('start_time', { ascending: true })
      );
      if (result.error) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to load bookings'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
      return (result.data ?? []).map(rowToBooking);
    },
    enabled: !!masterId,
    placeholderData: keepPreviousData,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const supabase = createClient();
      const result = await safeMutation(
        'bookings:updateStatus',
        () =>
          supabase
            .from('bookings')
            .update({ status, status_changed_at: new Date().toISOString() })
            .eq('id', id)
            .eq('master_id', masterId!)
      );
      if (result.error) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to update booking status'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BookingWithServices[]>(key);
      qc.setQueryData<BookingWithServices[]>(key, old =>
        old?.map(b => b.id === id ? { ...b, status } : b)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['bookings', masterId] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['weekly-overview'] });
      qc.invalidateQueries({ queryKey: ['monthly-booking-count'] });
    },
  });

  return {
    bookings: query.data ?? [],
    isLoading: query.isLoading && !!masterId,
    error: query.error,
    updateStatus: (id: string, status: BookingStatus) => updateStatus.mutate({ id, status }),
  };
}

/**
 * Динамічно рахує кількість записів поточного місяця із таблиці bookings.
 * Не покладається на лічильник bookings_this_month у master_profiles,
 * який залежить від cron-скидання і може бути несинхронізованим.
 */
export function useMonthlyBookingCount() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const tier = masterProfile?.subscription_tier ?? 'starter';

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: count = 0, isLoading } = useQuery({
    queryKey: ['monthly-booking-count', masterId, monthStart],
    queryFn: async () => {
      const supabase = createClient();
      const { count: c } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('master_id', masterId!)
        .gte('created_at', monthStart)
        .neq('status', 'cancelled');
      return c ?? 0;
    },
    enabled: !!masterId,
    staleTime: 60_000,
  });

  return {
    count,
    isLoading: isLoading && !!masterId,
    isAtLimit: tier === 'starter' && count >= STARTER_LIMIT,
    remaining: tier === 'starter' ? Math.max(0, STARTER_LIMIT - count) : null,
  };
}
