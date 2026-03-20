/**
 * Shared booking computation engine.
 *
 * Pure functions used by both the public BookingFlow and the master's
 * ManualBookingForm. No React dependencies — safe to import anywhere.
 */

import { applyDynamicPricing, type PricingRules } from './dynamicPricing';

// ── Shared domain types ───────────────────────────────────────────────────────

export interface EngineService {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  emoji?: string;
}

export interface EngineProduct {
  id: string;
  name: string;
  price: number;
  emoji?: string;
}

export interface CartItem {
  product: EngineProduct;
  quantity: number;
}

export interface BookingTotals {
  totalServicesPrice: number;    // sum of base service prices
  totalProductsPrice: number;    // sum of product × quantity
  adjustedServicesPrice: number; // after dynamic pricing modifier
  pricingModifier: number;       // %, positive = markup, negative = discount
  pricingLabel: string | null;   // human-readable label e.g. "🔥 Пік +15%"
  discountAmount: number;        // loyalty / manual discount in ₴
  finalTotal: number;            // amount client pays
  totalDuration: number;         // total booking length in minutes
}

export interface ComputeTotalsParams {
  services: EngineService[];
  cartItems: CartItem[];
  pricingRules?: PricingRules | null;
  date?: Date | null;
  time?: string | null;        // "HH:MM"
  discountPercent?: number;    // 0–100
}

// ── Core pricing computation ──────────────────────────────────────────────────

export function computeBookingTotals(params: ComputeTotalsParams): BookingTotals {
  const { services, cartItems, pricingRules, date, time, discountPercent = 0 } = params;

  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
  const totalServicesPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalProductsPrice = cartItems.reduce((sum, ci) => sum + ci.product.price * ci.quantity, 0);

  const dynamicResult =
    date && time && pricingRules && Object.keys(pricingRules).length > 0
      ? applyDynamicPricing(totalServicesPrice, pricingRules, date, time)
      : null;

  const adjustedServicesPrice = dynamicResult?.adjustedPrice ?? totalServicesPrice;
  const grandTotal = adjustedServicesPrice + totalProductsPrice;
  const discountAmount = discountPercent > 0
    ? Math.round(grandTotal * discountPercent / 100)
    : 0;
  const finalTotal = Math.max(0, grandTotal - discountAmount);

  return {
    totalServicesPrice,
    totalProductsPrice,
    adjustedServicesPrice,
    pricingModifier: dynamicResult?.modifier ?? 0,
    pricingLabel: dynamicResult?.label ?? null,
    discountAmount,
    finalTotal,
    totalDuration,
  };
}

// ── Time helpers ──────────────────────────────────────────────────────────────

export function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const endMin = h * 60 + m + durationMinutes;
  return `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
}

/**
 * Converts booked booking rows into a Set of "HH:MM" strings (30-min increments)
 * that are occupied. Used by both booking flows to mark unavailable slots.
 */
export function buildBookedTimeSet(
  bookings: { start_time: string; end_time: string }[]
): Set<string> {
  const set = new Set<string>();
  for (const b of bookings) {
    const [sh, sm] = b.start_time.slice(0, 5).split(':').map(Number);
    const [eh, em] = b.end_time.slice(0, 5).split(':').map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur < end) {
      set.add(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
      cur += 30;
    }
  }
  return set;
}

/**
 * Builds a Set of ISO date strings ("YYYY-MM-DD") that are off-days,
 * combining recurring schedule templates with one-off exceptions.
 */
export function buildOffDaySet(
  templates: { day_of_week: string; is_working: boolean }[],
  exceptions: { date: string }[],
  days: Date[]
): Set<string> {
  const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const nonWorkingDows = new Set(
    templates.filter(t => !t.is_working).map(t => t.day_of_week)
  );
  const offDates = new Set<string>();
  days.forEach(d => {
    if (nonWorkingDows.has(DOW[d.getDay()])) {
      offDates.add(d.toISOString().slice(0, 10));
    }
  });
  exceptions.forEach(e => offDates.add(e.date));
  return offDates;
}
