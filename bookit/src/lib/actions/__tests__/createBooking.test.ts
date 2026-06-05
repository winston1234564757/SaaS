import { describe, it, expect } from 'vitest';

// ── Discount Resolution Engine (з createBooking.ts 7.6) ────────────

interface DiscountInput {
  totalServicesPrice: number;
  totalProductsPrice: number;
  adjustedServicesPrice: number; // після dynamic pricing
  loyaltyDiscountPercent: number;
  flashDealDiscountPct: number;
  phoneDiscountPct: number;
  c2cFriendDiscountPct: number;
  c2cBonusActual: number;       // % від preFinalTotal
  barterDiscountPct: number;
}

interface DiscountResult {
  originalTotal: number;
  dynamicMarkup: number;
  dynamicDiscount: number;
  maxAllowedDiscount: number;
  effectiveDiscount: number;
  preFinalTotal: number;
  c2cFriendAmount: number;
  c2cBonusAmount: number;
  finalTotal: number;
  finalBarterAmount: number;
  /** true = barter override applied */
  barterApplied: boolean;
}

function resolveDiscounts(input: DiscountInput): DiscountResult {
  const {
    totalServicesPrice, totalProductsPrice, adjustedServicesPrice,
    loyaltyDiscountPercent, flashDealDiscountPct, phoneDiscountPct,
    c2cFriendDiscountPct, c2cBonusActual, barterDiscountPct,
  } = input;

  const originalTotal = totalServicesPrice + totalProductsPrice;
  const maxAllowedDiscount = Math.floor(originalTotal * 0.40);

  const dynamicMarkup   = Math.max(0, adjustedServicesPrice - totalServicesPrice);
  const dynamicDiscount = Math.max(0, totalServicesPrice - adjustedServicesPrice);

  const loyaltyDiscountAmount = Math.round(originalTotal * loyaltyDiscountPercent / 100);
  const flashDealAmount       = flashDealDiscountPct > 0
    ? Math.round(originalTotal * flashDealDiscountPct / 100) : 0;
  const phoneDiscountAmount   = phoneDiscountPct > 0
    ? Math.round(originalTotal * phoneDiscountPct / 100) : 0;
  const c2cFriendAmount = c2cFriendDiscountPct > 0
    ? Math.round(originalTotal * c2cFriendDiscountPct / 100) : 0;

  const totalDiscounts    = dynamicDiscount + loyaltyDiscountAmount + flashDealAmount + phoneDiscountAmount;
  const effectiveDiscount = Math.min(maxAllowedDiscount, totalDiscounts);

  const preFinalTotal = Math.max(0, originalTotal + dynamicMarkup - effectiveDiscount);
  const c2cBonusAmount = c2cBonusActual > 0
    ? Math.round(preFinalTotal * c2cBonusActual / 100) : 0;

  let finalTotal = Math.max(0, preFinalTotal - c2cFriendAmount - c2cBonusAmount);

  let finalBarterAmount = 0;
  if (barterDiscountPct > 0) {
    finalBarterAmount = Math.round(originalTotal * barterDiscountPct / 100);
    finalTotal = Math.max(0, originalTotal - finalBarterAmount);
  }

  return {
    originalTotal, dynamicMarkup, dynamicDiscount, maxAllowedDiscount,
    effectiveDiscount, preFinalTotal, c2cFriendAmount, c2cBonusAmount,
    finalTotal, finalBarterAmount,
    barterApplied: barterDiscountPct > 0,
  };
}

// ── Базові сценарії ────────────────────────────────────────────────

describe('resolveDiscounts — базові', () => {
  it('без послуг і товарів → 0', () => {
    const r = resolveDiscounts({
      totalServicesPrice: 0, totalProductsPrice: 0, adjustedServicesPrice: 0,
      loyaltyDiscountPercent: 0, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 0, c2cBonusActual: 0, barterDiscountPct: 0,
    });
    expect(r.originalTotal).toBe(0);
    expect(r.finalTotal).toBe(0);
  });

  it('тільки послуги, без знижок → повна ціна', () => {
    const r = resolveDiscounts({
      totalServicesPrice: 1000, totalProductsPrice: 0, adjustedServicesPrice: 1000,
      loyaltyDiscountPercent: 0, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 0, c2cBonusActual: 0, barterDiscountPct: 0,
    });
    expect(r.finalTotal).toBe(1000);
  });

  it('послуги + товар → сума', () => {
    const r = resolveDiscounts({
      totalServicesPrice: 800, totalProductsPrice: 200, adjustedServicesPrice: 800,
      loyaltyDiscountPercent: 0, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 0, c2cBonusActual: 0, barterDiscountPct: 0,
    });
    expect(r.originalTotal).toBe(1000);
    expect(r.finalTotal).toBe(1000);
  });
});

// ── Dynamic Pricing: Markup vs Discount ────────────────────────────

