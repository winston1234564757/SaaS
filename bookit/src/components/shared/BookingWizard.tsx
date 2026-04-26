'use client';

/**
 * BookingWizard — unified 4-step booking flow.
 *
 * Steps: services → datetime → products* → details → success
 * (* products step skipped when master has no in-stock products)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useBookingScheduleData } from './wizard/useBookingScheduleData';
import { useBookingPricing } from './wizard/useBookingPricing';
import { useBookingWizardState } from './wizard/useBookingWizardState';
import { ServiceSelector } from './wizard/ServiceSelector';
import { DateTimePicker } from './wizard/DateTimePicker';
import { ProductCart } from './wizard/ProductCart';
import { ClientDetails } from './wizard/ClientDetails';
import { BookingSuccess } from './wizard/BookingSuccess';
import { X, ChevronLeft } from 'lucide-react';
import { createBooking } from '@/lib/actions/createBooking';
import { notifyMasterOnBooking } from '@/app/[slug]/actions';
import { UpgradePromptModal } from '@/components/shared/UpgradePromptModal';
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
}: BookingWizardProps) {

  const isFlashFastTrack = !!(flashDeal?.slotDate && flashDeal?.slotTime);

  const {
    step, direction, go, goBack, closeWizard, hasProducts, availableProducts,
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
  });

  const isAtLimit = mode === 'client' && subscriptionTier === 'starter' && bookingsThisMonth >= 30;

  // ── Pricing ───────────────────────────────────────────────────────────────────
  const {
    totalDuration, effectiveDuration,
    totalServicesPrice, dynamicPricing,
    totalProductsPrice, finalTotal,
    loyaltyDiscountAmount, masterDiscountAmount, flashDealAmount,
  } = useBookingPricing({
    masterId,
    selectedServices, cart, durationOverride,
    selectedDate, selectedTime,
    useDynamicPrice, loyaltyDiscount, flashDeal, discountPercent,
  });

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
    if (!selectedDate || !selectedTime) return;
    const isValid = await trigger();
    if (!isValid) return;

    setSaving(true);
    setSaveError('');
    const result = await createBooking({
      masterId,
      clientName:              watchName.trim(),
      clientPhone:             watchPhone.trim(),
      clientEmail:             mode === 'client' ? (clientEmail.trim().toLowerCase() || null) : null,
      clientId:                mode === 'client' ? (clientUserId || null) : (selectedClientId || null),
      date:                    toISO(selectedDate),
      startTime:               selectedTime,
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
      c2c_discount_pct:        mode === 'client' ? (c2cRefCode ? c2cDiscountPct : null) : null,
    });
    setSaving(false);
    if (result.error) {
      if (result.upgradeRequired && mode === 'master') {
        setUpgradePromptOpen(true);
      } else if (result.upgradeRequired && mode === 'client') {
        setSaveError('На жаль, запис до цього майстра тимчасово недоступний. Зверніться до майстра напряму.');
      } else {
        setSaveError(result.error);
        // Slot was taken by another user — refresh schedule and go back to time picker
        if (result.error.includes('вже заброньований')) {
          setSelectedTime(null);
          refetchSchedule();
          go('datetime', -1);
        }
      }
      return;
    }
    if (mode === 'client' && result.bookingId) {
      if (typeof window !== 'undefined') localStorage.removeItem('bookit_ref');
      setCreatedBookingId(result.bookingId);
      notifyMasterOnBooking({
        masterId, clientName: watchName.trim(),
        date: toISO(selectedDate), startTime: selectedTime,
        services: selectedServices.map(s => s.name).join(', '),
        totalPrice: result.finalTotal ?? finalTotal,
        notes: clientNotes.trim() || null,
        products: cart.length > 0 ? cart.map(ci => ({ name: ci.product.name, quantity: ci.quantity })) : undefined,
      }).catch(() => {});
    }
    if (mode === 'master') { onSuccess?.(); onClose(); return; }
    go('success', 1);
  }

  const canSubmit = (watchName?.trim()?.length ?? 0) >= 2 && (watchPhone?.length ?? 0) >= 13;

  if (!isOpen) return null;

  // ── Shell ──────────────────────────────────────────────────────────────────────
  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[55] flex items-end md:items-center justify-center pointer-events-none md:p-6">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-[#2C1A14]/25 backdrop-blur-sm pointer-events-auto"
            onClick={closeWizard}
          />
          <motion.div
            initial={{ 
              y: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 0,
              scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0.95,
              opacity: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0,
            }} 
            animate={{ y: 0, scale: 1, opacity: 1 }} 
            exit={{ 
              y: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 0,
              scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0.95,
              opacity: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            data-testid="wizard-panel"
            className="relative z-[60] w-full max-h-[92dvh] md:max-h-[85vh] md:max-w-[800px] flex flex-col rounded-t-[28px] md:rounded-[32px] overflow-hidden pointer-events-auto shadow-2xl"
            style={{ background: 'rgba(255,248,244,0.97)', backdropFilter: 'blur(32px)' }}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
              <div className="w-10 h-1 bg-[#E8D5CF] rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-2 flex-shrink-0">
              <button onClick={goBack}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-[#F5E8E3] text-[#6B5750] hover:bg-[#EDD9D1] transition-colors">
                <ChevronLeft size={16} />
              </button>
              <div className="text-center">
                {step !== 'success' && (
                  <>
                    {masterName && <p className="text-[10px] text-[#A8928D]">{masterName}</p>}
                    <p className="text-sm font-semibold text-[#2C1A14]">
                      {(() => { const t = STEP_TITLE[step]; return typeof t === 'function' ? t(mode) : t; })()}
                    </p>
                  </>
                )}
              </div>
              <button onClick={closeWizard}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-[#F5E8E3] text-[#6B5750] hover:bg-[#EDD9D1] transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
              {isAtLimit && step !== 'success' && (
                <div className="flex flex-col items-center text-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#D4935A]/12 flex items-center justify-center text-3xl">🔒</div>
                  <p className="text-base font-semibold text-[#2C1A14]">Ліміт записів вичерпано</p>
                  <p className="text-sm text-[#6B5750] leading-relaxed">
                    Майстер досяг ліміту 30 записів на місяць.<br />
                    Нові записи будуть доступні з наступного місяця.
                  </p>
                  <button onClick={closeWizard}
                    className="px-6 py-3 rounded-2xl bg-[#789A99] text-white text-sm font-semibold">
                    Зрозуміло
                  </button>
                </div>
              )}

              {!isAtLimit && (
                <>
                  {step !== 'success' && <StepProgress step={step} hasProducts={hasProducts} />}
                  <AnimatePresence mode="wait" custom={direction}>

                    {step === 'services' && (
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
                        onDurationOverrideChange={(v) => { setDurationOverride(v); setSelectedTime(null); }}
                        onClearTime={() => setSelectedTime(null)}
                        onContinue={() => go('datetime', 1)}
                      />
                    )}

                    {step === 'datetime' && (
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
                    )}

                    {step === 'products' && (
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
                    )}

                    {step === 'details' && (
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
                        totalServicesPrice={totalServicesPrice}
                        totalProductsPrice={totalProductsPrice}
                        finalTotal={finalTotal}
                        canSubmit={canSubmit}
                        saving={saving}
                        saveError={saveError}
                        onSubmit={handleSubmit}
                        direction={direction}
                      />
                    )}

                    {step === 'success' && (
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
                        flashDeal={flashDeal}
                        finalTotal={finalTotal}
                        direction={direction}
                        onClose={closeWizard}
                      />
                    )}

                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <UpgradePromptModal
      isOpen={upgradePromptOpen}
      onClose={() => setUpgradePromptOpen(false)}
      feature="Безліміт записів"
      description="На тарифі Starter — 30 записів на місяць. Перейдіть на Pro, щоб приймати необмежену кількість клієнтів."
    />
    </>
  );
}
