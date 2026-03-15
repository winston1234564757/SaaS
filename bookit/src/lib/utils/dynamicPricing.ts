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
  const daysAhead = Math.floor((date.getTime() - now.getTime()) / 86_400_000);
  const hoursAhead = (date.getTime() - now.getTime()) / 3_600_000;

  let modifier = 0;
  let label: string | null = null;

  // Early bird takes priority (positive signal, book ahead)
  if (rules.early_bird && daysAhead >= rules.early_bird.days_ahead) {
    modifier = -rules.early_bird.discount_pct;
    label = `🐦 Рання бронь -${rules.early_bird.discount_pct}%`;
  }
  // Last minute (highest discount)
  else if (rules.last_minute && hoursAhead <= rules.last_minute.hours_ahead && hoursAhead > 0) {
    modifier = -rules.last_minute.discount_pct;
    label = `⚡ Остання хвилина -${rules.last_minute.discount_pct}%`;
  }
  // Peak hours (markup)
  else if (
    rules.peak &&
    rules.peak.days.includes(dayKey) &&
    hour >= rules.peak.hours[0] &&
    hour < rules.peak.hours[1]
  ) {
    modifier = rules.peak.markup_pct;
    label = `🔥 Пік +${rules.peak.markup_pct}%`;
  }
  // Quiet hours (discount)
  else if (
    rules.quiet &&
    rules.quiet.days.includes(dayKey) &&
    hour >= rules.quiet.hours[0] &&
    hour < rules.quiet.hours[1]
  ) {
    modifier = -rules.quiet.discount_pct;
    label = `😌 Тихий час -${rules.quiet.discount_pct}%`;
  }

  if (modifier === 0) return { adjustedPrice: basePrice, modifier: 0, label: null };

  const adjustedPrice = Math.round(basePrice * (1 + modifier / 100));
  return { adjustedPrice, modifier, label };
}
