'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyMasterNewBooking } from '@/lib/notifications';
import { normalizeToE164 } from '@/lib/utils/phone';

const LINK_RATE_LIMIT = 5;
const LINK_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Links a booking to the currently authenticated client.
 * Validates phone match to prevent horizontal privilege escalation (P0.1 MTRP).
 */
export async function linkBookingToClient(bookingId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  // Rate limit: 5 attempts per 15 minutes per user
  const windowStart = new Date(Date.now() - LINK_RATE_WINDOW_MS).toISOString();
  const { count } = await admin
    .from('link_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', windowStart);

  if ((count ?? 0) >= LINK_RATE_LIMIT) {
    await admin.from('link_attempts').insert({ booking_id: bookingId, user_id: user.id, result: 'rate_limited' });
    throw new Error('RATE_LIMITED');
  }

  // Fetch booking — must exist and be unlinked (or linked to self)
  const { data: booking, error } = await admin
    .from('bookings')
    .select('id, client_id, client_phone')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    await admin.from('link_attempts').insert({ booking_id: bookingId, user_id: user.id, result: 'not_found' });
    throw new Error('Booking not found');
  }

  if (booking.client_id && booking.client_id !== user.id) {
    await admin.from('link_attempts').insert({ booking_id: bookingId, user_id: user.id, result: 'already_linked' });
    throw new Error('BOOKING_ALREADY_LINKED');
  }

  if (booking.client_id === user.id) return; // already linked to self — no-op

  // Verify user's phone matches booking's client_phone (last 10 digits)
  const { data: profile } = await admin
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .single();

  const bookingPhone = booking.client_phone?.slice(-10) ?? '';
  const userPhone = profile?.phone?.slice(-10) ?? '';

  if (!bookingPhone || !userPhone || bookingPhone !== userPhone) {
    await admin.from('link_attempts').insert({ booking_id: bookingId, user_id: user.id, result: 'phone_mismatch' });
    throw new Error('PHONE_MISMATCH_REQUIRES_OTP');
  }

  // Ensure client_profiles row exists (FK requirement)
  await admin
    .from('client_profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  // Link booking to client
  await admin
    .from('bookings')
    .update({ client_id: user.id })
    .eq('id', bookingId)
    .is('client_id', null);

  await admin.from('link_attempts').insert({ booking_id: bookingId, user_id: user.id, result: 'success' });
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
  // Guard against negative / zero / fractional quantities: a negative qty would pass the
  // `stock_qty < qty` check, produce a negative total, and INFLATE stock on decrement.
  for (const item of payload.items) {
    if (!Number.isInteger(item.qty) || item.qty < 1) {
      return { id: null, error: 'Невірна кількість товару' };
    }
  }
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

  // Atomic stock decrement — reserve each unit via decrement_product_stock_atomic
  // (relative UPDATE, safe under concurrency; returns FALSE when stock was exhausted
  // between the check above and now). The old `.update().gte()` never checked the
  // affected-row count, so two concurrent last-unit orders both wrote a `sale` ledger
  // row while only one decrement landed → oversell + ledger drift. On mid-flight
  // exhaustion we roll back the units already reserved AND the order.
  const reserved: Array<{ id: string; qty: number }> = [];
  for (const item of payload.items) {
    const { data: ok, error: decErr } = await admin.rpc('decrement_product_stock_atomic', {
      p_product_id: item.productId,
      p_qty:        item.qty,
    });
    if (decErr || ok === false) {
      for (const r of reserved) {
        await admin.rpc('increment_stock', { p_product_id: r.id, p_qty: r.qty });
      }
      await admin.from('orders').delete().eq('id', order.id);
      const pn = productMap.get(item.productId)?.name ?? 'товар';
      return { id: null, error: `"${pn}" щойно закінчився. Спробуйте ще раз.` };
    }
    reserved.push({ id: item.productId, qty: item.qty });

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
