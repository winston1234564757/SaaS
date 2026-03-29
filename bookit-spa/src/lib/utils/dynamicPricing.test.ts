import { applyDynamicPricing, type PricingRules } from './dynamicPricing';

// ── Хелпери ───────────────────────────────────────────────────────────────────

/**
 * Будує Date для конкретного дня тижня + часу відносно "зараз".
 * daysOffset=0 → сьогодні, daysOffset=14 → через 14 днів.
 */
function makeDate(daysOffset: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const BASE_PRICE = 1000;

// ── Базовий сценарій ──────────────────────────────────────────────────────────

describe('applyDynamicPricing — базовий', () => {
  it('повертає базову ціну, якщо правила порожні', () => {
    const result = applyDynamicPricing(BASE_PRICE, null, makeDate(0), '10:00');
    expect(result.adjustedPrice).toBe(BASE_PRICE);
    expect(result.modifier).toBe(0);
    expect(result.label).toBeNull();
  });

  it('повертає базову ціну, якщо жодне правило не спрацьовує', () => {
    // Піковий час — тільки субота; бронюємо в понеділок
    const rules: PricingRules = {
      peak: { days: ['sat'], hours: [17, 21], markup_pct: 20 },
    };
    // Форсуємо день = понеділок (setDay не існує, тому шукаємо найближчий понеділок)
    const monday = makeDate(0);
    while (monday.getDay() !== 1) monday.setDate(monday.getDate() + 1);
    const result = applyDynamicPricing(BASE_PRICE, rules, monday, '10:00');
    expect(result.modifier).toBe(0);
    expect(result.label).toBeNull();
  });
});

// ── Одиночні правила ──────────────────────────────────────────────────────────

describe('applyDynamicPricing — одиночні правила', () => {
  it('Early Bird: знижка -10% за 14+ днів', () => {
    const rules: PricingRules = {
      early_bird: { days_ahead: 14, discount_pct: 10 },
    };
    const result = applyDynamicPricing(BASE_PRICE, rules, makeDate(14), '10:00');
    expect(result.modifier).toBe(-10);
    expect(result.adjustedPrice).toBe(900);
    expect(result.label).toContain('Рання бронь');
  });

  it('Last Minute: знижка -15% за ≤ 2 години', () => {
    const rules: PricingRules = {
      last_minute: { hours_ahead: 2, discount_pct: 15 },
    };
    // 1 година вперед
    const soon = new Date(Date.now() + 60 * 60 * 1000);
    const result = applyDynamicPricing(BASE_PRICE, rules, soon, `${soon.getHours()}:00`);
    expect(result.modifier).toBe(-15);
    expect(result.adjustedPrice).toBe(850);
    expect(result.label).toContain('Остання хвилина');
  });

  it('Peak: націнка +20% у піковий час', () => {
    const rules: PricingRules = {
      peak: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hours: [9, 21], markup_pct: 20 },
    };
    const result = applyDynamicPricing(BASE_PRICE, rules, makeDate(3), '10:00');
    expect(result.modifier).toBe(20);
    expect(result.adjustedPrice).toBe(1200);
    expect(result.label).toContain('Пік');
  });

  it('Quiet: знижка -15% у тихий час', () => {
    const rules: PricingRules = {
      quiet: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hours: [7, 10], discount_pct: 15 },
    };
    const result = applyDynamicPricing(BASE_PRICE, rules, makeDate(3), '08:00');
    expect(result.modifier).toBe(-15);
    expect(result.adjustedPrice).toBe(850);
    expect(result.label).toContain('Тихий час');
  });
});

// ── Smart Rule Stacking ───────────────────────────────────────────────────────

describe('applyDynamicPricing — Smart Rule Stacking', () => {
  it('Peak +20% + Early Bird -10% = modifier +10%', () => {
    const rules: PricingRules = {
      peak:       { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hours: [9, 21], markup_pct: 20 },
      early_bird: { days_ahead: 14, discount_pct: 10 },
    };
    const result = applyDynamicPricing(BASE_PRICE, rules, makeDate(14), '10:00');
    expect(result.modifier).toBe(10);               // +20 - 10 = +10
    expect(result.adjustedPrice).toBe(1100);
    expect(result.label).toContain('Пік');
    expect(result.label).toContain('Рання бронь');
  });

  it('Quiet -10% + Early Bird -10% = modifier -20%', () => {
    const rules: PricingRules = {
      quiet:      { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hours: [7, 10], discount_pct: 10 },
      early_bird: { days_ahead: 7, discount_pct: 10 },
    };
    const result = applyDynamicPricing(BASE_PRICE, rules, makeDate(7), '08:00');
    expect(result.modifier).toBe(-20);
    expect(result.adjustedPrice).toBe(800);
  });
});

// ── Захист від взаємовиключних правил ────────────────────────────────────────

describe('applyDynamicPricing — Early Bird vs Last Minute (взаємовиключні)', () => {
  it('якщо активні обидва — застосовується тільки Last Minute', () => {
    // Фізично це неможливо (14+ днів vs <2 год), тому симулюємо edge-case:
    // early_bird.days_ahead = 0 (завжди true) + last_minute активний
    const rules: PricingRules = {
      early_bird:  { days_ahead: 0, discount_pct: 10 },
      last_minute: { hours_ahead: 2, discount_pct: 15 },
    };
    const soon = new Date(Date.now() + 60 * 60 * 1000); // 1 год
    const result = applyDynamicPricing(BASE_PRICE, rules, soon, `${soon.getHours()}:00`);
    expect(result.modifier).toBe(-15);              // тільки Last Minute
    expect(result.label).not.toContain('Рання бронь');
    expect(result.label).toContain('Остання хвилина');
  });
});

// ── Limits (захист від надмірних модифікаторів) ───────────────────────────────

describe('applyDynamicPricing — Limits', () => {
  it('сукупна знижка не перевищує -30% (floor)', () => {
    const rules: PricingRules = {
      quiet:      { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hours: [7, 10], discount_pct: 20 },
      early_bird: { days_ahead: 7, discount_pct: 20 }, // разом -40%, але ліміт -30%
    };
    const result = applyDynamicPricing(BASE_PRICE, rules, makeDate(7), '08:00');
    expect(result.modifier).toBe(-30);
    expect(result.adjustedPrice).toBe(700);
  });

  it('сукупна націнка не перевищує +50% (ceil)', () => {
    const rules: PricingRules = {
      peak: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hours: [9, 21], markup_pct: 60 }, // 60%, але ліміт 50%
    };
    const result = applyDynamicPricing(BASE_PRICE, rules, makeDate(3), '10:00');
    expect(result.modifier).toBe(50);
    expect(result.adjustedPrice).toBe(1500);
  });

  it('Peak +20% + Quiet -5% — ціна залишається позитивною при малому basePrice', () => {
    const rules: PricingRules = {
      peak:  { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hours: [9, 21], markup_pct: 20 },
      quiet: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hours: [9, 21], discount_pct: 5 },
    };
    // modifier = +15%
    const result = applyDynamicPricing(10, rules, makeDate(3), '10:00');
    expect(result.adjustedPrice).toBeGreaterThan(0);
    expect(result.modifier).toBe(15);
  });
});
