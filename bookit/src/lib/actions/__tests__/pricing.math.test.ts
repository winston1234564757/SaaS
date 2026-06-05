import { describe, it, expect } from 'vitest';

interface DiscountInput {
  totalServicesPrice: number;
  totalProductsPrice: number;
  originalTotal: number;
  barterDiscountPct: number;
  adjustedServicesPrice: number;
  flashDealPct: number;
  loyaltyPct: number;
  masterDiscountPct: number;
  subTotal: number;
}

interface DiscountResult {
  barterDiscountAmount: number;
  flashDealAmount: number;
  loyaltyDiscountAmount: number;
  masterDiscountAmount: number;
  totalRequestedDiscount: number;
  maxAllowedDiscount: number;
  effectiveTotalDiscount: number;
  finalTotal: number;
}

function resolvePricing(input: DiscountInput): DiscountResult {
  const maxAllowedDiscount = Math.floor(input.originalTotal * 0.40);

  if (input.barterDiscountPct > 0) {
    const barterAmount = Math.round(input.originalTotal * input.barterDiscountPct / 100);
    return {
      barterDiscountAmount: barterAmount,
      flashDealAmount: 0,
      loyaltyDiscountAmount: 0,
      masterDiscountAmount: 0,
      totalRequestedDiscount: barterAmount,
      maxAllowedDiscount,
      effectiveTotalDiscount: barterAmount,
      finalTotal: Math.max(0, input.originalTotal - barterAmount),
    };
  }

  const flashDealAmount = input.flashDealPct > 0
    ? Math.round(input.subTotal * input.flashDealPct / 100)
    : 0;
  const loyaltyDiscountAmount = Math.round(input.subTotal * input.loyaltyPct / 100);
  const masterDiscountAmount = Math.round(input.subTotal * Math.min(input.masterDiscountPct, 50) / 100);

  const requestedDynamicDiscount = input.totalServicesPrice - input.adjustedServicesPrice;
  const totalRequestedDiscount =
    requestedDynamicDiscount + loyaltyDiscountAmount + flashDealAmount + masterDiscountAmount;

  const effectiveTotalDiscount =
    totalRequestedDiscount > 0
      ? Math.min(maxAllowedDiscount, totalRequestedDiscount)
      : totalRequestedDiscount;

  const finalTotal = Math.max(0, input.originalTotal - effectiveTotalDiscount);

  return {
    barterDiscountAmount: 0,
    flashDealAmount,
    loyaltyDiscountAmount,
    masterDiscountAmount,
    totalRequestedDiscount,
    maxAllowedDiscount,
    effectiveTotalDiscount,
    finalTotal,
  };
}

function totalFor(t: DiscountInput): number {
  return t.totalServicesPrice + t.totalProductsPrice;
}

describe('computeBookingPrice — discount math', () => {
  it('no discounts: returns original total', () => {
    const r = resolvePricing({
      totalServicesPrice: 1000, totalProductsPrice: 200, originalTotal: 1200,
      barterDiscountPct: 0, adjustedServicesPrice: 1000,
      flashDealPct: 0, loyaltyPct: 0, masterDiscountPct: 0,
      subTotal: 1200,
    });
    expect(r.effectiveTotalDiscount).toBe(0);
    expect(r.finalTotal).toBe(1200);
  });

  it('barter discount overrides all other discounts', () => {
    const r = resolvePricing({
      totalServicesPrice: 1000, totalProductsPrice: 0, originalTotal: 1000,
      barterDiscountPct: 50, adjustedServicesPrice: 1000,
      flashDealPct: 20, loyaltyPct: 10, masterDiscountPct: 10,
      subTotal: 1000,
    });
    expect(r.barterDiscountAmount).toBe(500);
    expect(r.flashDealAmount).toBe(0);
    expect(r.finalTotal).toBe(500);
  });

  it('stacking: dynamic + loyalty + flash + master discount capped at 40%', () => {
    const r = resolvePricing({
      totalServicesPrice: 1000, totalProductsPrice: 0, originalTotal: 1000,
      barterDiscountPct: 0, adjustedServicesPrice: 700,
      flashDealPct: 20, loyaltyPct: 15, masterDiscountPct: 15,
      subTotal: 700,
    });
    // dynamic discount = 300, loyalty = 105, flash = 140, master = 105
    // total = 650, cap = 400
    expect(r.effectiveTotalDiscount).toBe(400);
    expect(r.finalTotal).toBe(600);
  });

  it('stacking under 40% cap: passes through full discount', () => {
    const r = resolvePricing({
      totalServicesPrice: 1000, totalProductsPrice: 0, originalTotal: 1000,
      barterDiscountPct: 0, adjustedServicesPrice: 950,
      flashDealPct: 5, loyaltyPct: 5, masterDiscountPct: 5,
      subTotal: 950,
    });
    // dynamic=50, loyalty=47.5→48, flash=47.5→48, master=47.5→48, total=194
    expect(r.effectiveTotalDiscount).toBe(194);
    expect(r.finalTotal).toBe(806);
  });

  it('master discount capped at 50% before stacking', () => {
    const r = resolvePricing({
      totalServicesPrice: 1000, totalProductsPrice: 0, originalTotal: 1000,
      barterDiscountPct: 0, adjustedServicesPrice: 1000,
      flashDealPct: 0, loyaltyPct: 0, masterDiscountPct: 70,
      subTotal: 1000,
    });
    // masterDiscountAmount = round(1000 * min(70,50) / 100) = 500
    // totalRequestedDiscount = 0 + 0 + 0 + 500 = 500
    // maxAllowedDiscount = floor(1000 * 0.40) = 400
    // effective = min(400, 500) = 400
    expect(r.masterDiscountAmount).toBe(500);
    expect(r.effectiveTotalDiscount).toBe(400);
    expect(r.finalTotal).toBe(600);
  });

  it('negative dynamic pricing (markup) increases total, discount only applies to positive discounts', () => {
    const r = resolvePricing({
      totalServicesPrice: 1000, totalProductsPrice: 0, originalTotal: 1000,
      barterDiscountPct: 0, adjustedServicesPrice: 1200,
      flashDealPct: 10, loyaltyPct: 0, masterDiscountPct: 0,
      subTotal: 1200,
    });
    // dynamic = -200 (markup, negative), flash = 120
    // total = -200 + 120 = -80 → negative → effective = total (no cap needed since < 0)
    expect(r.effectiveTotalDiscount).toBe(-80);
    expect(r.finalTotal).toBe(1080);
  });

  it('final total never goes below 0', () => {
    const r = resolvePricing({
      totalServicesPrice: 500, totalProductsPrice: 0, originalTotal: 500,
      barterDiscountPct: 0, adjustedServicesPrice: 500,
      flashDealPct: 0, loyaltyPct: 0, masterDiscountPct: 100,
      subTotal: 500,
    });
    expect(r.finalTotal).toBeGreaterThanOrEqual(0);
  });

  it('handles products + services combined', () => {
    const r = resolvePricing({
      totalServicesPrice: 800, totalProductsPrice: 400, originalTotal: 1200,
      barterDiscountPct: 0, adjustedServicesPrice: 800,
      flashDealPct: 10, loyaltyPct: 5, masterDiscountPct: 0,
      subTotal: 1200,
    });
    // dynamic=0, flash=120, loyalty=60, master=0 → total=180
    // maxAllowedDiscount = floor(1200 * 0.40) = 480
    // effective = 180
    expect(r.effectiveTotalDiscount).toBe(180);
    expect(r.finalTotal).toBe(1020);
  });
});
