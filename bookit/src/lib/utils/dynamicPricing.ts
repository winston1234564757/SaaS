import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { getNow } from './now';

export interface PricingRules {
  peak?: { days: string[]; hours: [number, number]; markup_pct: number };
  quiet?: { days: string[]; hours: [number, number]; discount_pct: number };
  early_bird?: { days_ahead: number; discount_pct: number };
  last_minute?: { hours_ahead: number; discount_pct: number };
}

const DAY_MAP: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

export interface PricingResult {
  adjustedPrice: number;
  modifier: number; // positive = markup, negative = discount (percent)
  label: string | null;
}

const DISCOUNT_FLOOR = -30; // Max dynamic discount -30% (global cap in createBooking will still apply)
const MARKUP_CEIL    =  50; // Max dynamic markup +50%

/**
 * Applies dynamic pricing rules based on the time of the booking slot.
 * Fixes timezone issues by constructing date without UTC-drift.
 */
export function applyDynamicPricing(
  basePrice: number,
  rules: PricingRules | null | undefined,
  date: Date,
  time: string, // "HH:MM"
  masterTimezone: string = 'Europe/Kyiv'
): PricingResult {
  if (!rules || Object.keys(rules).length === 0) {
    return { adjustedPrice: basePrice, modifier: 0, label: null };
  }

  // 1. Get current time (UTC)
  const now = getNow();

  // 2. Build target slot datetime in master's timezone
  // Fix Bug 4.1: Do NOT use toISOString() which shifts date back by hours for GMT+3.
  // We extract YYYY-MM-DD from the local parts of the 'date' object.
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  const slotDateTime = toZonedTime(`${dateStr}T${time}:00`, masterTimezone);

  const dayKey = DAY_MAP[slotDateTime.getDay()];
  const hour = slotDateTime.getHours();

  // 3. Calculate differences
  const todayYMD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slotYMD  = new Date(slotDateTime.getFullYear(), slotDateTime.getMonth(), slotDateTime.getDate());
  const daysAhead = Math.round((slotYMD.getTime() - todayYMD.getTime()) / 86_400_000);
  
  // Real hours difference (absolute)
  const hoursAhead = (slotDateTime.getTime() - now.getTime()) / 3_600_000;

  const appliedRules: string[] = [];
  let totalModifier = 0;

  // ── Early Bird vs Last Minute ──────────────────────────────────────────────
  const earlyBirdActive  = !!(rules.early_bird  && daysAhead >= rules.early_bird.days_ahead);
  const lastMinuteActive = !!(rules.last_minute && hoursAhead <= rules.last_minute.hours_ahead && hoursAhead > 0);

  if (lastMinuteActive) {
    totalModifier += -rules.last_minute!.discount_pct;
    appliedRules.push(`⚡ Остання хвилина -${rules.last_minute!.discount_pct}%`);
  } else if (earlyBirdActive) {
    totalModifier += -rules.early_bird!.discount_pct;
    appliedRules.push(`🐦 Рання бронь -${rules.early_bird!.discount_pct}%`);
  }

  // ── Peak ──────────────────────────────────────────────────────────────────
  if (
    rules.peak &&
    rules.peak.days.includes(dayKey) &&
    hour >= rules.peak.hours[0] &&
    hour < rules.peak.hours[1]
  ) {
    totalModifier += rules.peak.markup_pct;
    appliedRules.push(`🔥 Пік +${rules.peak.markup_pct}%`);
  }

  // ── Quiet hours ───────────────────────────────────────────────────────────
  if (
    rules.quiet &&
    rules.quiet.days.includes(dayKey) &&
    hour >= rules.quiet.hours[0] &&
    hour < rules.quiet.hours[1]
  ) {
    totalModifier += -rules.quiet.discount_pct;
    appliedRules.push(`😌 Тихий час -${rules.quiet.discount_pct}%`);
  }

  if (appliedRules.length === 0) return { adjustedPrice: basePrice, modifier: 0, label: null };

  const clampedModifier = Math.min(MARKUP_CEIL, Math.max(DISCOUNT_FLOOR, totalModifier));
  const adjustedPrice = Math.round(basePrice * (1 + clampedModifier / 100));
  const label = appliedRules.join(', ');

  return { adjustedPrice, modifier: clampedModifier, label };
}