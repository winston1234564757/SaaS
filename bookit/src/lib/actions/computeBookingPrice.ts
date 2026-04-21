'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { applyDynamicPricing, type PricingRules } from '@/lib/utils/dynamicPricing';

export interface ComputePriceInput {
  masterId: string;
  serviceIds: string[];
  productLines: Array<{ id: string; quantity: number }>;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  applyDynamic: boolean;
  flashDealId?: string | null;
  loyaltyPercent?: number;
  masterDiscountPercent?: number;
  durationOverrideMinutes?: number | null;
}

export interface ComputePriceResult {
  totalDuration: number;
  effectiveDuration: number;
  totalServicesPrice: number;
  totalProductsPrice: number;
  originalTotal: number;
  adjustedServicesPrice: number;
  finalTotal: number;
  dynamicLabel: string | null;
  dynamicModifier: number;
  loyaltyDiscountAmount: number;
  flashDealAmount: number;
  masterDiscountAmount: number;
}

export async function computeBookingPrice(
  input: ComputePriceInput,
): Promise<ComputePriceResult> {
  const admin = createAdminClient();

  const [{ data: mp }, { data: dbServices }, { data: dbProducts }] = await Promise.all([
    admin
      .from('master_profiles')
      .select('subscription_tier, pricing_rules, dynamic_pricing_extra_earned, timezone')
      .eq('id', input.masterId)
      .single(),
    admin
      .from('services')
      .select('id, price, duration_minutes')
      .in('id', input.serviceIds)
      .eq('master_id', input.masterId),
    input.productLines.length > 0
      ? admin
          .from('products')
          .select('id, price')
          .in('id', input.productLines.map(p => p.id))
          .eq('master_id', input.masterId)
      : Promise.resolve({ data: [] as Array<{ id: string; price: number }> }),
  ]);

  const masterTimezone = (mp as { timezone?: string } | null)?.timezone ?? 'Europe/Kyiv';

  const totalServicesPrice = (dbServices ?? []).reduce((s, svc) => s + Number(svc.price), 0);
  const totalDuration = (dbServices ?? []).reduce((s, svc) => s + svc.duration_minutes, 0);
  const effectiveDuration = input.durationOverrideMinutes ?? totalDuration;

  const totalProductsPrice = input.productLines.reduce((sum, line) => {
    const p = (dbProducts ?? []).find(d => d.id === line.id);
    return sum + (p ? Number(p.price) * line.quantity : 0);
  }, 0);

  const originalTotal = totalServicesPrice + totalProductsPrice;

  // Dynamic pricing — runs server-side only
  const TRIAL_LIMIT_KOP = 100_000;
  const extraEarned = (mp?.dynamic_pricing_extra_earned as number) ?? 0;
  const trialExhausted = mp?.subscription_tier === 'starter' && extraEarned >= TRIAL_LIMIT_KOP;
  const pricingRules = (!trialExhausted ? mp?.pricing_rules : null) as PricingRules | null;

  let dynamicResult = null;
  if (input.applyDynamic && pricingRules && Object.keys(pricingRules).length > 0) {
    dynamicResult = applyDynamicPricing(
      totalServicesPrice,
      pricingRules,
      new Date(input.date + 'T00:00:00'),
      input.time,
      masterTimezone,
    );
  }

  const adjustedServicesPrice = dynamicResult?.adjustedPrice ?? totalServicesPrice;
  const subTotal = adjustedServicesPrice + totalProductsPrice;

  // Flash deal — verify from DB
  let flashDealAmount = 0;
  if (input.flashDealId) {
    const { data: deal } = await admin
      .from('flash_deals')
      .select('discount_pct, status, master_id')
      .eq('id', input.flashDealId)
      .single();
    if (deal && deal.status === 'active' && deal.master_id === input.masterId) {
      flashDealAmount = Math.round(subTotal * Number(deal.discount_pct) / 100);
    }
  }

  // Loyalty / master discount
  const loyaltyDiscountAmount = Math.round(subTotal * (input.loyaltyPercent ?? 0) / 100);
  const masterDiscountAmount = Math.round(subTotal * Math.min(input.masterDiscountPercent ?? 0, 50) / 100);

  // Discount stacking + 40% safety cap
  const requestedDynamicDiscount = totalServicesPrice - adjustedServicesPrice;
  const totalRequestedDiscount =
    requestedDynamicDiscount + loyaltyDiscountAmount + flashDealAmount + masterDiscountAmount;
  const maxAllowedDiscount = Math.floor(originalTotal * 0.40);

  const effectiveTotalDiscount =
    totalRequestedDiscount > 0
      ? Math.min(maxAllowedDiscount, totalRequestedDiscount)
      : totalRequestedDiscount;

  const finalTotal = Math.max(0, originalTotal - effectiveTotalDiscount);

  return {
    totalDuration,
    effectiveDuration,
    totalServicesPrice,
    totalProductsPrice,
    originalTotal,
    adjustedServicesPrice,
    finalTotal,
    dynamicLabel: dynamicResult?.label ?? null,
    dynamicModifier: dynamicResult?.modifier ?? 0,
    loyaltyDiscountAmount,
    flashDealAmount,
    masterDiscountAmount,
  };
}
