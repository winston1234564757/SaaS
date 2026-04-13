// src/components/shared/wizard/useBookingPricing.ts
import { useMemo } from 'react';
import { applyDynamicPricing } from '@/lib/utils/dynamicPricing';
import type { WizardService, WizardProduct, CartItem } from './types';

interface UseBookingPricingParams {
  selectedServices: WizardService[];
  cart: CartItem[];
  durationOverride: number | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  pricingRules?: Record<string, unknown>;
  useDynamicPrice: boolean;
  loyaltyDiscount: { name: string; percent: number } | null;
  flashDeal?: { id: string; discountPct: number; serviceName: string } | null;
  discountPercent: number;
}

export function useBookingPricing({
  selectedServices,
  cart,
  durationOverride,
  selectedDate,
  selectedTime,
  pricingRules,
  useDynamicPrice,
  loyaltyDiscount,
  flashDeal,
  discountPercent,
}: UseBookingPricingParams) {
  const totalDuration = useMemo(
    () => selectedServices.reduce((s, sv) => s + sv.duration, 0),
    [selectedServices]
  );
  const effectiveDuration = durationOverride ?? totalDuration;

  const totalServicesPrice = useMemo(
    () => selectedServices.reduce((s, sv) => s + sv.price, 0),
    [selectedServices]
  );

  const dynamicPricing = useMemo(() => {
    if (!selectedDate || !selectedTime || !pricingRules) return null;
    return applyDynamicPricing(
      totalServicesPrice,
      pricingRules as Record<string, unknown>,
      selectedDate,
      selectedTime
    );
  }, [totalServicesPrice, pricingRules, selectedDate, selectedTime]);

  // Якщо майстер вимкнув toggle — використовуємо базову ціну
  const effectiveServicesPrice =
    dynamicPricing &&
    dynamicPricing.adjustedPrice !== totalServicesPrice &&
    useDynamicPrice
      ? dynamicPricing.adjustedPrice
      : totalServicesPrice;

  const totalProductsPrice = useMemo(
    () => cart.reduce((s, ci) => s + ci.product.price * ci.quantity, 0),
    [cart]
  );

  const grandTotal = effectiveServicesPrice + totalProductsPrice;

  const rawLoyaltyDiscount = loyaltyDiscount
    ? Math.round(grandTotal * loyaltyDiscount.percent / 100)
    : 0;
  const rawFlashDiscount = flashDeal
    ? Math.round(grandTotal * flashDeal.discountPct / 100)
    : 0;
  const rawMasterDiscount = Math.round(grandTotal * discountPercent / 100);

  // ── Comprehensive Discount Resolution & Safety Cap (40%) ─────────────────
  const originalTotal = totalServicesPrice + totalProductsPrice;
  const maxAllowedDiscount = Math.floor(originalTotal * 0.40);

  // Total discount requested relative to the Original Total price
  const requestedDynamicDiscount = dynamicPricing
    ? totalServicesPrice - dynamicPricing.adjustedPrice
    : 0;
  const totalRequestedDiscountSum =
    (useDynamicPrice ? requestedDynamicDiscount : 0) +
    rawLoyaltyDiscount +
    rawFlashDiscount +
    rawMasterDiscount;

  // If we are giving a net discount (not a net markup), we must cap it.
  const effectiveTotalDiscount =
    totalRequestedDiscountSum > 0
      ? Math.min(maxAllowedDiscount, totalRequestedDiscountSum)
      : totalRequestedDiscountSum; // don't cap markups (peak hours)

  const finalTotal = Math.max(0, originalTotal - effectiveTotalDiscount);

  // Breakdown for summary display (approximate proportional split for visual aid)
  const loyaltyDiscountAmount =
    totalRequestedDiscountSum > 0
      ? Math.round(effectiveTotalDiscount * (rawLoyaltyDiscount / totalRequestedDiscountSum))
      : 0;
  const masterDiscountAmount =
    totalRequestedDiscountSum > 0
      ? Math.round(effectiveTotalDiscount * (rawMasterDiscount / totalRequestedDiscountSum))
      : 0;
  const flashDealAmount =
    totalRequestedDiscountSum > 0
      ? Math.round(effectiveTotalDiscount * (rawFlashDiscount / totalRequestedDiscountSum))
      : 0;

  return {
    totalDuration,
    effectiveDuration,
    totalServicesPrice,
    dynamicPricing,
    effectiveServicesPrice,
    totalProductsPrice,
    grandTotal,
    originalTotal,
    finalTotal,
    loyaltyDiscountAmount,
    masterDiscountAmount,
    flashDealAmount,
  };
}
