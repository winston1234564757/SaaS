'use client';
// src/components/shared/wizard/ClientDetails.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MessageSquare } from 'lucide-react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { BookingClientData } from '@/lib/validations/booking';
import { pluralUk } from '@/lib/utils/pluralUk';
import { MONTH_S, fmt, slide } from './helpers';
import type { WizardService } from './types';
import { ClientCombobox } from './ClientCombobox';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';

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
  // C2C: friend booking discount (friend side)
  c2cDiscountPct?: number | null;
  c2cFriendDiscountAmount?: number;
  // C2C: referrer bonus selector (referrer side)
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
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full min-h-[500px]"
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Recap badge */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <span className="text-base">{selectedServices.length === 0 ? '🛍️' : '📅'}</span>
          {selectedServices.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Замовлення товарів</span>
              <span className="ml-1">· самовивіз</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {selectedServices.length === 1 ? selectedServices[0].name : pluralUk(selectedServices.length, 'послуга', 'послуги', 'послуг')}
              </span>
              {' — '}
              {selectedDate && `${selectedDate.getDate()} ${MONTH_S[selectedDate.getMonth()]}`}
              {' о '}
              <span className="font-semibold text-primary">{selectedTime}</span>
            </p>
          )}
        </div>

        {mode === 'client' && barterDiscountAmount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <p className="text-xs text-primary font-bold">Дякуємо, що розповів про Bookit! Твоя знижка −50% 🎁</p>
          </div>
        )}

        {mode === 'client' && clientUserId && !barterDiscountAmount && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10 border border-success/20 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <p className="text-xs text-success font-medium">Дані підтягнуто з вашого профілю</p>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-5">
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <User size={13} className="text-muted-foreground/60" />
              {mode === 'master' ? "Ім'я клієнта" : "Ім'я"}
            </label>
            {mode === 'master' && onClientSelect ? (
              <ClientCombobox
                errors={errors}
                watchName={watchName}
                setValue={setValue}
                onClientSelect={onClientSelect}
              />
            ) : (
              <>
                <input
                  data-testid="wizard-name-input"
                  type="text"
                  placeholder="Твоє імʼя та прізвище"
                  {...register('clientName')}
                  className={`w-full h-12 px-4 rounded-xl bg-white/75 border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all ${
                    errors.clientName ? 'border-destructive focus:ring-[#C05B5B]/20' : 'border-white/80 focus:border-primary focus:ring-2 focus:ring-[#789A99]/20'
                  }`}
                />
                {errors.clientName && <p className="text-destructive text-[10px] mt-1 ml-1">{errors.clientName.message}</p>}
              </>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <Phone size={13} className="text-muted-foreground/60" /> Телефон
            </label>
            <div className="relative">
              <input
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
                className={`w-full h-12 px-4 rounded-xl bg-white/75 border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all ${
                  errors.clientPhone ? 'border-destructive focus:ring-[#C05B5B]/20' : 'border-white/80 focus:border-primary focus:ring-2 focus:ring-[#789A99]/20'
                }`}
              />
            </div>
            {errors.clientPhone && <p className="text-destructive text-[10px] mt-1 ml-1">{errors.clientPhone.message}</p>}
            {mode === 'client' && c2cAlreadyUsed && (
              <p className="text-[10px] text-warning mt-1 ml-1">
                Ви вже скористались реферальною знижкою для цього майстра
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <MessageSquare size={13} className="text-muted-foreground/60" />
              {mode === 'master' ? 'Нотатки' : 'Побажання'}
              <span className="text-xs text-muted-foreground/60 font-normal">(необов'язково)</span>
            </label>
            <textarea
              placeholder={mode === 'master' ? 'Нотатки для себе...' : 'Алергія, особливості, побажання...'}
              value={clientNotes} onChange={e => setClientNotes(e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/75 border border-white/80 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-[#789A99]/20 transition-all resize-none"
            />
          </div>

          {mode === 'master' && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Знижка майстра, %</label>
              <div className="flex items-center gap-3">
                <input type="number" min={0} max={100} step={5}
                  value={discountPercent || ''} onChange={e => {
                    const v = parseInt(e.target.value, 10);
                    setDiscountPercent(isNaN(v) ? 0 : Math.min(100, Math.max(0, v)));
                  }}
                  placeholder="0"
                  className="w-24 h-12 px-4 rounded-xl bg-white/75 border border-white/80 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-[#789A99]/20 transition-all"
                />
                <span className="text-xs text-muted-foreground/60">
                  {discountPercent > 0 ? `−${masterDiscountAmount.toLocaleString('uk-UA')} ₴` : 'без знижки'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Price summary */}
        <div className="rounded-2xl bg-white/60 border border-white/80 p-4 flex flex-col gap-2 mb-5">
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wide mb-1">Підсумок</p>
          {selectedServices.map(s => (
            <div key={s.id} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{s.emoji} {s.name}</span>
              <span className="font-semibold text-foreground">{fmt(s.price)}</span>
            </div>
          ))}
          {dynamicPricing?.label && useDynamicPrice && (
            <div className="flex justify-between text-xs">
              <span className="text-primary">{dynamicPricing.label}</span>
              <span className={`font-medium ${dynamicPricing.modifier > 0 ? 'text-warning' : 'text-success'}`}>
                {dynamicPricing.modifier > 0 ? '+' : ''}{(dynamicPricing.adjustedPrice - totalServicesPrice).toLocaleString('uk-UA')} ₴
              </span>
            </div>
          )}
          {totalProductsPrice > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Товари</span>
              <span className="font-semibold text-foreground">+{fmt(totalProductsPrice)}</span>
            </div>
          )}
          {loyaltyDiscount && (
            <div className="flex justify-between text-xs">
              <span className="text-success">🎁 {loyaltyDiscount.name} <span className="text-[10px] font-bold">-{loyaltyDiscount.percent}%</span></span>
              <span className="font-semibold text-success">−{fmt(loyaltyDiscountAmount)}</span>
            </div>
          )}
          {flashDeal && flashDealAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-amber-600">⚡ Флеш-акція <span className="text-[10px] font-bold">-{flashDeal.discountPct}%</span></span>
              <span className="font-semibold text-amber-600">−{fmt(flashDealAmount)}</span>
            </div>
          )}
          {mode === 'client' && phoneDiscountPct > 0 && !barterDiscountAmount && (
            <div className="flex justify-between text-xs">
              <span className="text-warning">📩 Знижка з розсилки <span className="text-[10px] font-bold">-{phoneDiscountPct}%</span></span>
              <span className="font-semibold text-warning">−{fmt(phoneDiscountAmount)}</span>
            </div>
          )}
          {mode === 'client' && barterDiscountAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-primary font-bold">🎁 Знижка за пораду <span className="text-[10px]">−50%</span></span>
              <span className="font-semibold text-primary">−{fmt(barterDiscountAmount)}</span>
            </div>
          )}
          {mode === 'client' && c2cAlreadyUsed && (
            <div className="flex justify-between text-xs">
              <span className="text-warning">Реферальна знижка вже використана</span>
              <span className="text-muted-foreground/60 text-[10px]">—</span>
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
              <span className="text-success">Знижка {discountPercent}%</span>
              <span className="font-semibold text-success">−{fmt(masterDiscountAmount)}</span>
            </div>
          )}
          <div className="border-t border-secondary/80 pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-foreground">
              {mode === 'client' ? 'До сплати' : 'Разом'}
            </span>
            <span className="text-lg font-bold text-primary">
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
            <p className="text-xs text-muted-foreground/60">Використайте бонус від приведених подруг</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={Math.min(c2cReferrerBalance, 80)}
                step={1}
                value={c2cBonusToUse}
                onChange={e => setC2cBonusToUse(Number(e.target.value))}
                className="flex-1 accent-[#789A99]"
              />
              <span className="text-sm font-bold text-primary w-10 text-right">{c2cBonusToUse}%</span>
            </div>
          </div>
        )}

        {mode === 'client' && (
          <p className="text-xs text-muted-foreground/60 text-center mb-3">
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

      <div className="mt-auto pt-6 pb-2 sticky bottom-0 bg-gradient-to-t from-background via-background/90 to-transparent z-10">
        <button
          data-testid="wizard-submit-btn"
          disabled={!canSubmit || saving}
          onClick={onSubmit}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${
            canSubmit && !saving
              ? 'bg-primary text-white hover:bg-[#6B8C8B] active:scale-95 shadow-primary/20'
              : 'bg-secondary/80 text-muted-foreground/40 cursor-not-allowed shadow-none'
          }`}
        >
          {saving
            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Зберігаємо...</>
            : mode === 'client'
              ? (selectedServices.length === 0 ? 'Підтвердити замовлення' : 'Підтвердити запис')
              : 'Зберегти запис'
          }
        </button>
      </div>
    </motion.div>
  );
}
