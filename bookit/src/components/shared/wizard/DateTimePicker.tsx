'use client';
// src/components/shared/wizard/DateTimePicker.tsx
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, parse as parseFns, format as formatFns, addMinutes } from 'date-fns';
import {
  buildSlotRenderItems,
  toMins as slotToMins, fromMins as slotFromMins,
  type SlotWithScore,
  type TimeRange,
} from '@/lib/utils/smartSlots';
import { formatDurationFull, pluralize } from '@/lib/utils/dates';
import type { ScheduleStore } from '@/lib/supabase/hooks/useWizardSchedule';
import { DAY_S, MONTH_S, toISO, fmt, slide } from './helpers';
import type { WizardService } from './types';
import { getNow } from '@/lib/utils/now';

interface DateTimePickerProps {
  days: Date[];
  scheduleStore: ScheduleStore | undefined | null;
  scheduleLoading: boolean;
  scheduleError: boolean;
  onRetry: () => void;
  selectedDate: Date | null;
  selectedTime: string | null;
  offDayDates: Set<string>;
  fullyBookedDates: Set<string>;
  slots: SlotWithScore[];
  selectedDayBreaks: TimeRange[];
  effectiveDuration: number;
  totalServicesPrice: number;
  selectedServices: WizardService[];
  dynamicPricing: { label: string | null; modifier: number; adjustedPrice: number } | null;
  useDynamicPrice: boolean;
  mode: 'client' | 'master';
  hasProducts: boolean;
  direction: number;
  onDateSelect: (d: Date) => void;
  onTimeSelect: (t: string) => void;
  onToggleDynamicPrice: () => void;
  onContinue: () => void;
}

import { useState, useEffect } from 'react';