describe('resolveDiscounts — dynamic pricing', () => {
  it('Peak markup (+20%) → dynamicMarkup=200, dynamicDiscount=0', () => {
    const r = resolveDiscounts({
      totalServicesPrice: 1000, totalProductsPrice: 0, adjustedServicesPrice: 1200,
      loyaltyDiscountPercent: 0, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 0, c2cBonusActual: 0, barterDiscountPct: 0,
    });
    expect(r.dynamicMarkup).toBe(200);
    expect(r.dynamicDiscount).toBe(0);
    expect(r.finalTotal).toBe(1200); // markup додається зверху
  });

  it('Quiet discount (-15%) → dynamicMarkup=0, dynamicDiscount=150', () => {
    const r = resolveDiscounts({
      totalServicesPrice: 1000, totalProductsPrice: 0, adjustedServicesPrice: 850,
      loyaltyDiscountPercent: 0, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 0, c2cBonusActual: 0, barterDiscountPct: 0,
    });
    expect(r.dynamicMarkup).toBe(0);
    expect(r.dynamicDiscount).toBe(150);
    expect(r.finalTotal).toBe(850);
  });

  it('Markup НЕ компенсується знижками — додається зверху', () => {
    // Peak +20% = 1200, loyalty 10% від original 1000 = 100
    // effectiveDiscount = min(400, 100) = 100
    // preFinalTotal = 1000 + 200 - 100 = 1100
    const r = resolveDiscounts({
      totalServicesPrice: 1000, totalProductsPrice: 0, adjustedServicesPrice: 1200,
      loyaltyDiscountPercent: 10, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 0, c2cBonusActual: 0, barterDiscountPct: 0,
    });
    expect(r.finalTotal).toBe(1100);
  });
});

// ── 40% Safety Cap ─────────────────────────────────────────────────

describe('resolveDiscounts — 40% cap', () => {
  it('loyalty 50% → capped at 40% (400)', () => {
    const r = resolveDiscounts({
      totalServicesPrice: 1000, totalProductsPrice: 0, adjustedServicesPrice: 1000,
      loyaltyDiscountPercent: 50, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 0, c2cBonusActual: 0, barterDiscountPct: 0,
    });
    expect(r.maxAllowedDiscount).toBe(400);
    expect(r.effectiveDiscount).toBe(400);
    expect(r.finalTotal).toBe(600);
  });

  it('loyalty + flash + phone > 40% → cap 40%', () => {
    // totalDiscounts = 0 + 200 + 200 + 200 = 600
    // effectiveDiscount = min(400, 600) = 400
    const r = resolveDiscounts({
      totalServicesPrice: 1000, totalProductsPrice: 0, adjustedServicesPrice: 1000,
      loyaltyDiscountPercent: 20, flashDealDiscountPct: 20, phoneDiscountPct: 20,
      c2cFriendDiscountPct: 0, c2cBonusActual: 0, barterDiscountPct: 0,
    });
    expect(r.effectiveDiscount).toBe(400);
    expect(r.finalTotal).toBe(600);
  });

  it('C2C friend discount поверх 40% cap — не входить в обмеження', () => {
    // cap 400, але C2C -100 йде поверх
    const r = resolveDiscounts({
      totalServicesPrice: 1000, totalProductsPrice: 0, adjustedServicesPrice: 1000,
      loyaltyDiscountPercent: 50, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 10, c2cBonusActual: 0, barterDiscountPct: 0,
    });
    expect(r.effectiveDiscount).toBe(400);
    expect(r.c2cFriendAmount).toBe(100);
    expect(r.finalTotal).toBe(500); // 1000 - 400 - 100
  });
});

// ── Stacking порядок ───────────────────────────────────────────────

describe('resolveDiscounts — stacking order', () => {
  it('C2C bonus рахується від preFinalTotal (після friend discount)', () => {
    // 1000 - 400(cap) - 100(friend) = 500 (preFinalTotal без c2cBonus)
    // preFinalTotal для bonus = 1000 + 0 - 400 = 600
    // c2cBonusAmount = 600 * 20% = 120
    // final = 600 - 100 - 120 = 380
    const r = resolveDiscounts({
      totalServicesPrice: 1000, totalProductsPrice: 0, adjustedServicesPrice: 1000,
      loyaltyDiscountPercent: 50, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 10, c2cBonusActual: 20, barterDiscountPct: 0,
    });
    expect(r.preFinalTotal).toBe(600);
    expect(r.c2cFriendAmount).toBe(100);
    expect(r.c2cBonusAmount).toBe(120);
    expect(r.finalTotal).toBe(380);
  });

  it('Barter override — заміняє всю попередню калькуляцію', () => {
    // barter 30% від originalTotal = 300
    // final = 1000 - 300 = 700 (всі інші знижки ігноруються)
    const r = resolveDiscounts({
      totalServicesPrice: 1000, totalProductsPrice: 0, adjustedServicesPrice: 1000,
      loyaltyDiscountPercent: 50, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 10, c2cBonusActual: 20, barterDiscountPct: 30,
    });
    expect(r.barterApplied).toBe(true);
    expect(r.finalTotal).toBe(700);
    expect(r.finalBarterAmount).toBe(300);
  });
});

