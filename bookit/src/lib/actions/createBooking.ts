'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyDynamicPricing, type PricingRules } from '@/lib/utils/dynamicPricing';
import { computeEndTime } from '@/lib/utils/bookingEngine';
import { revalidatePath } from 'next/cache';

// ── Payload schema ────────────────────────────────────────────────────────────

const serviceLineSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().nonnegative(),   // client hint only — server re-fetches canonical price
  duration: z.number().positive().int(),
});

const productLineSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().nonnegative(),   // client hint only — server re-fetches canonical price
  quantity: z.number().positive().int().max(99),
});

const schema = z.object({
  masterId:      z.string().uuid(),
  clientName:    z.string().min(2,  'Введіть ім\'я (мінімум 2 символи)'),
  clientPhone:   z.string().min(9,  'Введіть номер телефону'),
  clientEmail:   z.string().email().optional().nullable(),
  clientId:      z.string().uuid().optional().nullable(),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Невірний формат дати'),
  startTime:     z.string().regex(/^\d{2}:\d{2}$/, 'Невірний формат часу'),
  services:      z.array(serviceLineSchema).min(1, 'Оберіть хоча б одну послугу'),
  products:      z.array(productLineSchema).default([]),
  notes:         z.string().max(1000).optional().nullable(),
  source:        z.enum(['online', 'manual']),
  // Master-applied discount (0 = none). For 'online' source the server ignores
  // this and uses loyalty percent passed from the client only after re-verification.
  discountPercent: z.number().min(0).max(100).default(0),
  // Optional master override for the booking duration (manual source only).
  // When provided, overrides the sum of service durations for end_time calculation.
  durationOverrideMinutes: z.number().positive().int().max(480).optional().nullable(),
  // Flash deal ID — server verifies it's active, applies discount, marks as claimed.
  flashDealId: z.string().uuid().optional().nullable(),
});

export type CreateBookingPayload = z.input<typeof schema>;

export interface CreateBookingResult {
  bookingId: string | null;
  error: string | null;
  /** Server-recomputed final total — use this for display, not the client guess */
  finalTotal?: number;
  /** True when the master's Starter booking limit (30/month) is exceeded */
  upgradeRequired?: boolean;
}

// ── Unified server action ─────────────────────────────────────────────────────

/**
 * Single entry point for booking creation used by both the public BookingFlow
 * (source='online') and the master's ManualBookingForm (source='manual').
 *
 * Security guarantees:
 * - Service and product prices are fetched from DB — client-supplied prices
 *   are validated against the canonical DB values and never used directly.
 * - Stock availability is verified before insertion and decremented atomically.
 * - Booking-per-month limit (Starter: 30) is enforced server-side.
 * - Manual bookings require the caller to be the master themselves.
 */
