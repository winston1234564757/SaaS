'use client';
// src/components/shared/wizard/ClientDetails.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MessageSquare, ShoppingBag, Calendar, Gift, Zap, Mail, Sparkles } from 'lucide-react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { BookingClientData } from '@/lib/validations/booking';
import { pluralUk } from '@/lib/utils/pluralUk';
import { MONTH_S, fmt, slide } from './helpers';
import type { WizardService } from './types';
import { ClientCombobox } from './ClientCombobox';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';
import { Button } from '@/components/ui/Button';

interface ClientDetailsProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedServices: WizardService[];
  mode: 'client' | 'master';
  clientUserId: string | null;
  register: UseFormRegister<BookingClientData>;
  errors: FieldErrors<BookingClientData>;
  watchName: string;
  watchPhone: string;
  setValue: (field: keyof BookingClientData, value: string, opts?: { shouldValidate?: boolean }) => void;
  onClientSelect?: (client: ClientRow | null) => void;
  clientNotes: string;
  setClientNotes: (v: string) => void;
  discountPercent: number;
  setDiscountPercent: (v: number) => void;
  masterDiscountAmount: number;
  dynamicPricing: { label: string | null; modifier: number; adjustedPrice: number } | null;
  useDynamicPrice: boolean;
  loyaltyDiscount: { name: string; percent: number } | null;
  loyaltyDiscountAmount: number;
  flashDeal?: { id: string; discountPct: number; serviceName: string } | null;
  flashDealAmount: number;
  totalServicesPrice: number;
  totalProductsPrice: number;
  finalTotal: number;
  canSubmit: boolean;
  saving: boolean;
  saveError?: string;
  onSubmit: () => void;
  direction: number;
  c2cDiscountPct?: number | null;
  c2cFriendDiscountAmount?: number;
  c2cReferrerBalance?: number;
  c2cBonusToUse?: number;
  setC2cBonusToUse?: (v: number) => void;
  c2cAlreadyUsed?: boolean;
  phoneDiscountPct?: number;
  phoneDiscountAmount?: number;
  barterDiscountAmount?: number;
}

