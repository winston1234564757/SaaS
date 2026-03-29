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

// Захист: максимальна сукупна знижка та націнка
const DISCOUNT_FLOOR = -30; // не більше -30%
const MARKUP_CEIL    =  50; // не більше +50%

export function applyDynamicPricing(
  basePrice: number,
  rules: PricingRules | null | undefined,
  date: Date,
  time: string // "HH:MM"
): PricingResult {
  if (!rules || Object.keys(rules).length === 0) {
    return { adjustedPrice: basePrice, modifier: 0, label: null };
  }

  const dayKey = DAY_MAP[date.getDay()];
  const hour = parseInt(time.split(':')[0], 10);
  const now = new Date();

  // Calendar-day difference: midnight-to-midnight
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dateYMD  = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const daysAhead  = Math.round((new Date(dateYMD + 'T00:00:00').getTime() - new Date(todayYMD + 'T00:00:00').getTime()) / 86_400_000);
  const hoursAhead = (date.getTime() - now.getTime()) / 3_600_000;

  const appliedRules: string[] = [];
  let totalModifier = 0;

  // ── Early Bird vs Last Minute ──────────────────────────────────────────────
  // Ці правила взаємовиключні: якщо Last Minute активний — Early Bird ігнорується
  const earlyBirdActive  = !!(rules.early_bird  && daysAhead >= rules.early_bird.days_ahead);
  const lastMinuteActive = !!(rules.last_minute && hoursAhead <= rules.last_minute.hours_ahead && hoursAhead > 0);

  if (lastMinuteActive) {
    totalModifier += -rules.last_minute!.discount_pct;
    appliedRules.push(`⚡ Остання хвилина -${rules.last_minute!.discount_pct}%`);
  } else if (earlyBirdActive) {
    totalModifier += -rules.early_bird!.discount_pct;
    appliedRules.push(`🐦 Рання бронь -${rules.early_bird!.discount_pct}%`);
  }

  // ── Peak (незалежно накладається поверх) ──────────────────────────────────
  if (
    rules.peak &&
    rules.peak.days.includes(dayKey) &&
    hour >= rules.peak.hours[0] &&
    hour < rules.peak.hours[1]
  ) {
    totalModifier += rules.peak.markup_pct;
    appliedRules.push(`🔥 Пік +${rules.peak.markup_pct}%`);
  }

  // ── Quiet hours (незалежно накладається поверх) ───────────────────────────
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

  // ── Limits: захист від надмірних знижок / націнок ─────────────────────────
  const clampedModifier = Math.min(MARKUP_CEIL, Math.max(DISCOUNT_FLOOR, totalModifier));

  const adjustedPrice = Math.round(basePrice * (1 + clampedModifier / 100));
  const label = appliedRules.join(', ');
  return { adjustedPrice, modifier: clampedModifier, label };
}
