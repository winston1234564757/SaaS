'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyMasterNewBooking } from '@/lib/notifications';
import { normalizeToE164 } from '@/lib/utils/phone';

/**
 * Links a booking to the currently authenticated client.
 * Uses service role to bypass RLS (no client UPDATE policy on bookings).
 */
export async function linkBookingToClient(bookingId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();

  // Ensure client_profiles row exists
  await admin
    .from('client_profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  // Link booking to client
  await admin
    .from('bookings')
    .update({ client_id: user.id })
    .eq('id', bookingId)
    .is('client_id', null); // only link if not already linked
}

/**
 * Ensures client_profiles row exists for the current user (needed for client_id FK).
 * Returns userId if user is logged in with role=client, otherwise null.
 */
export async function ensureClientProfile(): Promise<{ userId: string | null; name: string | null; phone: string | null; email: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { userId: null, name: null, phone: null, email: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, phone')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'client') return { userId: null, name: null, phone: null, email: null };

  // Ensure client_profiles row exists (FK requirement)
  await supabase
    .from('client_profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  return {
    userId: user.id,
    name: profile.full_name ?? null,
    phone: profile.phone ?? null,
    email: user.email ?? null,
  };
}

/**
 * Creates a product-only order from the booking wizard (no auth required).
 * Validates stock, decrements atomically, creates order record with client name/phone.
 */
export async function createPublicOrder(payload: {
  masterId: string;
  clientName: string;
  clientPhone: string;
  notes?: string | null;
  items: Array<{ productId: string; qty: number }>;
}): Promise<{ id: string | null; error: string | null }> {
  if (!payload.items.length) return { id: null, error: 'Кошик порожній' };
  if (!payload.clientName.trim()) return { id: null, error: 'Вкажіть ім\'я' };

  const raw = normalizeToE164(payload.clientPhone);
  if (!raw) return { id: null, error: 'Невірний номер телефону' };
  const clientPhone = '+' + raw;

  const admin = createAdminClient();

  // Fetch products + stock check
  const { data: products, error: fetchErr } = await admin
    .from('products')
    .select('id, name, price_kopecks, stock_qty')
    .in('id', payload.items.map(i => i.productId))
    .eq('master_id', payload.masterId)
    .eq('is_active', true);

  if (fetchErr || !products) return { id: null, error: 'Помилка завантаження товарів' };

  const productMap = new Map(products.map(p => [p.id, p]));
  let total_kopecks = 0;

  for (const item of payload.items) {
    const p = productMap.get(item.productId);
    if (!p) return { id: null, error: 'Товар не знайдено' };
    if (p.stock_qty < item.qty) {
      return { id: null, error: `"${p.name}" — залишок ${p.stock_qty} шт.` };
    }
    total_kopecks += Number(p.price_kopecks) * item.qty;
  }

  // Resolve optional client_id (if logged in as client)
  let clientId: string | null = null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role === 'client') clientId = user.id;
  }

  // Create order
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      master_id:    payload.masterId,
      client_id:    clientId,
      client_name:  payload.clientName.trim(),
      client_phone: clientPhone,
      delivery_type: 'pickup' as const,
      total_kopecks,
      status:       'new',
      note:         payload.notes?.trim() ?? null,
    })
    .select('id')
    .single();

  if (orderErr || !order) return { id: null, error: orderErr?.message ?? 'Помилка створення замовлення' };

  // Insert order items
  const { error: itemsErr } = await admin.from('order_items').insert(
    payload.items.map(item => ({
      order_id:      order.id,
      product_id:    item.productId,
      qty:           item.qty,
      price_kopecks: productMap.get(item.productId)!.price_kopecks,
    }))
  );

  if (itemsErr) {
    await admin.from('orders').delete().eq('id', order.id);
    return { id: null, error: itemsErr.message };
  }

  // Atomic stock decrement
  for (const item of payload.items) {
    const p = productMap.get(item.productId)!;
    await admin
      .from('products')
      .update({ stock_qty: p.stock_qty - item.qty })
      .eq('id', item.productId)
      .gte('stock_qty', item.qty);

    await admin.from('product_transactions').insert({
      product_id: item.productId,
      type:       'sale',
      qty_delta:  -item.qty,
      order_id:   order.id,
    });
  }

  return { id: order.id, error: null };
}

export async function notifyMasterOnBooking(params: {
  masterId: string;
  bookingId?: string | null;
  clientName: string;
  date: string;
  startTime: string;
  services: string;
  totalPrice: number;
  notes?: string | null;
  products?: { name: string; quantity: number }[];
}): Promise<void> {
  await notifyMasterNewBooking(params).catch(e =>
    console.error('[notifyMasterOnBooking]', e)
  );
}