export function DateTimePicker({
  days,
  scheduleStore: _scheduleStore,
  scheduleLoading,
  scheduleError,
  onRetry,
  selectedDate,
  selectedTime,
  offDayDates,
  fullyBookedDates,
  slots,
  selectedDayBreaks,
  effectiveDuration,
  totalServicesPrice,
  selectedServices,
  dynamicPricing,
  useDynamicPrice,
  mode,
  direction,
  onDateSelect,
  onTimeSelect,
  onToggleDynamicPrice,
  onContinue,
}: DateTimePickerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const canProceedDatetime = !!selectedDate && !!selectedTime;
  
  if (!mounted) return null;

  return (
    <motion.div key="datetime" custom={direction} variants={slide}
      initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.2, ease: 'easeInOut' }}>

      {/* Services recap chip */}
      <button onClick={onContinue}
        className="flex items-center gap-3 p-3 rounded-2xl bg-[#789A99]/10 border border-[#789A99]/25 mb-5 w-full text-left">
        <div className="flex -space-x-1.5 flex-shrink-0">
          {selectedServices.slice(0, 3).map(s => (
            <div key={s.id} className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
              style={{ background: 'rgba(255,210,194,0.5)' }}>
              {s.emoji}
            </div>
          ))}
          {selectedServices.length > 3 && (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-[#6B5750]"
              style={{ background: 'rgba(255,210,194,0.5)' }}>
              +{selectedServices.length - 3}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#2C1A14] truncate">
            {selectedServices.length === 1 ? selectedServices[0].name : pluralize(selectedServices.length, ['послуга', 'послуги', 'послуг'])}
          </p>
          <p className="text-xs text-[#A8928D]">{formatDurationFull(effectiveDuration)} · {fmt(totalServicesPrice)}</p>
        </div>
        <ChevronRight size={14} className="text-[#A8928D] rotate-180 flex-shrink-0" />
      </button>

      {/* ── Date strip ── */}
      <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-2">Дата</p>

      <div className="flex items-center gap-2 mb-5">
        {/* Prev day */}
        <button
          disabled={scheduleLoading}
          onClick={() => {
            const base = selectedDate ?? days[0];
            const prev = addDays(base, -1);
            if (prev >= days[0]) onDateSelect(prev);
          }}
          className="w-11 h-11 rounded-full bg-white/70 border border-stone-200 flex items-center justify-center flex-shrink-0 hover:bg-white transition-colors text-stone-500 disabled:opacity-50"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Scrollable date strip */}
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {days.map((d, i) => {
            const dateStr    = toISO(d);
            const isSelected = selectedDate?.toDateString() === d.toDateString();
            const isToday    = d.toDateString() === getNow().toDateString();
            const isOff      = offDayDates.has(dateStr);
            const isFull     = !isOff && effectiveDuration > 0 && fullyBookedDates.has(dateStr);
            const isDisabled = isOff || isFull || scheduleLoading;
            return (
              <button
                key={i}
                id={`day-${dateStr}`}
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) onDateSelect(d);
                }}
                className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-2xl flex-shrink-0 min-w-[54px] transition-all ${
                  isOff
                    ? 'bg-white/40 border border-dashed border-stone-200 cursor-not-allowed opacity-50'
                    : isFull
                    ? 'bg-red-50 border border-dashed border-red-200 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#789A99] text-white shadow-md'
                    : 'bg-white/70 border border-stone-200 text-stone-700 hover:bg-white hover:border-[#789A99]/40'
                } ${scheduleLoading ? 'animate-pulse' : ''}`}
              >
                <span className={`text-[10px] font-medium whitespace-normal text-balance break-words text-center leading-tight ${
                  isOff ? 'text-stone-300' :
                  isFull ? 'text-red-300' :
                  isSelected ? 'text-white/80' : 'text-stone-400'
                }`}>
                  {isToday && !isDisabled ? 'Сьогодні' : DAY_S[d.getDay()]}
                </span>
                <span className={`text-base font-bold leading-none ${
                  isOff || isFull ? 'text-stone-300' : ''
                }`}>
                  {d.getDate()}
                </span>
                {isOff ? (
                  <span className="text-[9px] text-stone-300 leading-none">вих.</span>
                ) : isFull ? (
                  <span className="text-[9px] font-semibold text-red-400 bg-red-50 rounded-full px-1 py-0.5 leading-none">зайнято</span>
                ) : (
                  <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-stone-400'}`}>
                    {MONTH_S[d.getMonth()]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Next day */}
        <button
          disabled={scheduleLoading}
          onClick={() => {
            const base = selectedDate ?? days[0];
            const next = addDays(base, 1);
            if (next <= days[days.length - 1]) onDateSelect(next);
          }}
          className="w-11 h-11 rounded-full bg-white/70 border border-stone-200 flex items-center justify-center flex-shrink-0 hover:bg-white transition-colors text-stone-500 disabled:opacity-50"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {scheduleError ? (
        <div className="flex flex-col items-center gap-3 py-6 mb-4">
          <p className="text-sm text-[#C05B5B]">Не вдалося завантажити розклад</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-[#789A99] text-white text-xs font-semibold"
          >
            Спробувати знову
          </button>
        </div>
      ) : scheduleLoading ? (
        <div className="flex justify-center py-6 mb-4">
          <div className="w-5 h-5 border-2 border-[#789A99] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Time grid moved to a fragment */}

      {/* ── Time grid ── */}
      {selectedDate && (
        <>
          <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-3">Час</p>

          {offDayDates.has(toISO(selectedDate)) ? (
            <div className="flex flex-col items-center gap-2 py-8 rounded-2xl bg-stone-50 border border-dashed border-stone-200">
              <span className="text-3xl">😴</span>
              <p className="text-sm font-semibold text-stone-500">Вихідний день</p>
              <p className="text-xs text-stone-400">Оберіть інший день</p>
            </div>
          ) : (() => {
            const renderItems = buildSlotRenderItems(slots, selectedDayBreaks);
            const hasAvail = renderItems.some(i => i.kind === 'slot');

            if (!hasAvail) return (
              <div className="flex flex-col items-center gap-2 py-8 rounded-2xl bg-stone-50 border border-dashed border-stone-200">
                <span className="text-3xl">📅</span>
                <p className="text-sm font-semibold text-stone-500">Немає вільних слотів</p>
                <p className="text-xs text-stone-400">Всі вікна зайняті</p>
              </div>
            );

            return (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {renderItems.map((item, idx) =>
                  item.kind === 'break' ? (
                    /* Break separator spans all 3 columns */
                    <div key={`brk-${idx}`} className="col-span-3 flex items-center gap-2 py-0.5">
                      <div className="flex-1 h-px bg-stone-200" />
                      <span className="text-xs text-stone-400 flex-shrink-0">
                        🍽 {item.label} · {item.start}–{item.end}
                      </span>
                      <div className="flex-1 h-px bg-stone-200" />
                    </div>
                  ) : (
                    <motion.button
                      key={item.slot.time}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onTimeSelect(item.slot.time)}
                      data-testid="time-slot"
                      className={`relative rounded-xl py-3 text-center text-sm font-medium transition-all ${
                        selectedTime === item.slot.time
                          ? 'bg-[#789A99] text-white shadow-md ring-2 ring-[#789A99]/30 border-transparent'
                          : item.slot.isSuggested
                          ? 'bg-[#789A99]/8 border border-[#789A99]/30 text-[#2C1A14]'
                          : 'bg-white/60 text-stone-600 border border-stone-200 hover:bg-white hover:border-[#789A99]/30'
                      }`}
                    >
                      {item.slot.isSuggested && selectedTime !== item.slot.time && (
                        <span className="absolute -top-1.5 -right-1 text-[8px] bg-[#789A99] text-white rounded-full px-1 py-0.5 font-bold leading-none">★</span>
                      )}
                      <span className="block font-semibold">{item.slot.time}</span>
                      <span className={`block text-[11px] font-normal mt-0.5 ${
                        selectedTime === item.slot.time ? 'text-white/70' : 'text-stone-400'
                      }`}>
                        {slotFromMins(slotToMins(item.slot.time) + effectiveDuration)}
                      </span>
                    </motion.button>
                  )
                )}
              </div>
            );
          })()}

          {/* Dynamic pricing badge — для клієнта: інфо-бейдж */}
          {dynamicPricing?.label && mode === 'client' && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium mb-3 ${
              dynamicPricing.modifier > 0
                ? 'bg-red-50 text-red-700 border border-red-100'
                : 'bg-green-50 text-green-700 border border-green-100'
            }`}>
              {dynamicPricing.label}
              <span className="ml-auto font-bold">{fmt(dynamicPricing.adjustedPrice)}</span>
            </div>
          )}

          {/* Dynamic pricing toggle — тільки для майстра, якщо правило спрацювало */}
          {mode === 'master' && dynamicPricing && dynamicPricing.adjustedPrice !== totalServicesPrice && selectedTime && (
            <button
              type="button"
              onClick={onToggleDynamicPrice}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl border transition-all mb-3 ${
                useDynamicPrice
                  ? 'bg-[#789A99]/10 border-[#789A99]/30'
                  : 'bg-white/70 border-white/80 hover:bg-white'
              }`}
            >
              <div className="text-left">
                <p className="text-sm font-medium text-[#2C1A14]">Застосувати динамічну ціну</p>
                <p className="text-xs text-[#A8928D] mt-0.5">
                  {dynamicPricing.label} → {fmt(dynamicPricing.adjustedPrice)}
                </p>
              </div>
              <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-3 ${
                useDynamicPrice ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'
              }`}>
                <motion.div
                  animate={{ x: useDynamicPrice ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                />
              </div>
            </button>
          )}
        </>
      )}

      {/* Continue CTA */}
      <div className="sticky bottom-0 pt-3 pb-1 bg-gradient-to-t from-[rgba(255,248,244,1)] to-transparent">
        <button
          disabled={!canProceedDatetime}
          onClick={onContinue}
          data-testid="wizard-next-btn"
          className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all ${
            canProceedDatetime
              ? 'bg-[#789A99] text-white hover:bg-[#6B8C8B] active:scale-[0.98]'
              : 'bg-[#E8D5CF] text-[#A8928D] cursor-not-allowed'
          }`}
        >
          {canProceedDatetime
            ? `Далі — ${selectedDate!.getDate()} ${MONTH_S[selectedDate!.getMonth()]} о ${selectedTime}`
            : selectedDate ? 'Обери час' : 'Обери день'}
        </button>
      </div>
    </motion.div>
  );
}
