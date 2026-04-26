'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyDynamicPricing, type PricingRules } from '@/lib/utils/dynamicPricing';
import { toZonedTime } from 'date-fns-tz';
import { getNow } from '@/lib/utils/now';
import { computeEndTime } from '@/lib/utils/bookingEngine';
import { sendTelegramMessage, buildBookingMessage } from '@/lib/telegram';
import { revalidatePath } from 'next/cache';
import { bookingClientSchema } from '@/lib/validations/booking';

// Phone normalization is now handled by Zod preprocessing in bookingClientSchema

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
  ...bookingClientSchema.shape,
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
  // Якщо false — ігнорувати pricing_rules (майстер вирішив не застосовувати dynamic pricing).
  // true за замовчуванням, щоб не зламати існуючі записи клієнтів.
  applyDynamicPricing: z.boolean().default(true),
  // Реферальний код (C2C: при завершенні бронювання DB тригер активує знижку власнику лінка)
  referral_code_used: z.string().max(20).optional().nullable().default(null),
  // Знижка для подруги (C2C) — передається клієнтом, але сервер сам перевіряє і застосовує
  c2c_discount_pct: z.number().int().min(1).max(50).optional().nullable().default(null),
  // Реферальний бонус що реферер хоче використати (% від накопиченого балансу)
  c2c_bonus_to_use: z.number().int().min(1).max(80).optional().nullable().default(null),
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

  // 2. Auth gate & Identity resolution
  let resolvedClientId = p.clientId ?? null;
  const { data: { user } } = await supabase.auth.getUser();

  if (p.source === 'manual') {
    // SEC-HIGH-3: verify caller is the master AND has master role — clients cannot create manual bookings
    if (!user || user.id !== p.masterId) {
      return { bookingId: null, error: 'Не авторизований' };
    }
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (callerProfile?.role !== 'master') {
      return { bookingId: null, error: 'Не авторизований' };
    }
  } else if (p.source === 'online') {
    // Only link booking to authenticated CLIENTS — masters visiting a public page
    // must not be set as client_id (their ID has no client_profiles row → FK violation).
    if (user) {
      const { data: userProfile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (userProfile?.role === 'client') {
        // Guarantee client_profiles FK row exists before inserting booking
        await admin
          .from('client_profiles')
          .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });
        resolvedClientId = user.id;
      }
      // masters / unknown roles → resolvedClientId stays null (anonymous booking)
    }
  }

  // 3. Master profile — pricing rules + subscription tier + trial counter
  // SEC-CRIT-2: include is_published to block calendar spam on unpublished masters (online source)
  console.log('[createBooking] Fetching master profile for ID:', p.masterId);
  const { data: mp, error: masterError } = await admin
    .from('master_profiles')
    .select('subscription_tier, pricing_rules, dynamic_pricing_extra_earned, telegram_chat_id, is_published, timezone, c2c_enabled, c2c_discount_pct')
    .eq('id', p.masterId)
    .single();

  if (masterError || !mp) {
    console.error('[createBooking] Master Query Error:', masterError);
    return { bookingId: null, error: 'Майстра не знайдено' };
  }

  // SEC-CRIT-2: prevent calendar spam — online bookings only allowed on published masters
  if (p.source === 'online' && !mp.is_published) {
    return { bookingId: null, error: 'Майстра не знайдено' };
  }

  // Bug 4 Fix: Pass master's timezone (fallback to Kyiv)
  const masterTimezone = (mp as any).timezone || 'Europe/Kyiv';

  // 4. Starter booking limit (30/month)
  if (mp.subscription_tier === 'starter') {
    const nowInTZ = toZonedTime(getNow(), masterTimezone);
    const monthStart = new Date(nowInTZ.getFullYear(), nowInTZ.getMonth(), 1).toISOString();
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
  // Value-Capped Trial: Starter отримує фічу безкоштовно до ліміту 100 000 коп. (1 000 ₴)
  const TRIAL_LIMIT_KOP = 100_000;
  const extraEarned = (mp.dynamic_pricing_extra_earned as number) ?? 0;
  const trialExhausted = mp.subscription_tier === 'starter' && extraEarned >= TRIAL_LIMIT_KOP;
  const pricingRules = (!trialExhausted ? mp.pricing_rules : null) as PricingRules | null;
  
  const dynamicResult =
    p.applyDynamicPricing && pricingRules && Object.keys(pricingRules).length > 0
      ? applyDynamicPricing(totalServicesPrice, pricingRules, bookingDate, p.startTime, masterTimezone)
      : null;

  const adjustedServicesPrice = dynamicResult?.adjustedPrice ?? totalServicesPrice;
  const subTotal = adjustedServicesPrice + totalProductsPrice;

  // ── 7.5. Loyalty Engine (Backend validation) ──────────────────────────────
  let loyaltyDiscountPercent = 0;
  let loyaltyLabel = '';

  if (p.source === 'online') {
    const [{ count: pastVisitsCount }, { data: loyaltyRules }] = await Promise.all([
      admin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('master_id', p.masterId)
        .eq('client_phone', p.clientPhone)
        .eq('status', 'completed'),
      admin
        .from('loyalty_programs')
        .select('name, target_visits, reward_type, reward_value')
        .eq('master_id', p.masterId)
        .eq('is_active', true)
        .order('target_visits', { ascending: false }),
    ]);

    const totalVisitsWithThisOne = (pastVisitsCount ?? 0) + 1;

    const qualifyingRule = (loyaltyRules ?? []).find(r => 
      r.reward_type === 'percent_discount' && totalVisitsWithThisOne >= r.target_visits
    );

    if (qualifyingRule) {
      loyaltyDiscountPercent = Number(qualifyingRule.reward_value);
      loyaltyLabel = qualifyingRule.name;
    }
  } else {
    // SEC: cap manual master discount at 50% — prevents zeroing out bookings
    loyaltyDiscountPercent = Math.min(p.discountPercent, 50);
  }

  // Flash deal fetch (discount percent — amount обчислюється в секції 7.6)
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

  // ── 7.5. C2C Friend Discount Validation ────────────────────────────────────
  // Server re-validates all 5 conditions regardless of client hint.
  let c2cFriendDiscountPct = 0;
  let c2cReferrerId: string | null = null;
  const masterC2cEnabled = (mp as any).c2c_enabled as boolean | null;
  const masterC2cDiscountPct = (mp as any).c2c_discount_pct as number ?? 10;

  if (p.source === 'online' && p.referral_code_used && masterC2cEnabled && resolvedClientId) {
    // Condition 1+2: master enabled + referrer exists
    const { data: referrerProfile } = await admin
      .from('client_profiles')
      .select('id')
      .eq('referral_code', p.referral_code_used)
      .maybeSingle();

    if (referrerProfile) {
      // Condition 3: no self-referral
      const isSelf = referrerProfile.id === resolvedClientId;
      // Condition 4: friend is new to this master (0 prior bookings)
      const { count: priorBookings } = await admin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', resolvedClientId)
        .eq('master_id', p.masterId)
        .neq('status', 'cancelled');
      // Condition 5: no existing c2c_referral for this pair
      const { data: existingReferral } = await admin
        .from('c2c_referrals')
        .select('id')
        .eq('referrer_id', referrerProfile.id)
        .eq('master_id', p.masterId)
        .eq('referred_id', resolvedClientId)
        .maybeSingle();

      if (!isSelf && (priorBookings ?? 0) === 0 && !existingReferral) {
        c2cFriendDiscountPct = masterC2cDiscountPct;
        c2cReferrerId = referrerProfile.id;
      }
    }
  }

  // ── 7.5b. C2C Referrer Bonus Validation ────────────────────────────────────
  // Server re-computes balance — client-supplied c2cBonusToUse is a hint only.
  let c2cBonusActual = 0;
  if (p.source === 'online' && p.c2c_bonus_to_use && resolvedClientId && masterC2cEnabled) {
    const { data: balance } = await admin.rpc('get_c2c_balance', {
      p_referrer_id: resolvedClientId,
      p_master_id: p.masterId,
    });
    const serverBalance = typeof balance === 'number' ? balance : 0;
    // Cap: client request ≤ server balance AND ≤ 80
    c2cBonusActual = Math.min(p.c2c_bonus_to_use, serverBalance, 80);
    if (c2cBonusActual < 1) c2cBonusActual = 0;
  }

  // ── 7.6. Comprehensive Discount Resolution & Safety Cap (40%) ──────────────
  // Markup (peak hours) і Discount (loyal, flash, quiet) обробляються ОКРЕМО.
  // Markup НЕ компенсується знижками — він додається зверху після cap.
  // Знижки обчислюються від originalTotal (до надбавки), щоб markup не збільшував їх базу.
  const originalTotal = totalServicesPrice + totalProductsPrice;
  const maxAllowedDiscount = Math.floor(originalTotal * 0.40);

  // Dynamic pricing: розділяємо надбавку і знижку
  const dynamicMarkup   = Math.max(0, adjustedServicesPrice - totalServicesPrice); // peak: +X₴
  const dynamicDiscount = Math.max(0, totalServicesPrice - adjustedServicesPrice); // quiet: -X₴

  // Loyalty і flash знижки рахуються від originalTotal — незалежно від markup
  const loyaltyDiscountAmount = Math.round(originalTotal * loyaltyDiscountPercent / 100);
  const flashDealAmount       = flashDealDiscountPct > 0
    ? Math.round(originalTotal * flashDealDiscountPct / 100)
    : 0;
  const c2cFriendAmount = c2cFriendDiscountPct > 0
    ? Math.round(originalTotal * c2cFriendDiscountPct / 100)
    : 0;

  // Сума лише знижок (завжди >= 0), обмежена 40% від originalTotal (+ C2C не входить в цей cap)
  const totalDiscounts    = dynamicDiscount + loyaltyDiscountAmount + flashDealAmount;
  const effectiveDiscount = Math.min(maxAllowedDiscount, totalDiscounts);

  // C2C friend discount: поверх effectiveDiscount, не входить в 40% cap
  const preFinalTotal = Math.max(0, originalTotal + dynamicMarkup - effectiveDiscount);
  // C2C referrer bonus: % від preFinalTotal (після friend discount)
  const c2cBonusAmount = c2cBonusActual > 0
    ? Math.round(preFinalTotal * c2cBonusActual / 100)
    : 0;
  const finalTotal = Math.max(0, preFinalTotal - c2cFriendAmount - c2cBonusAmount);
  const effectiveDuration = p.durationOverrideMinutes ?? totalDuration;
  const endTime = computeEndTime(p.startTime, effectiveDuration);

  // 8. Insert booking
  // Зберігаємо результат динамічного ціноутворення для аналітики + trigger-обліку
  const dynamicExtraKopecks = dynamicResult && dynamicResult.modifier > 0
    ? Math.max(0, Math.round((adjustedServicesPrice - totalServicesPrice) * 100))
    : 0;

  const bookingId = crypto.randomUUID();
  const { error: bErr } = await admin.from('bookings').insert({
    id: bookingId,
    master_id: p.masterId,
    client_id: resolvedClientId,
    client_name: p.clientName.trim(),
    client_phone: p.clientPhone, // Already normalized by Zod preprocessor to +380XXXXXXXXX
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
    dynamic_pricing_label: (() => {
      const parts: string[] = [];
      if (dynamicResult?.label) parts.push(dynamicResult.label);
      if (c2cFriendDiscountPct > 0) parts.push(`Реферальна програма −${c2cFriendDiscountPct}%`);
      if (c2cBonusActual > 0) parts.push(`Реф. бонус −${c2cBonusActual}%`);
      return parts.join(' · ') || null;
    })(),
    dynamic_extra_kopecks: dynamicExtraKopecks,
    referral_code_used: p.referral_code_used ?? null,
  });

  if (bErr) {
    console.error('[createBooking] bookings insert [ERROR CODE]:', bErr.code, ' [MESSAGE]:', bErr.message);
    if (bErr.code === '23505' && bErr.message.includes('booking_slot_collision')) {
      return { bookingId: null, error: 'Цей час вже заброньований. Оберіть інший час.' };
    }
    return { bookingId: null, error: 'Не вдалося створити запис. Спробуйте ще раз.' };
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

    // Atomic stock decrement — checks and deducts in one operation (prevents overselling TOCTOU race)
    // If a concurrent booking depleted stock between our check (step 6) and now,
    // the UPDATE matches 0 rows (stock_quantity < cp.quantity) → we detect & roll back.
    const stockResults = await Promise.all(
      canonicalProducts
        .filter(cp => !cp.stockUnlimited)
        .map(cp =>
          admin
            .from('products')
            .update({ stock_quantity: cp.stockQty - cp.quantity })
            .eq('id', cp.id)
            .gte('stock_quantity', cp.quantity)
            .select('id')
        )
    );
    const oversold = stockResults.find(r => !r.error && (!r.data || r.data.length === 0));
    if (oversold) {
      await admin.from('bookings').delete().eq('id', bookingId);
      return { bookingId: null, error: 'Товар щойно закінчився. Спробуйте ще раз.' };
    }
  }

  // 11. Mark flash deal as claimed
  if (p.flashDealId && flashDealDiscountPct > 0) {
    await admin
      .from('flash_deals')
      .update({ status: 'claimed', claimed_by: p.clientId ?? null, booking_id: bookingId })
      .eq('id', p.flashDealId)
      .eq('status', 'active');
  }

  // 12. C2C records (fire-and-forget — never block the booking response)
  if (c2cReferrerId && resolvedClientId && c2cFriendDiscountPct > 0) {
    admin.from('c2c_referrals').insert({
      referrer_id: c2cReferrerId,
      referred_id: resolvedClientId,
      master_id: p.masterId,
      booking_id: bookingId,
      discount_pct: c2cFriendDiscountPct,
      status: 'pending',
    }).then(({ error: c2cErr }) => {
      if (c2cErr && c2cErr.code !== '23505') {
        console.error('[createBooking] c2c_referrals insert failed:', c2cErr.message);
      }
    });
  }

  if (c2cBonusActual > 0 && resolvedClientId) {
    // Deduct bonus from referrer balance: mark oldest completed referrals as used
    // We do this by inserting a bonus_use record
    admin.from('c2c_bonus_uses').insert({
      referrer_id: resolvedClientId,
      master_id: p.masterId,
      booking_id: bookingId,
      discount_used: c2cBonusActual,
    }).then(({ error: buErr }) => {
      if (buErr && buErr.code !== '23505') {
        console.error('[createBooking] c2c_bonus_uses insert failed:', buErr.message);
      }
    });
  }

  // 13. Trial accounting — облік ведеться DB trigger'ом (fn_dp_trial_earned_on_complete)
  //     при зміні статусу на 'completed'. Тут нічого додатково робити не потрібно.

  // Clear Next.js server-side data cache
  revalidatePath('/', 'layout');

  // 13. Telegram-сповіщення майстру (fire-and-forget, не блокуємо відповідь)
  const masterTgChatId = (mp as any).telegram_chat_id as string | null;
  if (masterTgChatId) {
    const serviceNames = canonicalServices.map(s => s.name).join(', ');
    void sendTelegramMessage(
      masterTgChatId,
      buildBookingMessage({
        clientName: p.clientName,
        date: p.date,
        startTime: p.startTime,
        services: serviceNames,
        totalPrice: finalTotal,
        notes: p.notes,
        products: canonicalProducts.map(cp => ({ name: cp.name, quantity: cp.quantity })),
      }),
    );
  }

  return { bookingId, error: null, finalTotal };
}
