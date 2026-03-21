'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import type { BookingWithServices } from './useBookings';
import type { BookingStatus } from '@/types/database';

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

export function useBookingById(id: string | null) {
  const qc = useQueryClient();
  const key = ['booking', id] as const;

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const supabase = createClient();
      await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('bookings')
        .select('*, booking_services(service_name, service_price, duration_minutes)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return rowToBooking(data);
    },
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: BookingStatus) => {
      const supabase = createClient();
      await supabase.auth.getSession();
      const { error } = await supabase
        .from('bookings')
        .update({ status, status_changed_at: new Date().toISOString() })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['weekly-overview'] });
      qc.invalidateQueries({ queryKey: ['monthly-booking-count'] });
    },
  });

  const saveMasterNotes = useMutation({
    mutationFn: async (master_notes: string) => {
      const supabase = createClient();
      await supabase.auth.getSession();
      const { error } = await supabase
        .from('bookings')
        .update({ master_notes })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      // Also refresh the list so notes column stays in sync
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  return {
    booking: query.data ?? null,
    isLoading: query.isLoading,
    updateStatus: (status: BookingStatus) => updateStatus.mutate(status),
    saveMasterNotes: (notes: string) => saveMasterNotes.mutate(notes),
    isSavingNotes: saveMasterNotes.isPending,
  };
}
