'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';

export interface ConsumableForBooking {
  product_id:   string;
  name:         string;
  unit:         'pcs' | 'ml' | 'g';
  total_qty:    number;
  cost_kopecks: number | null;
}

export function useConsumablesForBooking(bookingId: string | null) {
  return useQuery<ConsumableForBooking[]>({
    queryKey: ['consumables-for-booking', bookingId],
    queryFn: async (): Promise<ConsumableForBooking[]> => {
      const supabase = createClient();

      const { data: bookingServices, error: bsErr } = await supabase
        .from('booking_services')
        .select('service_id')
        .eq('booking_id', bookingId!);

      if (bsErr) throw bsErr;
      const serviceIds = (bookingServices ?? [])
        .map((r: { service_id: string | null }) => r.service_id)
        .filter(Boolean) as string[];

      if (serviceIds.length === 0) return [];

      const { data: links, error: lErr } = await supabase
        .from('product_service_links')
        .select('quantity, products!inner(id, name, unit, cost_kopecks, product_type, is_archived)')
        .in('service_id', serviceIds)
        .eq('products.product_type', 'consumable')
        .eq('products.is_archived', false);

      if (lErr) throw lErr;

      const map = new Map<string, ConsumableForBooking>();
      for (const link of links ?? []) {
        const product = link.products as unknown as {
          id: string; name: string; unit: 'pcs' | 'ml' | 'g'; cost_kopecks: number | null;
        };
        const existing = map.get(product.id);
        if (existing) {
          existing.total_qty += Number(link.quantity);
        } else {
          map.set(product.id, {
            product_id:   product.id,
            name:         product.name,
            unit:         product.unit,
            total_qty:    Number(link.quantity),
            cost_kopecks: product.cost_kopecks,
          });
        }
      }

      return Array.from(map.values());
    },
    enabled: !!bookingId,
    staleTime: 60_000,
  });
}