// ── Крайові випадки ────────────────────────────────────────────────

describe('resolveDiscounts — edge cases', () => {
  it('знижка більша за total → 0', () => {
    const r = resolveDiscounts({
      totalServicesPrice: 100, totalProductsPrice: 0, adjustedServicesPrice: 100,
      loyaltyDiscountPercent: 0, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 0, c2cBonusActual: 120, barterDiscountPct: 0,
    });
    expect(r.finalTotal).toBe(0);
  });

  it('flashDeal 0% → 0 amount', () => {
    const r = resolveDiscounts({
      totalServicesPrice: 1000, totalProductsPrice: 0, adjustedServicesPrice: 1000,
      loyaltyDiscountPercent: 0, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 0, c2cBonusActual: 0, barterDiscountPct: 0,
    });
    expect(r.finalTotal).toBe(1000);
  });

  it('тільки товари, без послуг — dynamic pricing не впливає (adjusted === total)', () => {
    const r = resolveDiscounts({
      totalServicesPrice: 0, totalProductsPrice: 500, adjustedServicesPrice: 0,
      loyaltyDiscountPercent: 10, flashDealDiscountPct: 0, phoneDiscountPct: 0,
      c2cFriendDiscountPct: 0, c2cBonusActual: 0, barterDiscountPct: 0,
    });
    expect(r.dynamicMarkup).toBe(0);
    expect(r.dynamicDiscount).toBe(0);
    expect(r.finalTotal).toBe(450);
  });
});

// ── bookingClientSchema ────────────────────────────────────────────

import { z } from 'zod';

const bookingClientSchema = z.object({
  clientName: z
    .string()
    .min(2, "Введіть ім'я (мінімум 2 символи)")
    .regex(/^[А-Яа-яІіЇїЄєҐґ\s'-]+$/, "Ім'я повинно містити лише кирилицю"),
  clientPhone: z
    .string()
    .min(1, "Введіть номер телефону")
    .transform((val) => {
      let digits = val.replace(/\D/g, '');
      if (digits.length === 10 && digits.startsWith('0')) {
        digits = '38' + digits;
      } else if (digits.length === 11 && digits.startsWith('80')) {
        digits = '3' + digits;
      }
      const normalized = digits.startsWith('+') ? digits : '+' + digits;
      return normalized;
    })
    .refine((val) => /^\+380\d{9}$/.test(val), {
      message: 'Невірний формат телефону (очікується +380...)',
    }),
});

describe('bookingClientSchema — clientName', () => {
  it('кирилиця 2+ символи → проходить', () => {
    const r = bookingClientSchema.safeParse({ clientName: 'Анна', clientPhone: '+380501234567' });
    expect(r.success).toBe(true);
  });

  it('латиниця → reject', () => {
    const r = bookingClientSchema.safeParse({ clientName: 'Anna', clientPhone: '+380501234567' });
    expect(r.success).toBe(false);
  });

  it('1 символ → reject (min 2)', () => {
    const r = bookingClientSchema.safeParse({ clientName: 'А', clientPhone: '+380501234567' });
    expect(r.success).toBe(false);
  });
});

describe('bookingClientSchema — clientPhone transform', () => {
  it('+380501234567 → проходить, + залишається', () => {
    const r = bookingClientSchema.safeParse({ clientName: 'Анна', clientPhone: '+380501234567' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.clientPhone).toBe('+380501234567');
  });

  it('0501234567 (0+9) → transform → +380501234567', () => {
    const r = bookingClientSchema.safeParse({ clientName: 'Анна', clientPhone: '0501234567' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.clientPhone).toBe('+380501234567');
  });

  it('80501234567 (80+9) → transform → +380501234567', () => {
    const r = bookingClientSchema.safeParse({ clientName: 'Анна', clientPhone: '80501234567' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.clientPhone).toBe('+380501234567');
  });

  it('+38(050)123-45-67 → очищає не-digits → +380501234567', () => {
    const r = bookingClientSchema.safeParse({ clientName: 'Анна', clientPhone: '+38(050)123-45-67' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.clientPhone).toBe('+380501234567');
  });

  it('380501234567 (без +) → додає + → +380501234567', () => {
    const r = bookingClientSchema.safeParse({ clientName: 'Анна', clientPhone: '380501234567' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.clientPhone).toBe('+380501234567');
  });

  it('закордонний номер → refine reject (не +380...)', () => {
    const r = bookingClientSchema.safeParse({ clientName: 'Анна', clientPhone: '+48123456789' });
    expect(r.success).toBe(false);
  });

  it('порожній → reject', () => {
    const r = bookingClientSchema.safeParse({ clientName: 'Анна', clientPhone: '' });
    expect(r.success).toBe(false);
  });
});

describe('bookingClientSchema — combined', () => {
  it('повністю валідний', () => {
    const r = bookingClientSchema.safeParse({
      clientName: 'Марія-Анна',
      clientPhone: '+380501234567',
    });
    expect(r.success).toBe(true);
  });
});
