// src/components/shared/wizard/useBookingPricing.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { computeBookingPrice } from '@/lib/actions/computeBookingPrice';
import type { WizardService, CartItem } from './types';

interface UseBookingPricingParams {
  masterId: string;
  selectedServices: WizardService[];
  cart: CartItem[];
  durationOverride: number | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  useDynamicPrice: boolean;
  loyaltyDiscount: { name: string; percent: number } | null;
  flashDeal?: { id: string; discountPct: number; serviceName: string } | null;
  discountPercent: number;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useBookingPricing({
  masterId,
  selectedServices,
  cart,
  durationOverride,
  selectedDate,
  selectedTime,
  useDynamicPrice,
  loyaltyDiscount,
  flashDeal,
  discountPercent,
}: UseBookingPricingParams) {
  // Duration is not a price — fine to compute locally for slot filtering
  const totalDuration = useMemo(
    () => selectedServices.reduce((s, sv) => s + sv.duration, 0),
    [selectedServices],
  );

  const serviceIds = useMemo(() => selectedServices.map(s => s.id), [selectedServices]);
  const productLines = useMemo(
    () => cart.map(ci => ({ id: ci.product.id, quantity: ci.quantity })),
    [cart],
  );

  const dateStr = selectedDate ? toYMD(selectedDate) : null;

  const enabled =
    !!masterId && serviceIds.length > 0 && !!dateStr && !!selectedTime;

  const { data, isPending } = useQuery({
    queryKey: [
      'booking-price',
      masterId,
      serviceIds,
      productLines,
      dateStr,
      selectedTime,
      useDynamicPrice,
      flashDeal?.id ?? null,
      loyaltyDiscount?.percent ?? 0,
      discountPercent,
      durationOverride,
    ],
    queryFn: () =>
      computeBookingPrice({
        masterId,
        serviceIds,
        productLines,
        date: dateStr!,
        time: selectedTime!,
        applyDynamic: useDynamicPrice,
        flashDealId: flashDeal?.id ?? null,
        loyaltyPercent: loyaltyDiscount?.percent ?? 0,
        masterDiscountPercent: discountPercent,
        durationOverrideMinutes: durationOverride,
      }),
    enabled,
    staleTime: 30_000,
  });

  // Fallback values while server is computing (show base prices, no discount)
  const totalServicesPrice = data?.totalServicesPrice
    ?? selectedServices.reduce((s, sv) => s + sv.price, 0);
  const totalProductsPrice = data?.totalProductsPrice
    ?? cart.reduce((s, ci) => s + ci.product.price * ci.quantity, 0);

  const effectiveDuration = data?.effectiveDuration ?? (durationOverride ?? totalDuration);
  const originalTotal = data?.originalTotal ?? (totalServicesPrice + totalProductsPrice);
  const finalTotal = data?.finalTotal ?? originalTotal;
  const adjustedServicesPrice = data?.adjustedServicesPrice ?? totalServicesPrice;

  // Re-shape dynamic pricing for DateTimePicker compatibility
  const dynamicPricing =
    data && data.dynamicModifier !== 0
      ? {
          label: data.dynamicLabel,
          modifier: data.dynamicModifier,
          adjustedPrice: data.adjustedServicesPrice,
        }
      : null;

  return {
    totalDuration,
    effectiveDuration,
    totalServicesPrice,
    totalProductsPrice,
    dynamicPricing,
    effectiveServicesPrice: adjustedServicesPrice,
    grandTotal: originalTotal,
    originalTotal,
    finalTotal,
    loyaltyDiscountAmount: data?.loyaltyDiscountAmount ?? 0,
    masterDiscountAmount: data?.masterDiscountAmount ?? 0,
    flashDealAmount: data?.flashDealAmount ?? 0,
    isPricePending: isPending && enabled,
  };
}
