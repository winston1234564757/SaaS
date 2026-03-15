'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import type { BookingStatus } from '@/types/database';
import { safeQuery, safeMutation } from '../safeQuery';

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

function rowToBooking(row: any): BookingWithServices {
  return {
    id: row.id,
    client_name: row.client_name,
    client_phone: row.client_phone,
    date: row.date,
    start_time: (row.start_time as string | null)?.slice(0, 5) ?? '',
    end_time: (row.end_time as string | null)?.slice(0, 5) ?? '',
    status: row.status,
    total_price: Number(row.total_price),
    notes: row.notes,
    master_notes: row.master_notes ?? null,
    source: row.source ?? null,
    services: (row.booking_services ?? []).map((s: any) => ({
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
  const supabase = createClient();
  const key = ['bookings', masterId, dateFrom, dateTo] as const;

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const result = await safeQuery(
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
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const result = await safeMutation(
        'bookings:updateStatus',
        () =>
          supabase
            .from('bookings')
            .update({ status, status_changed_at: new Date().toISOString() })
            .eq('id', id)
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
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    bookings: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    updateStatus: (id: string, status: BookingStatus) => updateStatus.mutate({ id, status }),
  };
}
