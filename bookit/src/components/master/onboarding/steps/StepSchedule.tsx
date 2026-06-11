'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DAYS_ORDER, DAYS_UA, TEMPLATE_SCHEDULE, type DayKey, type DaySchedule } from './types';

interface StepScheduleProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  schedule: Record<DayKey, DaySchedule>;
  saving: boolean;
  initialConfigured: boolean;
  onScheduleChange: (s: Record<DayKey, DaySchedule>) => void;
  onSave: () => void;
}

const TEMPLATE_LABEL = 'Пн–Сб, 10:00–19:00';
const springCta = { type: 'spring', stiffness: 380, damping: 30 } as const;

function getScheduleSummary(schedule: Record<DayKey, DaySchedule>): string {
  const working = DAYS_ORDER.filter(d => schedule[d].is_working);
  if (!working.length) return 'Немає робочих днів';
  const firstDay = DAYS_UA[working[0]];
  const lastDay = DAYS_UA[working[working.length - 1]];
  const dayStr = working.length > 2 ? `${firstDay}–${lastDay}` : working.map(d => DAYS_UA[d]).join(', ');
  const { start_time, end_time } = schedule[working[0]];
  return `${dayStr}, ${start_time}–${end_time}`;
}

export function StepSchedule({
  direction,
  slideVariants,
  transition,
  schedule,
  saving,
  initialConfigured,
  onScheduleChange,
  onSave,
}: StepScheduleProps) {
  const [isConfigured, setIsConfigured] = useState(initialConfigured);
  const [showForm, setShowForm] = useState(!initialConfigured);

  function useTemplate() {
    onScheduleChange({ ...TEMPLATE_SCHEDULE });
    setIsConfigured(true);
    setShowForm(false);
  }

  function toggleDay(day: DayKey) {
    onScheduleChange({
      ...schedule,
      [day]: { ...schedule[day], is_working: !schedule[day].is_working },
    });
  }

  function updateDayTime(day: DayKey, field: 'start_time' | 'end_time', value: string) {
    onScheduleChange({
      ...schedule,
      [day]: { ...schedule[day], [field]: value },
    });
  }

  function applyFirstToAll() {
    const first = DAYS_ORDER.find(d => schedule[d].is_working);
    if (!first) return;
    const { start_time, end_time } = schedule[first];
    const next = { ...schedule };
    DAYS_ORDER.forEach(d => {
      if (next[d].is_working) next[d] = { ...next[d], start_time, end_time };
    });
    onScheduleChange(next);
  }

  function handleSaveCustom() {
    setIsConfigured(true);
    setShowForm(false);
  }

  const firstWorkingDay = DAYS_ORDER.find(d => schedule[d].is_working);

  return (
    <motion.div
      key="SCHEDULE"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="bento-card p-6"
    >
      <h2 className="heading-serif text-xl text-foreground mb-0.5">Коли приймаєш?</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        Клієнти бачать тільки вільні слоти
      </p>

      {/* States A/B (not configured) and C (configured) */}
      <AnimatePresence mode="popLayout">
        {!isConfigured && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {/* One-tap default chip */}
            <button
              type="button"
              onClick={useTemplate}
              className="w-full flex items-center justify-between px-4 py-4 rounded-xl border transition-all cursor-pointer active:scale-[0.97] mb-3"
              style={{
                background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)',
              }}
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{TEMPLATE_LABEL}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Стандартний графік — можна змінити потім
                </p>
              </div>
              <div
                className="size-5 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
                style={{ background: 'var(--accent)' }}
              >
                <Check size={11} style={{ color: 'var(--accent-on)' }} strokeWidth={3} />
              </div>
            </button>

            {/* "Свій графік" toggle — only shown when form is collapsed */}
            {!showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                Свій графік
                <ChevronDown size={13} />
              </button>
            )}

            {/* Per-day custom schedule editor */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 flex flex-col">
                    {DAYS_ORDER.map(day => {
                      const d = schedule[day];
                      const isWorking = d.is_working;
                      const isFirst = day === firstWorkingDay;

                      return (
                        <div
                          key={day}
                          className={cn(
                            'flex items-center gap-2.5 px-1 py-2 rounded-lg transition-colors',
                            !isWorking && 'opacity-45',
                          )}
                        >
                          {/* Toggle dot */}
                          <button
                            type="button"
                            aria-pressed={isWorking}
                            onClick={() => toggleDay(day)}
                            className="w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                            style={isWorking
                              ? { borderColor: 'var(--accent)', background: 'var(--accent)' }
                              : { borderColor: 'var(--border)', background: 'transparent' }
                            }
                          >
                            {isWorking && (
                              <Check size={8} style={{ color: 'var(--accent-on)' }} strokeWidth={3.5} />
                            )}
                          </button>

                          {/* Day name */}
                          <span
                            className="text-xs font-semibold w-5 flex-shrink-0 select-none"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {DAYS_UA[day]}
                          </span>

                          {/* Time inputs or "вихідний" */}
                          {isWorking ? (
                            <div className="flex-1 flex items-center gap-1.5 min-w-0">
                              <input
                                type="time"
                                value={d.start_time}
                                onChange={e => updateDayTime(day, 'start_time', e.target.value)}
                                className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border text-[12px] text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-center"
                                style={{
                                  background: 'var(--secondary)',
                                  borderColor: 'var(--border)',
                                  colorScheme: 'light dark',
                                }}
                                aria-label={`${DAYS_UA[day]} — початок`}
                              />
                              <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>—</span>
                              <input
                                type="time"
                                value={d.end_time}
                                onChange={e => updateDayTime(day, 'end_time', e.target.value)}
                                className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border text-[12px] text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-center"
                                style={{
                                  background: 'var(--secondary)',
                                  borderColor: 'var(--border)',
                                  colorScheme: 'light dark',
                                }}
                                aria-label={`${DAYS_UA[day]} — кінець`}
                              />
                              {isFirst && (
                                <button
                                  type="button"
                                  onClick={applyFirstToAll}
                                  className="flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-medium cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                                  style={{
                                    background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                                    color: 'var(--accent)',
                                  }}
                                >
                                  до всіх
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] flex-1" style={{ color: 'var(--text-secondary)' }}>
                              вихідний
                            </span>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={handleSaveCustom}
                      className="mt-4 w-full py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.97]"
                      style={{ background: 'var(--btn-primary-bg, var(--accent))', color: 'var(--accent-on)' }}
                    >
                      Зберегти
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* State C — configured summary */}
        {isConfigured && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mb-1"
          >
            <div
              className="flex items-center gap-3 px-4 py-4 rounded-xl"
              style={{
                background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
                border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
              }}
            >
              <div
                className="size-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                <Check size={12} style={{ color: 'var(--accent-on)' }} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {getScheduleSummary(schedule)}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Графік налаштовано
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsConfigured(false); setShowForm(true); }}
                className="text-[11px] font-medium px-2 py-2 rounded-md transition-colors cursor-pointer flex-shrink-0"
                style={{ color: 'var(--text-secondary)' }}
              >
                Змінити
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {isConfigured && (
            <motion.button
              key="proceed"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={springCta}
              type="button"
              onClick={onSave}
              disabled={saving}
              className="w-full py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.97]"
              style={{ background: 'var(--btn-primary-bg, var(--accent))', color: 'var(--accent-on)' }}
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
                : <>Продовжити <ArrowRight size={15} /></>
              }
            </motion.button>
          )}
          {!isConfigured && !showForm && (
            <motion.button
              key="configure"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={springCta}
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full py-3.5 rounded-full font-semibold text-sm flex items-center justify-center transition-all cursor-pointer active:scale-[0.97] opacity-70"
              style={{ background: 'var(--btn-primary-bg, var(--accent))', color: 'var(--accent-on)' }}
            >
              Налаштувати
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
