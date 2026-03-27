'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import type { BookingWithServices } from './useBookings';
import type { BookingStatus } from '@/types/database';
import { rescheduleBooking } from '@/app/(master)/dashboard/bookings/actions';

export interface BookingProduct {
  name: string;
  price: number;
  quantity: number;
}

export interface ClientLtv {
  total_visits: number;
  total_spent: number;
  average_check: number;
}

export interface BookingWithServicesAndProducts extends BookingWithServices {
  client_id: string | null;
  products: BookingProduct[];
}

interface BookingServiceRow {
  service_name: string;
  service_price: number;
  duration_minutes: number;
}

interface BookingProductRow {
  product_name: string;
  product_price: number;
  quantity: number | null;
}

interface BookingRow {
  id: string;
  client_id: string | null;
  client_name: string;
  client_phone: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: BookingStatus;
  total_price: number;
  notes: string | null;
  master_notes: string | null;
  source: string | null;
  booking_services: BookingServiceRow[] | null;
  booking_products: BookingProductRow[] | null;
}

function rowToBooking(row: BookingRow): BookingWithServicesAndProducts {
  return {
    id: row.id,
    client_id: row.client_id ?? null,
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
    services: (row.booking_services ?? []).map((s) => ({
      name: s.service_name,
      price: Number(s.service_price),
      duration: s.duration_minutes,
    })),
    products: (row.booking_products ?? []).map((p) => ({
      name: p.product_name,
      price: Number(p.product_price),
      quantity: p.quantity ?? 1,
    })),
  };
}

export function useBookingById(id: string | null) {
  const qc = useQueryClient();
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const key = ['booking', id] as const;

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('*, booking_services(service_name, service_price, duration_minutes), booking_products(product_name, product_price, quantity)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return rowToBooking(data);
    },
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

  const booking = query.data ?? null;

  const ltvQuery = useQuery({
    queryKey: ['client-ltv', id, booking?.client_id, masterId],
    queryFn: async () => {
      if (!booking?.client_id || !masterId) return null;
      const supabase = createClient();
      const { data } = await supabase
        .from('client_master_relations')
        .select('total_visits, total_spent, average_check')
        .eq('client_id', booking.client_id)
        .eq('master_id', masterId)
        .maybeSingle();
      return (data as ClientLtv | null) ?? null;
    },
    enabled: !!booking?.client_id && !!masterId,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: BookingStatus) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .update({ status, status_changed_at: new Date().toISOString() })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['bookings', masterId] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['weekly-overview'] });
      qc.invalidateQueries({ queryKey: ['monthly-booking-count'] });
    },
  });

  const saveMasterNotes = useMutation({
    mutationFn: async (master_notes: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .update({ master_notes })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['bookings', masterId] });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ date, startTime, endTime }: { date: string; startTime: string; endTime: string }) => {
      const result = await rescheduleBooking(id!, date, startTime, endTime);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['bookings', masterId] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  return {
    booking,
    isLoading: query.isLoading,
    clientLtv: ltvQuery.data ?? null,
    updateStatus: (status: BookingStatus) => updateStatus.mutate(status),
    isUpdatingStatus: updateStatus.isPending,
    saveMasterNotes: (notes: string) => saveMasterNotes.mutate(notes),
    isSavingNotes: saveMasterNotes.isPending,
    reschedule: (params: { date: string; startTime: string; endTime: string }) => rescheduleMutation.mutate(params),
    isRescheduling: rescheduleMutation.isPending,
    rescheduleError: rescheduleMutation.error?.message ?? null,
  };
}
