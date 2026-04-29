/**
 * Pure billing price calculator — no I/O, fully unit-testable.
 *
 * Alliance & Discount Banking model (Round 4):
 *  - status_discount:  tier-based lifetime (5/10/25/50 active refs → 5/10/25/50%)
 *  - discount_reserve: banks both Bounties (+10% per referral first payment) AND
 *                      unused carryover from previous cycles
 *  - total = round2(status + reserve)
 *
 *  Branch A (total >= 1.0): grant 30 free days, bank remainder (total - 1.0), no invoice
 *  Branch B (total  < 1.0): create invoice for max(1 UAH, 700 * (1 - total)), reset reserve
 *
 * Precision: all discount fractions rounded to 2 decimal places to avoid FP errors.
 */

export const BASE_PRICE_KOPECKS = 500; // 5 UAH for testing
export const MAX_REFS_COUNTED   = 50;
export const BOUNTY_PER_REF     = 0.10;
export const MIN_KOPECKS        = 100;    // 1 UAH bank floor

/** Round to 2 decimal places (matches task constraint). */
export const r2 = (n: number): number => Math.round(n * 100) / 100;

/** Tier thresholds → permanent lifetime discount */
export const LIFETIME_TIERS: Array<{ refs: number; discount: number }> = [
  { refs: 50, discount: 0.50 },
  { refs: 25, discount: 0.25 },
  { refs: 10, discount: 0.10 },
  { refs:  5, discount: 0.05 },
];

export interface BillingInput {
  activeRefsCount:  number;
  discountReserve:  number; // banks both bounties (+10% per first payment) AND carryover
  basePriceKopecks?: number;
}

export interface BillingDecision {
  statusDiscount:  number;
  /** @deprecated always 0 — bounties now flow into discountReserve directly */
  bountyDiscount:  number;
  carryover:       number; // alias for discountReserve (kept for log compatibility)
  totalDiscount:   number;
  /** true → Branch A: grant free days, no invoice */
  shouldGrantFree: boolean;
  /** Branch A: remainder to bank for next cycle */
  newReserve:      number;
  /** Branch B: kopecks to charge */
  finalKopecks:    number;
}

/**
 * Core billing decision.
 * Returns all intermediate values + the branch to take.
 */
export function calculateBillingDecision({
  activeRefsCount,
  discountReserve,
  basePriceKopecks = BASE_PRICE_KOPECKS,
}: BillingInput): BillingDecision {
  const statusDiscount = r2(computeLifetimeDiscount(activeRefsCount));
  const carryover      = r2(Math.max(0, discountReserve));
  const totalDiscount  = r2(statusDiscount + carryover);

  if (totalDiscount >= 1.0) {
    return {
      statusDiscount,
      bountyDiscount:  0,
      carryover,
      totalDiscount,
      shouldGrantFree: true,
      newReserve:      r2(totalDiscount - 1.0),
      finalKopecks:    0,
    };
  }

  return {
    statusDiscount,
    bountyDiscount:  0,
    carryover,
    totalDiscount,
    shouldGrantFree: false,
    newReserve:      0,
    finalKopecks:    Math.max(MIN_KOPECKS, Math.round(basePriceKopecks * (1 - totalDiscount))),
  };
}

/** Returns the lifetime discount fraction for a given active-refs count. */
export function computeLifetimeDiscount(activeRefsCount: number): number {
  const capped = Math.min(MAX_REFS_COUNTED, Math.max(0, activeRefsCount));
  for (const tier of LIFETIME_TIERS) {
    if (capped >= tier.refs) return tier.discount;
  }
  return 0;
}

/** Progress toward the next lifetime tier (null if already at max). */
export interface TierProgress {
  currentDiscount: number;
  nextTierRefs:    number;
  nextDiscount:    number;
  refsNeeded:      number;
  progressPct:     number;
  prevTierRefs:    number;
}

export function getLifetimeTierProgress(activeRefsCount: number): TierProgress | null {
  const capped = Math.min(MAX_REFS_COUNTED, Math.max(0, activeRefsCount));
  for (let i = LIFETIME_TIERS.length - 1; i >= 0; i--) {
    const next = LIFETIME_TIERS[i];
    if (capped < next.refs) {
      const prev  = LIFETIME_TIERS[i + 1] ?? { refs: 0, discount: 0 };
      const range = next.refs - prev.refs;
      const done  = capped - prev.refs;
      return {
        currentDiscount: computeLifetimeDiscount(capped),
        nextTierRefs:    next.refs,
        nextDiscount:    next.discount,
        refsNeeded:      next.refs - capped,
        progressPct:     Math.round((done / range) * 100),
        prevTierRefs:    prev.refs,
      };
    }
  }
  return null;
}

// ── Legacy: kept for backward-compat with growth page / non-billing UI ──
export interface PricingInput {
  referralBountiesPending: number;
  lifetimeDiscount:        number;
  basePriceKopecks?:       number;
}

export interface PricingResult {
  referralBountiesPending: number;
  bountyDiscount:  number;
  lifetimeDiscount: number;
  totalDiscount:   number;
  finalKopecks:    number;
}

/** Simple UI preview (no carryover). Use calculateBillingDecision in cron. */
export function calculateBillingPrice({
  referralBountiesPending,
  lifetimeDiscount,
  basePriceKopecks = BASE_PRICE_KOPECKS,
}: PricingInput): PricingResult {
  const pending        = Math.max(0, referralBountiesPending);
  const bountyDiscount = r2(Math.min(1, pending * BOUNTY_PER_REF));
  const totalDiscount  = r2(bountyDiscount + Math.max(0, lifetimeDiscount));
  const finalKopecks   = Math.max(MIN_KOPECKS, Math.round(basePriceKopecks * (1 - Math.min(1, totalDiscount))));
  return { referralBountiesPending: pending, bountyDiscount, lifetimeDiscount, totalDiscount, finalKopecks };
}