export function ClientDetails({
  selectedDate,
  selectedTime,
  selectedServices,
  mode,
  clientUserId,
  register,
  errors,
  watchName,
  watchPhone,
  setValue,
  onClientSelect,
  clientNotes,
  setClientNotes,
  discountPercent,
  setDiscountPercent,
  masterDiscountAmount,
  dynamicPricing,
  useDynamicPrice,
  loyaltyDiscount,
  loyaltyDiscountAmount,
  flashDeal,
  flashDealAmount,
  totalServicesPrice,
  totalProductsPrice,
  finalTotal,
  canSubmit,
  saving,
  saveError,
  onSubmit,
  direction,
  c2cDiscountPct,
  c2cFriendDiscountAmount = 0,
  c2cReferrerBalance = 0,
  c2cBonusToUse = 0,
  setC2cBonusToUse,
  c2cAlreadyUsed = false,
  phoneDiscountPct = 0,
  phoneDiscountAmount = 0,
  barterDiscountAmount = 0,
}: ClientDetailsProps) {
  return (
    <motion.div key="details" custom={direction} variants={slide}
      initial="enter" animate="center" exit="exit"
      transition={{ type: 'spring' as const, duration: 0.28, bounce: 0 }}
      className="flex flex-col min-h-[500px]"
    >
      <div>
        {/* Recap — тихий, hero-cover уже несе дату/суму */}
        <div className="flex items-center gap-2 py-2.5 mb-4 border-b border-border">
          <span className="flex items-center justify-center text-text-sub flex-shrink-0">
            {selectedServices.length === 0 ? <ShoppingBag size={15} /> : <Calendar size={15} />}
          </span>
          {selectedServices.length === 0 ? (
            <p className="text-xs text-text-sub">
              <span className="font-semibold text-foreground">Замовлення товарів</span>
              <span className="ml-1">· самовивіз</span>
            </p>
          ) : (
            <p className="text-xs text-text-sub">
              <span className="font-semibold text-foreground">
                {selectedServices.length === 1 ? selectedServices[0].name : pluralUk(selectedServices.length, 'послуга', 'послуги', 'послуг')}
              </span>
              {' — '}
              {selectedDate && `${selectedDate.getDate()} ${MONTH_S[selectedDate.getMonth()]}`}
              {' о '}
              <span className="font-semibold text-foreground">{selectedTime}</span>
            </p>
          )}
        </div>

        {mode === 'client' && barterDiscountAmount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <div className="size-1.5 rounded-full bg-primary" />
            <p className="text-xs text-primary font-bold flex items-center gap-1">
              Дякуємо, що розповів про Bookit! Твоя знижка −50% <Gift size={12} className="inline text-primary" />
            </p>
          </div>
        )}

        {mode === 'client' && clientUserId && !barterDiscountAmount && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10 border border-success/20 mb-4">
            <div className="size-1.5 rounded-full bg-success" />
            <p className="text-xs text-[#0B6B2E] font-medium">Дані підтягнуто з вашого профілю</p>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-5">
          <div>
            <label htmlFor="wizard-name" className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <User size={13} className="text-text-sub" />
              {mode === 'master' ? "Ім'я клієнта" : "Ім'я"}
            </label>
            {mode === 'master' && onClientSelect ? (
              <ClientCombobox
                errors={errors}
                watchName={watchName}
                watchPhone={watchPhone}
                setValue={setValue}
                onClientSelect={onClientSelect}
              />
            ) : (
              <>
                <input
                  id="wizard-name"
                  data-testid="wizard-name-input"
                  type="text"
                  placeholder="Твоє імʼя та прізвище"
                  {...register('clientName')}
                  className={`w-full h-12 px-4 rounded-2xl bg-secondary/75 border text-sm text-foreground placeholder:text-text-sub focus:outline-none transition-all ${
                    errors.clientName ? 'border-destructive focus:ring-destructive/20' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                {errors.clientName && <p className="text-destructive text-[10px] mt-1 ml-1">{errors.clientName.message}</p>}
              </>
            )}
          </div>
          <div>
            <label htmlFor="wizard-phone" className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <Phone size={13} className="text-text-sub" /> Телефон
            </label>
            <div className="relative">
              <input
                id="wizard-phone"
                data-testid="wizard-phone-input"
                type="tel"
                placeholder="+380 XX XXX XX XX"
                value={watchPhone}
                onChange={e => {
                  let val = e.target.value;
                  if (!val.startsWith('+380')) {
                    val = '+380' + val.replace(/\D/g, '').slice(-9);
                  }
                  const digitsOnly = val.replace(/\D/g, '').slice(0, 12);
                  const final = '+' + digitsOnly;
                  setValue('clientPhone', final, { shouldValidate: true });
                }}
                className={`w-full h-12 px-4 rounded-2xl bg-secondary/75 border text-sm text-foreground placeholder:text-text-sub focus:outline-none transition-all ${
                  errors.clientPhone ? 'border-destructive focus:ring-destructive/20' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
            </div>
            {errors.clientPhone && <p className="text-destructive text-[10px] mt-1 ml-1">{errors.clientPhone.message}</p>}
            {mode === 'client' && c2cAlreadyUsed && (
              <p className="text-[10px] text-[#9A4508] mt-1 ml-1">
                Ви вже скористались реферальною знижкою для цього майстра
              </p>
            )}
          </div>
          <div>
            <label htmlFor="wizard-notes" className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <MessageSquare size={13} className="text-text-sub" />
              {mode === 'master' ? 'Нотатки' : 'Побажання'}
              <span className="text-xs text-text-sub font-normal">(необов'язково)</span>
            </label>
            <textarea
              id="wizard-notes"
              placeholder={mode === 'master' ? 'Нотатки для себе...' : 'Алергія, особливості, побажання...'}
              value={clientNotes} onChange={e => setClientNotes(e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-secondary/75 border border-border text-sm text-foreground placeholder:text-text-sub focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {mode === 'master' && (
            <div>
              <label htmlFor="wizard-discount" className="text-sm font-medium text-foreground mb-1.5 block">Знижка майстра, %</label>
              <div className="flex items-center gap-3">
                <input
                  id="wizard-discount"
                  type="number" min={0} max={100} step={5}
                  value={discountPercent || ''} onChange={e => {
                    const v = parseInt(e.target.value, 10);
                    setDiscountPercent(isNaN(v) ? 0 : Math.min(100, Math.max(0, v)));
                  }}
                  placeholder="0"
                  className="w-24 h-12 px-4 rounded-2xl bg-secondary/75 border border-border text-sm text-foreground placeholder:text-text-sub focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <span className="text-xs text-text-sub">
                  {discountPercent > 0 ? `−${masterDiscountAmount.toLocaleString('uk-UA')} ₴` : 'без знижки'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Price summary */}
        <div className="rounded-xl bg-secondary/60 border border-border p-4 flex flex-col gap-2 mb-5">
          <p className="text-sm font-bold text-foreground mb-1">Підсумок</p>
          {selectedServices.map(s => (
            <div key={s.id} className="flex justify-between items-center text-xs">
              <span className="text-text-sub flex items-center gap-1">
                <Sparkles size={12} className="text-primary flex-shrink-0" />
                {s.name}
              </span>
              <span className="font-semibold text-foreground">{fmt(s.price)}</span>
            </div>
          ))}
          {dynamicPricing?.label && useDynamicPrice && (
            <div className="flex justify-between text-xs">
              <span className="text-primary">{dynamicPricing.label}</span>
              <span className={`font-medium ${dynamicPricing.modifier > 0 ? 'text-[#9A4508]' : 'text-[#0B6B2E]'}`}>
                {dynamicPricing.modifier > 0 ? '+' : ''}{(dynamicPricing.adjustedPrice - totalServicesPrice).toLocaleString('uk-UA')} ₴
              </span>
            </div>
          )}
          {totalProductsPrice > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-text-sub">Товари</span>
              <span className="font-semibold text-foreground">+{fmt(totalProductsPrice)}</span>
            </div>
          )}
          {loyaltyDiscount && (
            <div className="flex justify-between text-xs">
              <span className="text-[#0B6B2E] flex items-center gap-1">
                <Gift size={12} className="text-[#0B6B2E] flex-shrink-0" />
                {loyaltyDiscount.name}
                <span className="text-[10px] font-bold">-{loyaltyDiscount.percent}%</span>
              </span>
              <span className="font-semibold text-[#0B6B2E]">−{fmt(loyaltyDiscountAmount)}</span>
            </div>
          )}
          {flashDeal && flashDealAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-[#9A4508] flex items-center gap-1">
                <Zap size={12} className="text-[#9A4508] flex-shrink-0" />
                Флеш-акція
                <span className="text-[10px] font-bold">-{flashDeal.discountPct}%</span>
              </span>
              <span className="font-semibold text-[#9A4508]">−{fmt(flashDealAmount)}</span>
            </div>
          )}
          {mode === 'client' && phoneDiscountPct > 0 && !barterDiscountAmount && (
            <div className="flex justify-between text-xs">
              <span className="text-[#9A4508] flex items-center gap-1">
                <Mail size={12} className="text-[#9A4508] flex-shrink-0" />
                Знижка з розсилки
                <span className="text-[10px] font-bold">-{phoneDiscountPct}%</span>
              </span>
              <span className="font-semibold text-[#9A4508]">−{fmt(phoneDiscountAmount)}</span>
            </div>
          )}
          {mode === 'client' && barterDiscountAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-primary font-bold flex items-center gap-1">
                <Gift size={12} className="text-primary flex-shrink-0" />
                Знижка за пораду
                <span className="text-[10px]">−50%</span>
              </span>
              <span className="font-semibold text-primary">−{fmt(barterDiscountAmount)}</span>
            </div>
          )}
          {mode === 'client' && c2cAlreadyUsed && (
            <div className="flex justify-between text-xs">
              <span className="text-[#9A4508]">Реферальна знижка вже використана</span>
              <span className="text-text-sub text-[10px]">—</span>
            </div>
          )}
          {mode === 'client' && c2cDiscountPct && c2cFriendDiscountAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-primary">Реферальна знижка <span className="text-[10px] font-bold">-{c2cDiscountPct}%</span></span>
              <span className="font-semibold text-primary">−{fmt(c2cFriendDiscountAmount)}</span>
            </div>
          )}
          {mode === 'client' && c2cBonusToUse > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-primary">Ваш реф. бонус <span className="text-[10px] font-bold">-{c2cBonusToUse}%</span></span>
              <span className="font-semibold text-primary">−{fmt(Math.round(finalTotal * c2cBonusToUse / 100))}</span>
            </div>
          )}
          {mode === 'master' && discountPercent > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-[#0B6B2E]">Знижка {discountPercent}%</span>
              <span className="font-semibold text-[#0B6B2E]">−{fmt(masterDiscountAmount)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2.5 mt-0.5 flex justify-between items-baseline">
            <span className="text-sm font-bold text-foreground">
              {mode === 'client' ? 'До сплати' : 'Разом'}
            </span>
            <span className="metric-value text-2xl text-primary">
              {fmt(Math.max(0, finalTotal
                - (mode === 'client' && !barterDiscountAmount ? (c2cFriendDiscountAmount ?? 0) : 0)
                - (mode === 'client' && !barterDiscountAmount && c2cBonusToUse > 0 ? Math.round(finalTotal * c2cBonusToUse / 100) : 0)
                - (mode === 'client' && !barterDiscountAmount ? phoneDiscountAmount : 0)
              ))}
            </span>
          </div>
        </div>

        {mode === 'client' && c2cReferrerBalance > 0 && setC2cBonusToUse && !c2cDiscountPct && (
          <div className="bento-card p-4 mb-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Реферальний бонус</p>
              <span className="text-xs font-bold text-primary">{c2cReferrerBalance}% доступно</span>
            </div>
            <p className="text-xs text-text-sub">Використайте бонус від приведених подруг</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={Math.min(c2cReferrerBalance, 80)}
                step={1}
                value={c2cBonusToUse}
                onChange={e => setC2cBonusToUse(Number(e.target.value))}
                aria-label="Відсоток реферального бонусу"
                className="flex-1 accent-primary"
              />
              <span className="text-sm font-bold text-primary w-10 text-right">{c2cBonusToUse}%</span>
            </div>
          </div>
        )}

        {mode === 'client' && (
          <p className="text-xs text-text-sub text-center mb-3">
            {selectedServices.length === 0
              ? 'Майстер отримає замовлення та підготує товари'
              : 'Майстер отримає сповіщення та підтвердить запис'}
          </p>
        )}

        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-center"
            >
              <p className="text-xs font-medium text-destructive">{saveError}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-6 pb-2 sticky bottom-0 bg-gradient-to-t from-secondary via-secondary/90 to-transparent z-10">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          data-testid="wizard-submit-btn"
          disabled={!canSubmit || saving}
          isLoading={saving}
          onClick={onSubmit}
          className="shadow-lg"
        >
          {saving
            ? 'Зберігаємо...'
            : mode === 'client'
              ? (selectedServices.length === 0 ? 'Підтвердити замовлення' : 'Підтвердити запис')
              : 'Зберегти запис'
          }
        </Button>
      </div>
    </motion.div>
  );
}
