import { createClient } from '@/lib/supabase/server';
import { MyBookingsPage } from '@/components/client/MyBookingsPage';
import { ClientRealtimeSync } from '@/components/client/ClientRealtimeSync';

export const metadata = { title: 'Мої записи' };

export default async function MyBookings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, date, start_time, end_time, status, total_price, notes, master_id,
      master_profiles (
        slug, avatar_emoji, business_name, address, city, latitude, longitude,
        profiles ( full_name )
      ),
      booking_services ( service_id, service_name, service_price, duration_minutes ),
      booking_products ( product_id, product_name, product_price, quantity ),
      reviews ( id )
    `)
    .eq('client_id', user!.id)
    .order('date', { ascending: false });

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, created_at, status, total_kopecks, delivery_type, pickup_at,
      master_profiles (
        slug, avatar_emoji, business_name, address, city, latitude, longitude,
        profiles ( full_name )
      ),
      order_items (
        product_id, qty,
        products ( name, price_kopecks )
      ),
      reviews ( id )
    `)
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false });

  const bookingItems = (bookings ?? []).map((b: any) => ({
    id: b.id,
    type: 'booking' as const,
    date: b.date,
    startTime: b.start_time?.slice(0, 5) || '',
    endTime: b.end_time?.slice(0, 5) || '',
    status: b.status,
    totalPrice: Number(b.total_price),
    notes: b.notes,
    masterId: b.master_id,
    masterName: b.master_profiles?.business_name || b.master_profiles?.profiles?.full_name || 'Майстер',
    masterSlug: b.master_profiles?.slug || '',
    masterEmoji: b.master_profiles?.avatar_emoji || '💅',
    masterAddress: b.master_profiles?.address,
    masterCity: b.master_profiles?.city,
    masterLat: b.master_profiles?.latitude,
    masterLng: b.master_profiles?.longitude,
    hasReview: (b.reviews?.length ?? 0) > 0,
    services: (b.booking_services ?? []).map((s: any) => ({
      id: s.service_id,
      name: s.service_name,
      price: Number(s.service_price),
      duration: s.duration_minutes,
    })),
    products: (b.booking_products ?? []).map((p: any) => ({
      id: p.product_id,
      name: p.product_name,
      price: Number(p.product_price),
      qty: p.quantity,
    })),
  }));

  const shopItems = (orders ?? []).map((o: any) => ({
    id: o.id,
    type: 'shop' as const,
    date: o.created_at.split('T')[0],
    pickupAt: o.pickup_at,
    status: o.status,
    totalPrice: Number(o.total_kopecks) / 100,
    deliveryType: o.delivery_type,
    masterId: o.master_id,
    masterName: o.master_profiles?.business_name || o.master_profiles?.profiles?.full_name || 'Майстер',
    masterSlug: o.master_profiles?.slug || '',
    masterEmoji: o.master_profiles?.avatar_emoji || '🛍',
    masterAddress: o.master_profiles?.address,
    masterCity: o.master_profiles?.city,
    masterLat: o.master_profiles?.latitude,
    masterLng: o.master_profiles?.longitude,
    hasReview: (o.reviews?.length ?? 0) > 0,
    products: (o.order_items ?? []).map((item: any) => ({
      id: item.product_id,
      name: item.products?.name || 'Товар',
      price: (item.products?.price_kopecks || 0) / 100,
      qty: item.qty,
    })),
  }));

  const allItems = [...bookingItems, ...shopItems].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <ClientRealtimeSync userId={user!.id} />
      <MyBookingsPage bookings={allItems as any} />
    </>
  );
}
