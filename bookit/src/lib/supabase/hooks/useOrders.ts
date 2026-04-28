'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import type { Order, OrderItem, OrderStatus, Product } from '@/types/database';
import { updateOrderStatus } from '@/app/(master)/dashboard/products/actions';

export type OrderWithItems = Order & {
  items: (OrderItem & { product: Pick<Product, 'id' | 'name' | 'photos' | 'category'> | null })[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Unified sale — covers both ShopPage orders and booking-attached products
// ─────────────────────────────────────────────────────────────────────────────

export type SaleSource = 'shop' | 'booking';

export interface UnifiedSaleItem {
  id:            string;
  product_id:    string;
  product_name:  string;
  qty:           number;
  price_kopecks: number; // per unit
}

export interface UnifiedSale {
  id:           string;        // order.id or booking.id
  source:       SaleSource;
  master_id:    string;
  client_id:    string | null;
  client_name:  string | null;
  client_phone: string | null;
  status:       OrderStatus;   // mapped from booking status
  total_kopecks: number;
  delivery_type?:    'pickup' | 'nova_poshta' | null;
  delivery_address?: string | null;
  note?:             string | null;
  pickup_at?:        string | null;
  created_at:   string;
  items:        UnifiedSaleItem[];
}

// Map booking status → OrderStatus for unified display
function mapBookingStatus(s: string): OrderStatus {
  if (s === 'completed') return 'completed';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'confirmed') return 'confirmed';
  return 'new'; // pending / any other → new
}

// ─────────────────────────────────────────────────────────────────────────────
// Master unified sales hook (shop orders + booking products)
// ─────────────────────────────────────────────────────────────────────────────

export function useOrders(statusFilter?: OrderStatus) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const key = ['unified-sales', masterId, statusFilter] as const;

  const query = useQuery<UnifiedSale[]>({
    queryKey: key,
    queryFn: async () => {
      const db = createClient();

      // ── 1. Shop orders ──────────────────────────────────────────────────────
      let shopQ = db
        .from('orders')
        .select(`
          id, master_id, client_id, client_name, client_phone,
          delivery_type, delivery_address,
          total_kopecks, status, note, pickup_at, created_at,
          items:order_items(
            id, product_id, qty, price_kopecks,
            product:products(id, name)
          )
        `)
        .eq('master_id', masterId!);

      if (statusFilter) shopQ = shopQ.eq('status', statusFilter);

      const { data: shopData, error: shopErr } = await shopQ;
      if (shopErr) throw new Error(shopErr.message);

      const shopSales: UnifiedSale[] = (shopData ?? []).map((o: any) => ({
        id:               o.id,
        source:           'shop',
        master_id:        o.master_id,
        client_id:        o.client_id,
        client_name:      o.client_name ?? null,
        client_phone:     o.client_phone ?? null,
        status:           o.status as OrderStatus,
        total_kopecks:    o.total_kopecks,
        delivery_type:    o.delivery_type,
        delivery_address: o.delivery_address,
        note:             o.note,
        pickup_at:        o.pickup_at,
        created_at:       o.created_at,
        items: (o.items ?? []).map((i: any) => ({
          id:            i.id,
          product_id:    i.product_id,
          product_name:  i.product?.name ?? 'Товар',
          qty:           i.qty,
          price_kopecks: i.price_kopecks,
        })),
      }));

      // ── 2. Booking-attached products ────────────────────────────────────────
      // Fetch bookings that have at least one booking_product
      const { data: bpData, error: bpErr } = await db
        .from('bookings')
        .select(`
          id, master_id, client_id, client_name, client_phone,
          status, created_at,
          booking_products!inner(
            id, product_id, product_name, product_price, quantity
          )
        `)
        .eq('master_id', masterId!);

      if (bpErr) throw new Error(bpErr.message);

      const bookingSales: UnifiedSale[] = (bpData ?? [])
        .filter((b: any) => (b.booking_products ?? []).length > 0)
        .map((b: any) => {
          const bpItems: UnifiedSaleItem[] = (b.booking_products ?? []).map((bp: any) => ({
            id:            bp.id,
            product_id:    bp.product_id,
            product_name:  bp.product_name,
            qty:           bp.quantity,
            price_kopecks: bp.product_price * 100, // product_price is UAH, convert to kopecks
          }));

          const total_kopecks = bpItems.reduce((s, i) => s + i.price_kopecks * i.qty, 0);
          const mappedStatus  = mapBookingStatus(b.status);

          // Apply status filter
          if (statusFilter && mappedStatus !== statusFilter) return null;

          return {
            id:               b.id,
            source:           'booking' as SaleSource,
            master_id:        b.master_id,
            client_id:        b.client_id,
            client_name:      b.client_name ?? null,
            client_phone:     b.client_phone ?? null,
            status:           mappedStatus,
            total_kopecks,
            delivery_type:    'pickup',
            delivery_address: null,
            note:             null,
            created_at:       b.created_at,
            items:            bpItems,
          } satisfies UnifiedSale;
        })
        .filter(Boolean) as UnifiedSale[];

      // ── 3. Merge + sort by date desc ────────────────────────────────────────
      const all = [...shopSales, ...bookingSales].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      return all;
    },
    enabled: !!masterId,
    staleTime: 20_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ saleId, status, source }: { saleId: string; status: OrderStatus; source: SaleSource }) => {
      // Only shop orders support status change — booking status is managed in bookings tab
      if (source !== 'shop') return Promise.resolve({ error: null });
      return updateOrderStatus(saleId, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unified-sales', masterId] }),
  });

  return {
    orders:       query.data ?? [],
    isLoading:    query.isPending,
    error:        query.error,
    updateStatus: (saleId: string, status: OrderStatus, source: SaleSource = 'shop') =>
                    statusMutation.mutate({ saleId, status, source }),
    isUpdating:   statusMutation.isPending,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Client orders hook (for /my/ area) — unchanged
// ─────────────────────────────────────────────────────────────────────────────

export function useMyOrders() {
  return useQuery<OrderWithItems[]>({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) return [];

      const { data, error } = await createClient()
        .from('orders')
        .select(`
          id, master_id, client_id, booking_id,
          delivery_type, delivery_address,
          total_kopecks, status, note, created_at,
          items:order_items(
            id, order_id, product_id, qty, price_kopecks,
            product:products(id, name, photos, category)
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as OrderWithItems[];
    },
    staleTime: 30_000,
  });
}
