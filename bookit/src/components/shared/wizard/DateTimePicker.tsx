'use client';
// src/components/shared/wizard/DateTimePicker.tsx
import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Coffee, Calendar, Utensils, Sparkles, Star } from 'lucide-react';
import { addDays } from 'date-fns';
import {
  buildSlotRenderItems,
  toMins as slotToMins, fromMins as slotFromMins,
  type SlotWithScore,
  type TimeRange,
} from '@/lib/utils/smartSlots';
import { pluralUk } from '@/lib/utils/pluralUk';
import { formatDurationFull } from '@/lib/utils/dates';
import type { ScheduleStore } from '@/lib/supabase/hooks/useWizardSchedule';
import { DAY_S, MONTH_S, toISO, fmt, slide } from './helpers';
import type { WizardService } from './types';
import { getNow } from '@/lib/utils/now';

// ── Spring constants ──────────────────────────────────────────────────────────
const slotSpring = { type: 'spring' as const, stiffness: 260, damping: 26 };
const barSpring  = { type: 'spring' as const, stiffness: 90,  damping: 18 };

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
  onBack: () => void;
  onContinue: () => void;
}

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
  onBack,
  onContinue,
}: DateTimePickerProps) {
  const [mounted, setMounted] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const canProceedDatetime = !!selectedDate && !!selectedTime;

  if (!mounted) {
    return (
      <div className="flex justify-center py-10" id="hydration-waiting">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div key="datetime" custom={direction} variants={slide}
      id="datetime-picker-mounted"
      initial="enter" animate="center" exit="exit"
      transition={{ type: 'spring' as const, duration: 0.28, bounce: 0 }}
      className="flex flex-col"
    >
      <div className="pb-4">
        {/* Services recap chip — click to go back */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Повернутись до вибору послуг"
          className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/25 mb-5 w-full text-left active:scale-[0.95] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 flex-shrink-0">
            <Sparkles size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {selectedServices.length === 1
                ? selectedServices[0].name
                : pluralUk(selectedServices.length, 'послуга', 'послуги', 'послуг')}
            </p>
            <p className="text-xs text-muted-foreground/60">{formatDurationFull(effectiveDuration)} · {fmt(totalServicesPrice)}</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground/60 rotate-180 flex-shrink-0" />
        </button>

        {/* ── Date strip ── */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Дата</p>

        <div className="flex items-center gap-2 mb-5">
          <button
            type="button"
            disabled={scheduleLoading}
            onClick={() => {
              const base = selectedDate ?? days[0];
              const prev = addDays(base, -1);
              if (prev >= days[0]) onDateSelect(prev);
            }}
            className="w-11 h-11 rounded-full bg-secondary/50 border border-border flex items-center justify-center flex-shrink-0 hover:bg-secondary hover:text-foreground active:scale-[0.95] transition-all cursor-pointer disabled:opacity-50"
          >
            <ChevronLeft size={14} />
          </button>

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
                  type="button"
                  id={`day-${dateStr}`}
                  disabled={isDisabled}
                  onClick={() => { if (!isDisabled) onDateSelect(d); }}
                  className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl flex-shrink-0 min-w-[54px] transition-all cursor-pointer active:scale-[0.95] ${
                    isOff
                      ? 'bg-secondary/30 border border-dashed border-border cursor-not-allowed opacity-40'
                      : isFull
                      ? 'bg-destructive/10 border border-dashed border-destructive/30 text-destructive cursor-not-allowed'
                      : isSelected
                      ? 'bg-primary text-[var(--accent-on)] shadow-md'
                      : 'bg-secondary border border-border text-foreground hover:bg-secondary/80 hover:border-primary/40'
                  } ${scheduleLoading ? 'animate-pulse' : ''}`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-normal text-balance break-words text-center leading-tight ${
                    isOff ? 'text-muted-foreground/40' :
                    isFull ? 'text-destructive/50' :
                    isSelected ? 'text-[var(--accent-on)]/80' : 'text-muted-foreground'
                  }`}>
                    {isToday && !isDisabled ? 'Сьогодні' : DAY_S[d.getDay()]}
                  </span>
                  <span className={`text-base font-bold leading-none ${
                    isOff ? 'text-muted-foreground/30' : isFull ? 'text-destructive/60' : ''
                  }`}>
                    {d.getDate()}
                  </span>
                  {isOff ? (
                    <span className="text-[10px] font-bold text-muted-foreground/40 leading-none">вих.</span>
                  ) : isFull ? (
                    <span className="text-[10px] font-bold text-destructive bg-destructive/15 rounded-full px-1.5 py-0.5 leading-none">зайнято</span>
                  ) : (
                    <span className={`text-[10px] font-bold uppercase tracking-tight ${isSelected ? 'text-[var(--accent-on)]/70' : 'text-muted-foreground'}`}>
                      {MONTH_S[d.getMonth()]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={scheduleLoading}
            onClick={() => {
              const base = selectedDate ?? days[0];
              const next = addDays(base, 1);
              if (next <= days[days.length - 1]) onDateSelect(next);
            }}
            className="w-11 h-11 rounded-full bg-secondary/50 border border-border flex items-center justify-center flex-shrink-0 hover:bg-secondary hover:text-foreground active:scale-[0.95] transition-all cursor-pointer disabled:opacity-50"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {scheduleError ? (
          <div className="flex flex-col items-center gap-3 py-6 mb-4">
            <p className="text-sm text-destructive">Не вдалося завантажити розклад</p>
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-xs font-semibold active:scale-[0.95] transition-all cursor-pointer"
            >
              Спробувати знову
            </button>
          </div>
        ) : scheduleLoading ? (
          <div className="flex justify-center py-6 mb-4" data-testid="schedule-loader">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Time grid ── */}
            {selectedDate && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Час</p>

                {offDayDates.has(toISO(selectedDate)) ? (
                  <div className="flex flex-col items-center gap-2 py-8 rounded-xl bg-secondary/30 border border-dashed border-border">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-1 text-muted-foreground">
                      <Coffee size={28} />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Вихідний день</p>
                    <p className="text-xs text-muted-foreground">Оберіть інший день</p>
                  </div>
                ) : (() => {
                  const renderItems = buildSlotRenderItems(slots, selectedDayBreaks);
                  const hasAvail = renderItems.some(i => i.kind === 'slot');

                  if (!hasAvail) return (
                    <div className="flex flex-col items-center gap-2 py-8 rounded-xl bg-secondary/30 border border-dashed border-border">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-1 text-muted-foreground">
                        <Calendar size={28} />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Немає вільних слотів</p>
                      <p className="text-xs text-muted-foreground">Всі вікна зайняті</p>
                    </div>
                  );

                  return (
                    <div className="grid grid-cols-3 gap-3 mb-4" data-testid="slots-grid">
                      {renderItems.map((item, idx) =>
                        item.kind === 'break' ? (
                          <div key={`brk-${idx}`} className="col-span-3 flex items-center gap-2 py-0.5">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1.5 font-medium">
                              <Utensils size={11} strokeWidth={2.5} />
                              {item.label} · {item.start}–{item.end}
                            </span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                        ) : (() => {
                          const isSel  = selectedTime === item.slot.time;
                          const endTime = slotFromMins(slotToMins(item.slot.time) + effectiveDuration);
                          return (
                            <motion.button
                              key={item.slot.time}
                              layout={!prefersReduced}
                              animate={{
                                opacity: selectedTime && !isSel ? 0.55 : 1,
                              }}
                              transition={{
                                opacity: { duration: 0.15 },
                                layout: slotSpring,
                              }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onTimeSelect(item.slot.time)}
                              data-testid="time-slot"
                              aria-label={`${item.slot.time}–${endTime}`}
                              aria-pressed={isSel}
                              className={`relative rounded-xl text-center text-sm font-medium cursor-pointer overflow-hidden transition-colors ${
                                isSel
                                  ? 'bg-primary text-[var(--accent-on)] shadow-md ring-2 ring-primary/30 border-transparent py-4'
                                  : item.slot.isSuggested
                                  ? 'bg-primary/8 border border-primary/30 text-foreground py-3'
                                  : 'bg-secondary/60 text-foreground border border-border hover:bg-secondary hover:border-primary/30 py-3'
                              }`}
                            >
                              {isSel ? (
                                /* ─── Expanded selected state: 09:00 ──── 10:00 ─── */
                                <div className="flex items-center gap-2 px-2.5">
                                  <span className="text-sm font-bold leading-none flex-shrink-0">{item.slot.time}</span>
                                  <div className="flex-1 h-[2px] rounded-full bg-[var(--accent-on)]/20 overflow-hidden min-w-0">
                                    {!prefersReduced && (
                                      <motion.div
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={barSpring}
                                        className="h-full bg-[var(--accent-on)]/60 rounded-full origin-left"
                                      />
                                    )}
                                  </div>
                                  <span className="text-[11px] font-medium leading-none text-[var(--accent-on)]/75 flex-shrink-0">{endTime}</span>
                                </div>
                              ) : (
                                /* ─── Default / suggested state ─── */
                                <>
                                  {item.slot.isSuggested && (
                                    <span className="absolute -top-1.5 -right-1 bg-primary text-[var(--accent-on)] rounded-full p-1 shadow-sm flex items-center justify-center">
                                      <Star size={8} className="fill-current text-[var(--accent-on)]" />
                                    </span>
                                  )}
                                  <span className="block font-semibold">{item.slot.time}</span>
                                  <span className="block text-[11px] font-normal mt-0.5 text-muted-foreground">
                                    {endTime}
                                  </span>
                                </>
                              )}
                            </motion.button>
                          );
                        })()
                      )}
                    </div>
                  );
                })()}

                {/* Dynamic pricing badge */}
                {dynamicPricing?.label && mode === 'client' && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium mb-3 ${
                    dynamicPricing.modifier > 0
                      ? 'bg-destructive/10 text-destructive border border-destructive/25'
                      : 'bg-primary/10 text-primary border border-primary/25'
                  }`}>
                    {dynamicPricing.label}
                    <span className="ml-auto font-bold">{fmt(dynamicPricing.adjustedPrice)}</span>
                  </div>
                )}

                {/* Dynamic pricing toggle (master only) */}
                {mode === 'master' && dynamicPricing && dynamicPricing.adjustedPrice !== totalServicesPrice && selectedTime && (
                  <button
                    type="button"
                    onClick={onToggleDynamicPrice}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all mb-3 ${
                      useDynamicPrice
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-secondary/70 border-border hover:bg-secondary'
                    } active:scale-[0.95] cursor-pointer`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Застосувати динамічну ціну</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {dynamicPricing.label} → {fmt(dynamicPricing.adjustedPrice)}
                      </p>
                    </div>
                    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-3 ${
                      useDynamicPrice ? 'bg-primary' : 'bg-secondary/80'
                    }`}>
                      <motion.div
                        animate={{ x: useDynamicPrice ? 20 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-accent-on shadow-sm"
                      />
                    </div>
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Continue CTA */}
      <div className="pt-6 pb-2 sticky bottom-0 bg-gradient-to-t from-secondary via-secondary/90 to-transparent z-10">
        <button
          type="button"
          disabled={!canProceedDatetime}
          onClick={onContinue}
          data-testid="wizard-next-btn"
          className={`w-full py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all shadow-lg cursor-pointer ${
            canProceedDatetime
              ? 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] hover:opacity-90 active:scale-[0.95]'
              : 'bg-secondary/80 text-muted-foreground/40 cursor-not-allowed opacity-50'
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
