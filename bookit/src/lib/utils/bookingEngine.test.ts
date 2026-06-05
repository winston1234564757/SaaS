import { describe, it, expect } from 'vitest';
import {
  computeEndTime,
  buildBookedTimeSet,
  buildOffDaySet,
  computeBookingTotals,
} from './bookingEngine';

// ── computeEndTime ────────────────────────────────────────────────

describe('computeEndTime', () => {
  it('09:00 + 60хв → 10:00', () => {
    expect(computeEndTime('09:00', 60)).toBe('10:00');
  });

  it('09:30 + 90хв → 11:00', () => {
    expect(computeEndTime('09:30', 90)).toBe('11:00');
  });

  it('23:00 + 120хв → 23:59 (cap)', () => {
    expect(computeEndTime('23:00', 120)).toBe('23:59');
  });

  it('00:00 + 0хв → 00:00', () => {
    expect(computeEndTime('00:00', 0)).toBe('00:00');
  });

  it('23:59 + 1хв → 23:59 (cap)', () => {
    expect(computeEndTime('23:59', 1)).toBe('23:59');
  });

  it('10:00 + 1439хв → 23:59 (cap)', () => {
    expect(computeEndTime('10:00', 1439)).toBe('23:59');
  });

  it('12:00 + 30хв → 12:30', () => {
    expect(computeEndTime('12:00', 30)).toBe('12:30');
  });

  it('12:30 + 30хв → 13:00', () => {
    expect(computeEndTime('12:30', 30)).toBe('13:00');
  });
});

// ── buildBookedTimeSet ────────────────────────────────────────────

describe('buildBookedTimeSet', () => {
  it('порожній масив → пустий Set', () => {
    expect(buildBookedTimeSet([]).size).toBe(0);
  });

  it('10:00–11:00 → 3 слоти (10:00, 10:30)', () => {
    const set = buildBookedTimeSet([{ start_time: '10:00', end_time: '11:00' }]);
    expect(set.has('10:00')).toBe(true);
    expect(set.has('10:30')).toBe(true);
    expect(set.has('11:00')).toBe(false); // end_time не включається
  });

  it('09:00–10:00 + 11:00–12:00 → 4 слоти', () => {
    const set = buildBookedTimeSet([
      { start_time: '09:00', end_time: '10:00' },
      { start_time: '11:00', end_time: '12:00' },
    ]);
    expect(set.size).toBe(4);
  });

  it('непарні хвилини — старт 09:15, крок 30хв до 09:45', () => {
    const set = buildBookedTimeSet([{ start_time: '09:15', end_time: '09:45' }]);
    // 555 + 0 = 555 → 09:15
    // 555 + 30 = 585 → 09:45 → cur(585) < end(585) = false, зупинка
    expect(set.has('09:15')).toBe(true);
    expect(set.has('09:45')).toBe(false); // end_time не включається
    expect(set.size).toBe(1);
  });
});

// ── buildOffDaySet ────────────────────────────────────────────────

describe('buildOffDaySet', () => {
  const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  function date(y: number, m: number, d: number): Date {
    // Травень 2026: 1 = п'ятниця (getDay=5)
    // 2026-05-04 = понеділок
    return new Date(y, m - 1, d);
  }

  it('немає вихідних → пустий Set', () => {
    const templates = DOW.map(d => ({ day_of_week: d, is_working: true }));
    const result = buildOffDaySet(templates, [], [date(2026, 5, 4)]);
    expect(result.size).toBe(0);
  });

  it('неділя вихідний → 2026-05-03 неділя', () => {
    const templates = DOW.map(d => ({ day_of_week: d, is_working: d !== 'sun' }));
    const may3 = date(2026, 5, 3); // неділя
    expect(may3.getDay()).toBe(0);
    const result = buildOffDaySet(templates, [], [may3]);
    expect(result.has('2026-05-03')).toBe(true);
  });

  it('exception додається поверх', () => {
    const templates = DOW.map(d => ({ day_of_week: d, is_working: true }));
    const result = buildOffDaySet(templates, [{ date: '2026-05-15' }], [date(2026, 5, 15)]);
    expect(result.has('2026-05-15')).toBe(true);
  });

  it('працює з кількома днями', () => {
    const templates = [
      { day_of_week: 'mon', is_working: true },
      { day_of_week: 'tue', is_working: false },
      { day_of_week: 'wed', is_working: true },
    ];
    const days = [date(2026, 5, 4), date(2026, 5, 5), date(2026, 5, 6)];
    // 2026-05-04 = понеділок ✓
    // 2026-05-05 = вівторок ✗ (is_working=false)
    // 2026-05-06 = середа ✓
    const result = buildOffDaySet(templates, [], days);
    expect(result.has('2026-05-04')).toBe(false);
    expect(result.has('2026-05-05')).toBe(true);
    expect(result.has('2026-05-06')).toBe(false);
  });
});

// ── computeBookingTotals ──────────────────────────────────────────

describe('computeBookingTotals', () => {
  const svc1 = { id: '1', name: 'Стрижка', price: 500, duration: 60 };
  const svc2 = { id: '2', name: 'Фарбування', price: 1500, duration: 120 };
  const prod = { id: 'p1', name: 'Шампунь', price: 300 };

  it('одна послуга, без товарів', () => {
    const r = computeBookingTotals({
      services: [svc1],
      cartItems: [],
    });
    expect(r.totalServicesPrice).toBe(500);
    expect(r.totalProductsPrice).toBe(0);
    expect(r.finalTotal).toBe(500);
    expect(r.totalDuration).toBe(60);
  });

  it('послуги + товари', () => {
    const r = computeBookingTotals({
      services: [svc1, svc2],
      cartItems: [{ product: prod, quantity: 2 }],
    });
    expect(r.totalServicesPrice).toBe(2000); // 500 + 1500
    expect(r.totalProductsPrice).toBe(600);  // 300 * 2
    expect(r.finalTotal).toBe(2600);
    expect(r.totalDuration).toBe(180);
  });

  it('знижка 10% → finalTotal = 2600 - 260 = 2340', () => {
    const r = computeBookingTotals({
      services: [svc1, svc2],
      cartItems: [{ product: prod, quantity: 2 }],
      discountPercent: 10,
    });
    expect(r.discountAmount).toBe(260);
    expect(r.finalTotal).toBe(2340);
  });

  it('знижка 100% → finalTotal = 0', () => {
    const r = computeBookingTotals({
      services: [svc1],
      cartItems: [],
      discountPercent: 100,
    });
    expect(r.finalTotal).toBe(0);
  });

  it('знижка 0% → без змін', () => {
    const r = computeBookingTotals({
      services: [svc1],
      cartItems: [],
      discountPercent: 0,
    });
    expect(r.finalTotal).toBe(500);
    expect(r.discountAmount).toBe(0);
  });

  it('порожньо → все 0', () => {
    const r = computeBookingTotals({
      services: [],
      cartItems: [],
    });
    expect(r.finalTotal).toBe(0);
    expect(r.totalDuration).toBe(0);
  });

  it('dynamic pricing через pricingRules', () => {
    const r = computeBookingTotals({
      services: [svc1],
      cartItems: [],
      pricingRules: {
        peak: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hours: [9, 21], markup_pct: 20 },
      },
      date: new Date('2026-05-04T10:00:00'),
      time: '10:00',
    });
    expect(r.adjustedServicesPrice).toBe(600); // 500 + 20%
    expect(r.pricingModifier).toBe(20);
    expect(r.pricingLabel).toContain('Пік');
    expect(r.finalTotal).toBe(600);
  });
});
