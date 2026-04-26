import { describe, it, expect } from 'vitest';
import {
  calculateBillingDecision,
  calculateBillingPrice,
  computeLifetimeDiscount,
  getLifetimeTierProgress,
  BASE_PRICE_KOPECKS,
  MIN_KOPECKS,
  r2,
} from './pricing';

// ── r2 precision helper ───────────────────────────────────────

describe('r2', () => {
  it('rounds 0.155 → 0.16', () => expect(r2(0.155)).toBe(0.16));
  it('0.1 + 0.05 FP → 0.15', () => expect(r2(0.1 + 0.05)).toBe(0.15));
  it('no-op on already-rounded', () => expect(r2(0.25)).toBe(0.25));
});

// ── calculateBillingDecision ──────────────────────────────────
// Formula (Round 4): total = status(activeRefs) + discountReserve
// Bounties (+10% per first referral payment) are now pre-accumulated in discountReserve

describe('calculateBillingDecision — Branch B (invoice)', () => {
  it('no discounts → full price', () => {
    const d = calculateBillingDecision({ activeRefsCount: 0, discountReserve: 0 });
    expect(d.shouldGrantFree).toBe(false);
    expect(d.totalDiscount).toBe(0);
    expect(d.finalKopecks).toBe(BASE_PRICE_KOPECKS);
    expect(d.newReserve).toBe(0);
  });

  it('1 bounty baked into reserve (10%) → 10% off = 63 000 kopecks', () => {
    const d = calculateBillingDecision({ activeRefsCount: 0, discountReserve: 0.10 });
    expect(d.shouldGrantFree).toBe(false);
    expect(d.totalDiscount).toBe(0.1);
    expect(d.finalKopecks).toBe(63_000);
  });

  it('5 active refs (5% status) + 0.30 reserve = 35% → 45 500', () => {
    const d = calculateBillingDecision({ activeRefsCount: 5, discountReserve: 0.30 });
    expect(d.statusDiscount).toBe(0.05);
    expect(d.carryover).toBe(0.30);
    expect(d.totalDiscount).toBe(0.35);
    expect(d.shouldGrantFree).toBe(false);
    expect(d.finalKopecks).toBe(45_500);
    expect(d.newReserve).toBe(0);
  });

  it('90% reserve → 7 000 kopecks', () => {
    const d = calculateBillingDecision({ activeRefsCount: 0, discountReserve: 0.90 });
    expect(d.totalDiscount).toBe(0.9);
    expect(d.finalKopecks).toBe(7_000);
    expect(d.shouldGrantFree).toBe(false);
  });

  it('99% reserve → MIN_KOPECKS floor', () => {
    const d = calculateBillingDecision({ activeRefsCount: 0, discountReserve: 0.99 });
    expect(d.totalDiscount).toBe(0.99);
    expect(d.shouldGrantFree).toBe(false);
    expect(d.finalKopecks).toBe(700);
  });
});

describe('calculateBillingDecision — Branch A (free days)', () => {
  it('reserve 1.0 alone → free month, reserve 0', () => {
    const d = calculateBillingDecision({ activeRefsCount: 0, discountReserve: 1.0 });
    expect(d.shouldGrantFree).toBe(true);
    expect(d.totalDiscount).toBe(1.0);
    expect(d.newReserve).toBe(0);
    expect(d.finalKopecks).toBe(0);
  });

  it('reserve 1.5 → free month, new reserve 0.50', () => {
    const d = calculateBillingDecision({ activeRefsCount: 0, discountReserve: 1.5 });
    expect(d.shouldGrantFree).toBe(true);
    expect(d.newReserve).toBe(0.5);
  });

  it('50% status + 0.60 reserve = 1.10 → free month, reserve 0.10', () => {
    const d = calculateBillingDecision({ activeRefsCount: 50, discountReserve: 0.60 });
    expect(d.statusDiscount).toBe(0.5);
    expect(d.carryover).toBe(0.60);
    expect(d.totalDiscount).toBe(1.1);
    expect(d.shouldGrantFree).toBe(true);
    expect(d.newReserve).toBe(0.10);
  });

  it('25% status + 0.50 reserve + 0.30 banked bounties = 1.05 → reserve 0.05', () => {
    const d = calculateBillingDecision({ activeRefsCount: 25, discountReserve: 0.80 });
    expect(d.shouldGrantFree).toBe(true);
    expect(d.newReserve).toBe(0.05);
  });

  it('no floating-point garbage: 0.25 + 0.75 = 1.00 → reserve 0', () => {
    const d = calculateBillingDecision({ activeRefsCount: 25, discountReserve: 0.75 });
    expect(d.shouldGrantFree).toBe(true);
    expect(d.newReserve).toBe(0);
  });
});

// ── calculateBillingPrice (UI preview, legacy) ────────────────

describe('calculateBillingPrice (UI preview)', () => {
  it('no bounties, no lifetime → full price', () => {
    const r = calculateBillingPrice({ referralBountiesPending: 0, lifetimeDiscount: 0 });
    expect(r.finalKopecks).toBe(BASE_PRICE_KOPECKS);
  });

  it('1 bounty + 5% lifetime → 15% off = 59 500', () => {
    const r = calculateBillingPrice({ referralBountiesPending: 1, lifetimeDiscount: 0.05 });
    expect(r.totalDiscount).toBe(0.15);
    expect(r.finalKopecks).toBe(59_500);
    expect(Number.isInteger(r.finalKopecks)).toBe(true);
  });

  it('total >= 100% in preview → MIN_KOPECKS floor (no free-days logic in preview)', () => {
    const r = calculateBillingPrice({ referralBountiesPending: 10, lifetimeDiscount: 0.50 });
    expect(r.finalKopecks).toBe(MIN_KOPECKS);
  });
});

// ── computeLifetimeDiscount ────────────────────────────────────

describe('computeLifetimeDiscount', () => {
  it('0 refs → 0%',  () => expect(computeLifetimeDiscount(0)).toBe(0));
  it('4 refs → 0%',  () => expect(computeLifetimeDiscount(4)).toBe(0));
  it('5 refs → 5%',  () => expect(computeLifetimeDiscount(5)).toBe(0.05));
  it('10 refs → 10%', () => expect(computeLifetimeDiscount(10)).toBe(0.10));
  it('25 refs → 25%', () => expect(computeLifetimeDiscount(25)).toBe(0.25));
  it('50 refs → 50%', () => expect(computeLifetimeDiscount(50)).toBe(0.50));
  it('99 refs capped → 50%', () => expect(computeLifetimeDiscount(99)).toBe(0.50));
  it('negative → 0%', () => expect(computeLifetimeDiscount(-1)).toBe(0));
});

// ── getLifetimeTierProgress ────────────────────────────────────

describe('getLifetimeTierProgress', () => {
  it('0 refs → toward 5-ref tier', () => {
    const p = getLifetimeTierProgress(0)!;
    expect(p.nextTierRefs).toBe(5);
    expect(p.refsNeeded).toBe(5);
    expect(p.progressPct).toBe(0);
  });

  it('3 refs → 60% toward 5-ref tier', () => {
    const p = getLifetimeTierProgress(3)!;
    expect(p.progressPct).toBe(60);
  });

  it('50 refs → null (max tier)', () => {
    expect(getLifetimeTierProgress(50)).toBeNull();
  });
});