export async function createBooking(
  payload: CreateBookingPayload,
): Promise<CreateBookingResult> {
  // 1. Parse & validate shape
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { bookingId: null, error: parsed.error.issues[0]?.message ?? 'Невірні дані' };
  }
  const p = parsed.data;

  const supabase = await createClient();
  const admin = createAdminClient();

  // 2. Auth gate — manual bookings must come from the master themselves
  if (p.source === 'manual') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== p.masterId) {
      return { bookingId: null, error: 'Не авторизований' };
    }
  }

  // 3. Master profile — pricing rules + subscription tier
  const { data: mp } = await admin
    .from('master_profiles')
    .select('subscription_tier, pricing_rules')
    .eq('id', p.masterId)
    .single();

  if (!mp) return { bookingId: null, error: 'Майстра не знайдено' };

  // 4. Starter booking limit (30/month)
  if (mp.subscription_tier === 'starter') {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', p.masterId)
      .gte('created_at', monthStart)
      .neq('status', 'cancelled');
    if ((count ?? 0) >= 30) {
      return {
        bookingId: null,
        error: 'Досягнуто ліміт 30 записів на місяць. Перейдіть на Pro.',
        upgradeRequired: true,
      };
    }
  }

  // 5. Verify services — fetch canonical prices/durations from DB
  const { data: dbServices } = await admin
    .from('services')
    .select('id, name, price, duration_minutes, is_active')
    .in('id', p.services.map(s => s.id))
    .eq('master_id', p.masterId);

  if (!dbServices || dbServices.length !== p.services.length) {
    return { bookingId: null, error: 'Одну або більше послуг не знайдено' };
  }
  const inactiveSvc = dbServices.find(s => !s.is_active);
  if (inactiveSvc) {
    return { bookingId: null, error: `Послуга «${inactiveSvc.name}» більше не активна` };
  }
  // Preserve client ordering, use DB prices
  const canonicalServices = p.services.map(s => {
    const db = dbServices.find(d => d.id === s.id)!;
    return { id: db.id, name: db.name, price: Number(db.price), duration: db.duration_minutes };
  });

  // 6. Verify products — canonical prices + stock availability
  type CanonicalProduct = {
    id: string; name: string; price: number; quantity: number;
    stockQty: number; stockUnlimited: boolean;
  };
  const canonicalProducts: CanonicalProduct[] = [];

  if (p.products.length > 0) {
    const { data: dbProducts } = await admin
      .from('products')
      .select('id, name, price, stock_quantity, stock_unlimited, is_active')
      .in('id', p.products.map(prod => prod.id))
      .eq('master_id', p.masterId);

    if (!dbProducts || dbProducts.length !== p.products.length) {
      return { bookingId: null, error: 'Один або більше товарів не знайдено' };
    }
    const inactiveProd = dbProducts.find(prod => !prod.is_active);
    if (inactiveProd) {
      return { bookingId: null, error: `Товар «${inactiveProd.name}» більше не активний` };
    }
    for (const item of p.products) {
      const db = dbProducts.find(d => d.id === item.id)!;
      if (!db.stock_unlimited && db.stock_quantity < item.quantity) {
        return {
          bookingId: null,
          error: `Недостатньо товару «${db.name}»: в наявності ${db.stock_quantity} шт.`,
        };
      }
      canonicalProducts.push({
        id: db.id,
        name: db.name,
        price: Number(db.price),
        quantity: item.quantity,
        stockQty: db.stock_quantity,
        stockUnlimited: db.stock_unlimited,
      });
    }
  }

  // 7. Server-side totals — never trust client-computed numbers
  const totalServicesPrice = canonicalServices.reduce((sum, s) => sum + s.price, 0);
  const totalProductsPrice = canonicalProducts.reduce((sum, cp) => sum + cp.price * cp.quantity, 0);
  const totalDuration = canonicalServices.reduce((sum, s) => sum + s.duration, 0);

  const bookingDate = new Date(p.date + 'T00:00:00');
  const pricingRules = mp.pricing_rules as PricingRules | null;
  const dynamicResult =
    pricingRules && Object.keys(pricingRules).length > 0
      ? applyDynamicPricing(totalServicesPrice, pricingRules, bookingDate, p.startTime)
      : null;

  const adjustedServicesPrice = dynamicResult?.adjustedPrice ?? totalServicesPrice;
  const grandTotal = adjustedServicesPrice + totalProductsPrice;
  const discountAmount = p.discountPercent > 0
    ? Math.round(grandTotal * p.discountPercent / 100)
    : 0;

  // Flash deal — server verifies and applies discount
  let flashDealDiscountPct = 0;
  if (p.flashDealId) {
    const { data: deal } = await admin
      .from('flash_deals')
      .select('discount_pct, status, master_id')
      .eq('id', p.flashDealId)
      .single();
    if (deal && deal.status === 'active' && deal.master_id === p.masterId) {
      flashDealDiscountPct = deal.discount_pct as number;
    }
  }
  const flashDealAmount = flashDealDiscountPct > 0
    ? Math.round(grandTotal * flashDealDiscountPct / 100)
    : 0;

  const finalTotal = Math.max(0, grandTotal - discountAmount - flashDealAmount);
  const effectiveDuration = p.durationOverrideMinutes ?? totalDuration;
  const endTime = computeEndTime(p.startTime, effectiveDuration);

  // 8. Insert booking
  const bookingId = crypto.randomUUID();
  const { error: bErr } = await admin.from('bookings').insert({
    id: bookingId,
    master_id: p.masterId,
    client_id: p.clientId ?? null,
    client_name: p.clientName.trim(),
    client_phone: p.clientPhone.trim(),
    client_email: p.clientEmail ?? null,
    date: p.date,
    start_time: p.startTime,
    end_time: endTime,
    status: p.source === 'manual' ? 'confirmed' : 'pending',
    total_services_price: totalServicesPrice,
    total_products_price: totalProductsPrice,
    total_price: finalTotal,
    notes: p.notes?.trim() ?? null,
    source: p.source === 'manual' ? 'manual' : 'public_page',
  });

  if (bErr) {
    console.error('[createBooking] bookings insert [ERROR CODE]:', bErr.code, ' [MESSAGE]:', bErr.message);
    return { bookingId: null, error: `Помилка БД: ${bErr.message} (Код: ${bErr.code})` };
  }

  // 9. Insert booking_services
  const { error: sErr } = await admin.from('booking_services').insert(
    canonicalServices.map(s => ({
      booking_id: bookingId,
      service_id: s.id,
      service_name: s.name,
      service_price: s.price,
      duration_minutes: s.duration,
    }))
  );
  if (sErr) {
    console.error('[createBooking] booking_services insert:', sErr.message);
    await admin.from('bookings').delete().eq('id', bookingId);
    return { bookingId: null, error: 'Помилка збереження послуг.' };
  }

  // 10. Insert booking_products + deduct stock
  if (canonicalProducts.length > 0) {
    const { error: pErr } = await admin.from('booking_products').insert(
      canonicalProducts.map(cp => ({
        booking_id: bookingId,
        product_id: cp.id,
        product_name: cp.name,
        product_price: cp.price,
        quantity: cp.quantity,
      }))
    );
    if (pErr) {
      console.error('[createBooking] booking_products insert:', pErr.message);
      await admin.from('bookings').delete().eq('id', bookingId);
      return { bookingId: null, error: 'Помилка збереження товарів.' };
    }

    // Deduct stock for finite-quantity products
    await Promise.all(
      canonicalProducts
        .filter(cp => !cp.stockUnlimited)
        .map(cp =>
          admin
            .from('products')
            .update({ stock_quantity: cp.stockQty - cp.quantity })
            .eq('id', cp.id)
        )
    );
  }

  // 11. Mark flash deal as claimed
  if (p.flashDealId && flashDealDiscountPct > 0) {
    await admin
      .from('flash_deals')
      .update({ status: 'claimed', claimed_by: p.clientId ?? null, booking_id: bookingId })
      .eq('id', p.flashDealId)
      .eq('status', 'active');
  }

  // Clear Next.js server-side data cache
  revalidatePath('/', 'layout');

  return { bookingId, error: null, finalTotal };
}
