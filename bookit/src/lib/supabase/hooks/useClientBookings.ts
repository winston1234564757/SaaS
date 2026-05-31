'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface RecentBooking {
  id: string;
  date: string;
  start_time: string;
  status: string;
  total_price: number;
  service_name: string;
  dynamic_pricing_label?: string | null;
}

async function fetchClientBookings(phone: string): Promise<RecentBooking[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('bookings')
    .select(`
      id,
      slot_date:date,
      slot_time:start_time,
      status,
      total_price,
      dynamic_pricing_label,
      booking_services (
        service_name
      )
    `)
    .eq('client_phone', phone)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(5);

  if (!data) return [];
  type RawRow = { id: string; slot_date: string; slot_time: string; status: string; total_price: number; dynamic_pricing_label: string | null; booking_services: { service_name: string }[] | null };
  return (data as RawRow[]).map(b => ({
    id: b.id,
    date: b.slot_date,
    start_time: (b.slot_time as string)?.slice(0, 5) ?? '',
    status: b.status,
    total_price: b.total_price,
    dynamic_pricing_label: b.dynamic_pricing_label,
    service_name: b.booking_services?.[0]?.service_name ?? 'Послуга',
  }));
}

export function useClientBookings(phone: string | null | undefined) {
  return useQuery({
    queryKey: ['client-bookings', phone],
    queryFn: () => fetchClientBookings(phone!),
    enabled: !!phone,
    staleTime: 60_000,
  });
}
