import { describe, it, expect } from 'vitest';
import { getMonthStart, calcDiscountedPrice, isFlashSlotMatch } from '@/lib/utils/flashDeal';

// ── getMonthStart ────────────────────────────────────────────────────────────

describe('getMonthStart — UTC month boundary', () => {
  it('returns the first day of the month at 00:00:00.000Z', () => {
    const d = new Date('2026-06-15T12:30:00Z');
    expect(getMonthStart(d).toISOString()).toBe('2026-06-01T00:00:00.000Z');
  });

  it('works for January (month 0)', () => {
    const d = new Date('2026-01-20T08:00:00Z');
    expect(getMonthStart(d).toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('works for December (month 11)', () => {
    const d = new Date('2026-12-31T23:59:59Z');
    expect(getMonthStart(d).toISOString()).toBe('2026-12-01T00:00:00.000Z');
  });

  it('returns the same month-start when input is already day 1 at midnight UTC', () => {
    const d = new Date('2026-03-01T00:00:00Z');
    expect(getMonthStart(d).toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('is deterministic: same UTC month regardless of time-of-day', () => {
    // 23:50 UTC — still same UTC month (not rolled to next day)
    const d = new Date('2026-05-31T23:50:00Z');
    expect(getMonthStart(d).toISOString()).toBe('2026-05-01T00:00:00.000Z');
  });
});

// ── isFlashSlotMatch ─────────────────────────────────────────────────────────

describe('isFlashSlotMatch — booking slot validation', () => {
  it('returns true when date and time match exactly (HH:MM vs HH:MM)', () => {
    expect(isFlashSlotMatch('2026-06-15', '14:00', '2026-06-15', '14:00')).toBe(true);
  });

  it('returns true when dealSlotTime is HH:MM:SS (PostgreSQL TIME format)', () => {
    expect(isFlashSlotMatch('2026-06-15', '14:00', '2026-06-15', '14:00:00')).toBe(true);
  });

  it('returns false when dates differ', () => {
    expect(isFlashSlotMatch('2026-06-16', '14:00', '2026-06-15', '14:00:00')).toBe(false);
  });

  it('returns false when times differ on the same date', () => {
    expect(isFlashSlotMatch('2026-06-15', '10:00', '2026-06-15', '14:00:00')).toBe(false);
  });

  it('returns false when bookingDate is null', () => {
    expect(isFlashSlotMatch(null, '14:00', '2026-06-15', '14:00:00')).toBe(false);
  });

  it('returns false when bookingTime is undefined', () => {
    expect(isFlashSlotMatch('2026-06-15', undefined, '2026-06-15', '14:00:00')).toBe(false);
  });

  it('matches midnight slot 00:00 against 00:00:00', () => {
    expect(isFlashSlotMatch('2026-06-15', '00:00', '2026-06-15', '00:00:00')).toBe(true);
  });
});

// ── calcDiscountedPrice ──────────────────────────────────────────────────────

describe('calcDiscountedPrice — discount math', () => {
  it('20% off 1000 → 800', () => {
    expect(calcDiscountedPrice(1000, 20)).toBe(800);
  });

  it('10% off 500 → 450', () => {
    expect(calcDiscountedPrice(500, 10)).toBe(450);
  });

  it('15% off 333 rounds correctly', () => {
    // 333 * 0.85 = 283.05 → 283
    expect(calcDiscountedPrice(333, 15)).toBe(283);
  });

  it('0% discount returns original price', () => {
    expect(calcDiscountedPrice(1000, 0)).toBe(1000);
  });

  it('100% discount returns 0', () => {
    expect(calcDiscountedPrice(1000, 100)).toBe(0);
  });

  it('50% off 999 rounds correctly', () => {
    // 999 * 0.5 = 499.5 → 500
    expect(calcDiscountedPrice(999, 50)).toBe(500);
  });
});
