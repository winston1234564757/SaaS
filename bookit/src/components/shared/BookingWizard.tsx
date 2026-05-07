'use client';

/**
 * BookingWizard — unified 4-step booking flow.
 *
 * Steps: services → datetime → products* → details → success
 * (* products step skipped when master has no in-stock products)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useBookingScheduleData } from './wizard/useBookingScheduleData';
import { useBookingPricing } from './wizard/useBookingPricing';
import { useBookingWizardState } from './wizard/useBookingWizardState';
import { ServiceSelector } from './wizard/ServiceSelector';
import { DateTimePicker } from './wizard/DateTimePicker';
import { ProductCart } from './wizard/ProductCart';
import { ClientDetails } from './wizard/ClientDetails';
import { BookingSuccess } from './wizard/BookingSuccess';
import { X, ChevronLeft, Loader2 } from 'lucide-react';
import { createBooking } from '@/lib/actions/createBooking';
import { createPublicOrder } from '@/app/[slug]/actions';
import { UpgradePromptModal } from '@/components/shared/UpgradePromptModal';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getActivePhoneDiscount } from '@/app/(master)/dashboard/marketing/actions';
import type { WizardService, WizardProduct, BookingWizardProps } from './wizard/types';
import { toISO, STEP_TITLE } from './wizard/helpers';
import { StepProgress } from './wizard/StepProgress';

// ── Re-exports (backward compat for consumers that import from BookingWizard) ─
export type { WizardService, WizardProduct, BookingWizardProps } from './wizard/types';

// ── Main component ────────────────────────────────────────────────────────────

export function BookingWizard({
  isOpen, onClose, masterId, masterName = '', workingHours,
  services, products = [], initialServices,
  mode, bookingsThisMonth = 0, subscriptionTier = 'starter', pricingRules,
  onSuccess, flashDeal, initialStep,
  c2cRefCode = null, c2cDiscountPct = null,
  masterC2cEnabled = false, masterC2cDiscountPct = null,
}: BookingWizardProps) {

  const isFlashFastTrack = !!(flashDeal?.slotDate && flashDeal?.slotTime);

  const {
    step, direction, go, goBack, hasProducts, availableProducts,
    selectedServices, cart,
    selectedDate, setSelectedDate, selectedDateRef,
    selectedTime, setSelectedTime,
    clientPhone,
    clientEmail, clientNotes, setClientNotes,
    discountPercent, setDiscountPercent,
    durationOverride, setDurationOverride,
    useDynamicPrice, setUseDynamicPrice,
    clientUserId, selectedClientId, setSelectedClientId,
    createdBookingId, setCreatedBookingId,
    clientHistoryTimes, loyaltyDiscount, partners,
    c2cReferrerBalance, c2cBonusToUse, setC2cBonusToUse,
    activeC2cDiscountPct, c2cAlreadyUsed,
    saving, setSaving, saveError, setSaveError, upgradePromptOpen, setUpgradePromptOpen,
    suggestedProductIds,
    register, errors, trigger, watchName, watchPhone, setValue,
    addToCart, removeFromCart, cartQty, toggleService,
  } = useBookingWizardState({
    isOpen, masterId, mode, initialServices, products, onClose,
    initialStep,
    initialDate: flashDeal?.slotDate,
    initialTime: flashDeal?.slotTime,
    isFlashFastTrack,
    c2cRefCode,
    c2cDiscountPct,
  });

  const isAtLimit = mode === 'client' && subscriptionTier === 'starter' && bookingsThisMonth >= 30;

  // ── Pricing ───────────────────────────────────────────────────────────────────
  const {
    totalDuration, effectiveDuration,
    totalServicesPrice, dynamicPricing,
    totalProductsPrice, finalTotal,
    loyaltyDiscountAmount, masterDiscountAmount, flashDealAmount, barterDiscountAmount,
  } = useBookingPricing({
    masterId,
    clientId: clientUserId,
    selectedServices, cart, durationOverride,
    selectedDate, selectedTime,
    useDynamicPrice, loyaltyDiscount, flashDeal, discountPercent,
  });

  // ── Phone-bound broadcast discount ───────────────────────────────────────────
  const [phoneDiscountPct, setPhoneDiscountPct] = useState(0);
  const phoneDiscountTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (mode !== 'client' || watchPhone.length < 13) {
      setPhoneDiscountPct(0);
      return;
    }
    clearTimeout(phoneDiscountTimer.current);
    phoneDiscountTimer.current = setTimeout(async () => {
      const result = await getActivePhoneDiscount(watchPhone, masterId);
      if (!result) { setPhoneDiscountPct(0); return; }
      if (result.service_id) {
        const ids = selectedServices.map(s => s.id);
        if (!ids.includes(result.service_id)) { setPhoneDiscountPct(0); return; }
      }
      setPhoneDiscountPct(result.discount_percent);
    }, 400);
    return () => clearTimeout(phoneDiscountTimer.current);
  }, [watchPhone, masterId, mode, selectedServices]);

  const phoneDiscountAmount = phoneDiscountPct > 0
    ? Math.round(finalTotal * phoneDiscountPct / 100)
    : 0;

  // ── Schedule data ─────────────────────────────────────────────────────────────
  const {
    days, scheduleStore, scheduleLoading, scheduleError, refetchSchedule,
    offDayDates, selectedDayBreaks, slots, fullyBookedDates,
  } = useBookingScheduleData({
    masterId, isOpen, step, effectiveDuration,
    selectedDate, selectedDateRef,
    clientHistoryTimes, workingHours,
    setSelectedDate,
  });

  // ── Submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (saving) return; // double-submit guard

    const isValid = await trigger();
    if (!isValid) return;

    // ── Product-only path (no services selected) ──────────────────────────────
    if (selectedServices.length === 0 && cart.length > 0 && mode === 'client') {
      go('details', 1); // Go to details first to get name/phone
      return;
    }

    if (selectedServices.length > 0 && (!selectedDate || !selectedTime)) return;

    setSaving(true);
    setSaveError('');

    // If product-only
    if (selectedServices.length === 0 && cart.length > 0) {
      const res = await createPublicOrder({
        masterId,
        clientName: watchName.trim(),
        clientPhone: watchPhone.trim(),
        notes: clientNotes.trim() || null,
        items: cart.map(ci => ({ productId: ci.product.id, qty: ci.quantity })),
      });
      setSaving(false);
      if (res.error) { setSaveError(res.error); return; }
      setCreatedBookingId(res.id);
      go('success', 1);
      return;
    }

    const result = await createBooking({
      masterId,
      clientName:              watchName.trim(),
      clientPhone:             watchPhone.trim(),
      clientEmail:             mode === 'client' ? (clientEmail.trim().toLowerCase() || null) : null,
      clientId:                mode === 'client' ? (clientUserId || null) : (selectedClientId || null),
      date:                    toISO(selectedDate!),
      startTime:               selectedTime!,
      services:                selectedServices.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })),
      products:                cart.map(ci => ({ id: ci.product.id, name: ci.product.name, price: ci.product.price, quantity: ci.quantity })),
      notes:                   clientNotes.trim() || null,
      source:                  mode === 'client' ? 'online' : 'manual',
      discountPercent:         mode === 'client' ? (loyaltyDiscount?.percent ?? 0) : discountPercent,
      durationOverrideMinutes: mode === 'master' ? (durationOverride ?? undefined) : undefined,
      flashDealId:             mode === 'client' ? (flashDeal?.id ?? undefined) : undefined,
      applyDynamicPricing:     mode === 'master' ? useDynamicPrice : true,
      referral_code_used:      mode === 'client'
        ? (c2cRefCode ?? (typeof window !== 'undefined' ? localStorage.getItem('bookit_ref') ?? null : null))
        : null,
      c2c_discount_pct:        mode === 'client'
        ? (c2cRefCode
            ? c2cDiscountPct
            : (typeof window !== 'undefined' ? Number(localStorage.getItem('bookit_ref_pct')) || null : null))
        : null,
      c2c_bonus_to_use:        mode === 'client' && c2cBonusToUse > 0 ? c2cBonusToUse : null,
    });
    setSaving(false);
    if (result.error) {
      if (result.upgradeRequired && mode === 'master') {
        setUpgradePromptOpen(true);
      } else if (result.upgradeRequired && mode === 'client') {
        setSaveError('На жаль, запис до цього майстра тимчасово недоступний. Зверніться до майстра напряму.');
      } else {
        setSaveError(result.error);
        if (result.error.includes('вже заброньований')) {
          setSelectedTime(null);
          refetchSchedule();
          go('datetime', -1);
        }
      }
      return;
    }
    if (mode === 'client' && result.bookingId) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bookit_ref');
        localStorage.removeItem('bookit_ref_pct');
      }
      setCreatedBookingId(result.bookingId);
    }
    if (mode === 'master') { onSuccess?.(); onClose(); return; }
    go('success', 1);
  }

  const canSubmit = (watchName?.trim()?.length ?? 0) >= 2 && (watchPhone?.length ?? 0) >= 13
    && (selectedServices.length > 0 || cart.length > 0);

  const stepNumber = { services: 1, datetime: 2, products: 3, details: 4, success: 4 }[step];

  if (!isOpen) return null;

  return (
    <>
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={step !== 'success' ? masterName : ''}
      contentClassName="overflow-hidden pb-0"
    >
      <div className="flex flex-col h-[85vh] md:h-[600px] -mx-6 -mt-2">
        {/* Progress header */}
        {!isAtLimit && step !== 'success' && (
          <div className="flex items-center justify-center py-3 bg-primary/5 border-b border-primary/10 flex-shrink-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Крок {stepNumber} з 4</p>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {isAtLimit && step !== 'success' && (
            <div className="flex flex-col items-center text-center py-10 px-5 gap-4">
              <div className="w-16 h-16 rounded-3xl bg-warning/10 flex items-center justify-center text-3xl">🔒</div>
              <p className="text-base font-bold text-foreground">Ліміт записів вичерпано</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Майстер досяг ліміту 30 записів на місяць.<br />
                Нові записи будуть доступні з наступного місяця.
              </p>
              <button onClick={onClose}
                className="mt-4 px-8 py-4 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20">
                Зрозуміло
              </button>
            </div>
          )}

          {!isAtLimit && (
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              {step === 'services' && (
                <div key="services" className="h-full overflow-hidden px-5">
                  <ServiceSelector
                    services={services}
                    selectedServices={selectedServices}
                    onToggle={toggleService}
                    mode={mode}
                    partners={partners}
                    direction={direction}
                    durationOverride={durationOverride}
                    totalDuration={totalDuration}
                    effectiveDuration={effectiveDuration}
                    totalServicesPrice={totalServicesPrice}
                    hasProducts={hasProducts}
                    c2cDiscountPct={mode === 'client' ? activeC2cDiscountPct : null}
                    onDurationOverrideChange={(v) => { setDurationOverride(v); setSelectedTime(null); }}
                    onClearTime={() => setSelectedTime(null)}
                    onContinue={() => go('datetime', 1)}
                    onSkipToProducts={() => go('products', 1)}
                  />
                </div>
              )}

              {step === 'datetime' && (
                <div key="datetime" className="h-full overflow-hidden px-5">
                  <DateTimePicker
                    days={days}
                    scheduleStore={scheduleStore}
                    scheduleLoading={scheduleLoading}
                    scheduleError={scheduleError}
                    onRetry={() => refetchSchedule()}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    offDayDates={offDayDates}
                    fullyBookedDates={fullyBookedDates}
                    slots={slots}
                    selectedDayBreaks={selectedDayBreaks}
                    effectiveDuration={effectiveDuration}
                    totalServicesPrice={totalServicesPrice}
                    selectedServices={selectedServices}
                    dynamicPricing={dynamicPricing}
                    useDynamicPrice={useDynamicPrice}
                    mode={mode}
                    hasProducts={hasProducts}
                    direction={direction}
                    onDateSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
                    onTimeSelect={setSelectedTime}
                    onToggleDynamicPrice={() => setUseDynamicPrice(v => !v)}
                    onContinue={() => go(hasProducts ? 'products' : 'details', 1)}
                  />
                </div>
              )}

              {step === 'products' && (
                <div key="products" className="h-full overflow-hidden px-5">
                  <ProductCart
                    availableProducts={availableProducts}
                    suggestedProductIds={suggestedProductIds}
                    cart={cart}
                    totalProductsPrice={totalProductsPrice}
                    direction={direction}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                    cartQty={cartQty}
                    onContinue={() => go('details', 1)}
                  />
                </div>
              )}

              {step === 'details' && (
                <div key="details" className="h-full overflow-hidden px-5">
                  <ClientDetails
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    selectedServices={selectedServices}
                    mode={mode}
                    clientUserId={clientUserId}
                    register={register}
                    errors={errors}
                    watchName={watchName}
                    watchPhone={watchPhone}
                    setValue={setValue}
                    onClientSelect={mode === 'master'
                      ? (c) => setSelectedClientId(c?.client_id ?? null)
                      : undefined
                    }
                    clientNotes={clientNotes}
                    setClientNotes={setClientNotes}
                    discountPercent={discountPercent}
                    setDiscountPercent={setDiscountPercent}
                    masterDiscountAmount={masterDiscountAmount}
                    dynamicPricing={dynamicPricing}
                    useDynamicPrice={useDynamicPrice}
                    loyaltyDiscount={loyaltyDiscount}
                    loyaltyDiscountAmount={loyaltyDiscountAmount}
                    flashDeal={flashDeal}
                    flashDealAmount={flashDealAmount}
                    barterDiscountAmount={barterDiscountAmount}
                    totalServicesPrice={totalServicesPrice}
                    totalProductsPrice={totalProductsPrice}
                    finalTotal={finalTotal}
                    canSubmit={canSubmit}
                    saving={saving}
                    saveError={saveError}
                    onSubmit={handleSubmit}
                    direction={direction}
                    c2cDiscountPct={mode === 'client' ? activeC2cDiscountPct : null}
                    c2cFriendDiscountAmount={mode === 'client' && activeC2cDiscountPct ? Math.round((totalServicesPrice + totalProductsPrice) * activeC2cDiscountPct / 100) : 0}
                    c2cAlreadyUsed={c2cAlreadyUsed}
                    c2cReferrerBalance={mode === 'client' ? c2cReferrerBalance : 0}
                    c2cBonusToUse={mode === 'client' ? c2cBonusToUse : 0}
                    setC2cBonusToUse={mode === 'client' ? setC2cBonusToUse : undefined}
                    phoneDiscountPct={mode === 'client' ? phoneDiscountPct : 0}
                    phoneDiscountAmount={mode === 'client' ? phoneDiscountAmount : 0}
                  />
                </div>
              )}

              {step === 'success' && (
                <div key="success" className="h-full overflow-y-auto scrollbar-hide px-5">
                  <BookingSuccess
                    selectedServices={selectedServices}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    totalDuration={totalDuration}
                    cart={cart}
                    clientUserId={clientUserId}
                    createdBookingId={createdBookingId}
                    clientPhone={clientPhone}
                    masterName={masterName}
                    masterId={masterId}
                    masterC2cEnabled={masterC2cEnabled}
                    masterC2cDiscountPct={masterC2cDiscountPct}
                    flashDeal={flashDeal}
                    finalTotal={finalTotal}
                    direction={direction}
                    onClose={onClose}
                  />
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </BottomSheet>

    <UpgradePromptModal
      isOpen={upgradePromptOpen}
      onClose={() => setUpgradePromptOpen(false)}
      feature="Безліміт записів"
      description="На тарифі Starter — 30 записів на місяць. Перейдіть на Pro, щоб приймати необмежену кількість клієнтів."
    />
    </>
  );
}
