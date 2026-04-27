'use client';
// src/components/shared/wizard/ClientDetails.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MessageSquare } from 'lucide-react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { BookingClientData } from '@/lib/validations/booking';
import { pluralize } from '@/lib/utils/dates';
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
}: ClientDetailsProps) {
  return (
    <motion.div key="details" custom={direction} variants={slide}
      initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.2, ease: 'easeInOut' }}>

      {/* Recap badge */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#789A99]/10 border border-[#789A99]/20 mb-4">
        <span className="text-base">📅</span>
        <p className="text-xs text-[#6B5750]">
          <span className="font-semibold text-[#2C1A14]">
            {selectedServices.length === 1 ? selectedServices[0].name : pluralize(selectedServices.length, ['послуга', 'послуги', 'послуг'])}
          </span>
          {' — '}
          {selectedDate && `${selectedDate.getDate()} ${MONTH_S[selectedDate.getMonth()]}`}
          {' о '}
          <span className="font-semibold text-[#789A99]">{selectedTime}</span>
        </p>
      </div>

      {mode === 'client' && clientUserId && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#5C9E7A]/10 border border-[#5C9E7A]/20 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#5C9E7A]" />
          <p className="text-xs text-[#5C9E7A] font-medium">Дані підтягнуто з вашого профілю</p>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-5">
        <div>
          <label className="text-sm font-medium text-[#2C1A14] flex items-center gap-1.5 mb-1.5">
            <User size={13} className="text-[#A8928D]" />
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
                className={`w-full h-12 px-4 rounded-xl bg-white/75 border text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none transition-all ${
                  errors.clientName ? 'border-[#C05B5B] focus:ring-[#C05B5B]/20' : 'border-white/80 focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20'
                }`}
              />
              {errors.clientName && <p className="text-[#C05B5B] text-[10px] mt-1 ml-1">{errors.clientName.message}</p>}
            </>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-[#2C1A14] flex items-center gap-1.5 mb-1.5">
            <Phone size={13} className="text-[#A8928D]" /> Телефон
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
              className={`w-full h-12 px-4 rounded-xl bg-white/75 border text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none transition-all ${
                errors.clientPhone ? 'border-[#C05B5B] focus:ring-[#C05B5B]/20' : 'border-white/80 focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20'
              }`}
            />
          </div>
          {errors.clientPhone && <p className="text-[#C05B5B] text-[10px] mt-1 ml-1">{errors.clientPhone.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-[#2C1A14] flex items-center gap-1.5 mb-1.5">
            <MessageSquare size={13} className="text-[#A8928D]" />
            {mode === 'master' ? 'Нотатки' : 'Побажання'}
            <span className="text-xs text-[#A8928D] font-normal">(необов'язково)</span>
          </label>
          <textarea
            placeholder={mode === 'master' ? 'Нотатки для себе...' : 'Алергія, особливості, побажання...'}
            value={clientNotes} onChange={e => setClientNotes(e.target.value)} rows={2}
            className="w-full px-4 py-3 rounded-xl bg-white/75 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all resize-none"
          />
        </div>

        {mode === 'master' && (
          <div>
            <label className="text-sm font-medium text-[#2C1A14] mb-1.5 block">Знижка майстра, %</label>
            <div className="flex items-center gap-3">
              <input type="number" min={0} max={100} step={5}
                value={discountPercent || ''} onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  setDiscountPercent(isNaN(v) ? 0 : Math.min(100, Math.max(0, v)));
                }}
                placeholder="0"
                className="w-24 h-12 px-4 rounded-xl bg-white/75 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
              />
              <span className="text-xs text-[#A8928D]">
                {discountPercent > 0 ? `−${masterDiscountAmount.toLocaleString('uk-UA')} ₴` : 'без знижки'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Price summary */}
      <div className="rounded-2xl bg-white/60 border border-white/80 p-4 flex flex-col gap-2 mb-5">
        <p className="text-xs font-bold text-[#A8928D] uppercase tracking-wide mb-1">Підсумок</p>
        {selectedServices.map(s => (
          <div key={s.id} className="flex justify-between text-xs">
            <span className="text-[#6B5750]">{s.emoji} {s.name}</span>
            <span className="font-semibold text-[#2C1A14]">{fmt(s.price)}</span>
          </div>
        ))}
        {dynamicPricing?.label && useDynamicPrice && (
          <div className="flex justify-between text-xs">
            <span className="text-[#789A99]">{dynamicPricing.label}</span>
            <span className={`font-medium ${dynamicPricing.modifier > 0 ? 'text-[#D4935A]' : 'text-[#5C9E7A]'}`}>
              {dynamicPricing.modifier > 0 ? '+' : ''}{(dynamicPricing.adjustedPrice - totalServicesPrice).toLocaleString('uk-UA')} ₴
            </span>
          </div>
        )}
        {totalProductsPrice > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-[#6B5750]">Товари</span>
            <span className="font-semibold text-[#2C1A14]">+{fmt(totalProductsPrice)}</span>
          </div>
        )}
        {loyaltyDiscount && (
          <div className="flex justify-between text-xs">
            <span className="text-[#5C9E7A]">🎁 {loyaltyDiscount.name} <span className="text-[10px] font-bold">-{loyaltyDiscount.percent}%</span></span>
            <span className="font-semibold text-[#5C9E7A]">−{fmt(loyaltyDiscountAmount)}</span>
          </div>
        )}
        {flashDeal && flashDealAmount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-amber-600">⚡ Флеш-акція <span className="text-[10px] font-bold">-{flashDeal.discountPct}%</span></span>
            <span className="font-semibold text-amber-600">−{fmt(flashDealAmount)}</span>
          </div>
        )}
        {mode === 'client' && c2cDiscountPct && c2cFriendDiscountAmount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-[#789A99]">Реферальна знижка <span className="text-[10px] font-bold">-{c2cDiscountPct}%</span></span>
            <span className="font-semibold text-[#789A99]">−{fmt(c2cFriendDiscountAmount)}</span>
          </div>
        )}
        {mode === 'client' && c2cBonusToUse > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-[#789A99]">Ваш реф. бонус <span className="text-[10px] font-bold">-{c2cBonusToUse}%</span></span>
            <span className="font-semibold text-[#789A99]">−{fmt(Math.round(finalTotal * c2cBonusToUse / 100))}</span>
          </div>
        )}
        {mode === 'master' && discountPercent > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-[#5C9E7A]">Знижка {discountPercent}%</span>
            <span className="font-semibold text-[#5C9E7A]">−{fmt(masterDiscountAmount)}</span>
          </div>
        )}
        <div className="border-t border-[#E8D5CF] pt-2 flex justify-between items-center">
          <span className="text-sm font-bold text-[#2C1A14]">
            {mode === 'client' ? 'До сплати' : 'Разом'}
          </span>
          <span className="text-lg font-bold text-[#789A99]">
            {fmt(Math.max(0, finalTotal
              - (mode === 'client' ? (c2cFriendDiscountAmount ?? 0) : 0)
              - (mode === 'client' && c2cBonusToUse > 0 ? Math.round(finalTotal * c2cBonusToUse / 100) : 0)
            ))}
          </span>
        </div>
      </div>

      {mode === 'client' && c2cReferrerBalance > 0 && setC2cBonusToUse && !c2cDiscountPct && (
        <div className="bento-card p-4 mb-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#2C1A14]">Реферальний бонус</p>
            <span className="text-xs font-bold text-[#789A99]">{c2cReferrerBalance}% доступно</span>
          </div>
          <p className="text-xs text-[#A8928D]">Використайте бонус від приведених подруг</p>
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
            <span className="text-sm font-bold text-[#789A99] w-10 text-right">{c2cBonusToUse}%</span>
          </div>
        </div>
      )}

      {mode === 'client' && (
        <p className="text-xs text-[#A8928D] text-center mb-3">
          Майстер отримає сповіщення та підтвердить запис
        </p>
      )}

      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 px-3 py-2.5 rounded-xl bg-[#C05B5B]/10 border border-[#C05B5B]/20 text-center"
          >
            <p className="text-xs font-medium text-[#C05B5B]">{saveError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        data-testid="wizard-submit-btn"
        disabled={!canSubmit || saving}
        onClick={onSubmit}
        className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          canSubmit && !saving
            ? 'bg-[#789A99] text-white hover:bg-[#6B8C8B] active:scale-[0.98]'
            : 'bg-[#E8D5CF] text-[#A8928D] cursor-not-allowed'
        }`}
      >
        {saving
          ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Зберігаємо...</>
          : mode === 'client' ? 'Підтвердити запис' : 'Зберегти запис'
        }
      </button>
    </motion.div>
  );
}
