'use client';

import { motion, type Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Plus, X } from 'lucide-react';
import { DAYS_ORDER, DAYS_UA, BUFFER_PRESETS, TEMPLATE_SCHEDULE } from './types';
import type { DayKey, DaySchedule } from './types';

interface StepScheduleFormProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  schedule: Record<DayKey, DaySchedule>;
  bufferTime: number;
  breaks: Array<{ start: string; end: string }>;
  saving: boolean;
  onToggleDay: (day: DayKey) => void;
  onScheduleTimeChange: (day: DayKey, field: 'start_time' | 'end_time', val: string) => void;
  onBufferChange: (min: number) => void;
  onAddBreak: () => void;
  onRemoveBreak: (i: number) => void;
  onBreakFieldChange: (i: number, field: 'start' | 'end', val: string) => void;
  onApplyTemplate: () => void;
  onBack: () => void;
  onSave: () => void;
}

export function StepScheduleForm({
  direction,
  slideVariants,
  transition,
  schedule,
  bufferTime,
  breaks,
  saving,
  onToggleDay,
  onScheduleTimeChange,
  onBufferChange,
  onAddBreak,
  onRemoveBreak,
  onBreakFieldChange,
  onApplyTemplate,
  onBack,
  onSave,
}: StepScheduleFormProps) {
  return (
    <motion.div
      key="SCHEDULE_FORM"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="bento-card p-6"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors mb-4 active:scale-95 transition-all"
      >
        <ArrowLeft size={13} /> Назад
      </button>

      <h2 className="heading-serif text-xl text-foreground mb-0.5">Твій час</h2>
      <p className="text-sm text-muted-foreground/60 mb-4">Коли ти приймаєш клієнтів</p>

      {/* Quick template */}
      <button
        type="button"
        onClick={onApplyTemplate}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 mb-4 hover:bg-primary/15 transition-colors active:scale-95 transition-all"
      >
        <div className="text-left">
          <p className="text-xs font-semibold text-primary">Шаблон: Пн–Пт, 10:00–19:00</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Один клік — і розклад готовий</p>
        </div>
        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-xl flex-shrink-0">
          Застосувати
        </span>
      </button>

      {/* Day toggles */}
      <div className="flex flex-col gap-1.5 mb-5">
        {DAYS_ORDER.map(day => (
          <div
            key={day}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-opacity ${schedule[day].is_working ? '' : 'opacity-50'}`}
          >
            <button
              type="button"
              onClick={() => onToggleDay(day)}
              className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${schedule[day].is_working ? 'bg-primary' : 'bg-secondary/80'}`}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-[left] duration-200"
                style={{ left: schedule[day].is_working ? '17px' : '2px' }}
              />
            </button>
            <span className="text-sm font-medium text-foreground w-5 flex-shrink-0">{DAYS_UA[day]}</span>
            {schedule[day].is_working ? (
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="time"
                  value={schedule[day].start_time}
                  onChange={e => onScheduleTimeChange(day, 'start_time', e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-white/70 border border-white/80 text-xs text-foreground outline-none focus:border-primary"
                />
                <span className="text-xs text-muted-foreground/60">—</span>
                <input
                  type="time"
                  value={schedule[day].end_time}
                  onChange={e => onScheduleTimeChange(day, 'end_time', e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-white/70 border border-white/80 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/60">Вихідний</span>
            )}
          </div>
        ))}
      </div>

      {/* Buffer */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Буфер між записами</p>
        <div className="grid grid-cols-3 gap-1.5">
          {BUFFER_PRESETS.map(min => (
            <button
              key={min}
              type="button"
              onClick={() => onBufferChange(min)}
              className={`py-2 rounded-xl text-xs font-medium transition-all ${
                bufferTime === min ? 'bg-primary text-white' : 'bg-white/70 border border-white/80 text-muted-foreground hover:bg-white'
              }`}
            >
              {min === 0 ? 'Без буферу' : `${min} хв`}
            </button>
          ))}
        </div>
      </div>

      {/* Breaks */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground">Перерви</p>
          <button type="button" onClick={onAddBreak} className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/90 transition-colors active:scale-95 transition-all">
            <Plus size={12} /> Додати
          </button>
        </div>
        {breaks.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 py-1">Немає перерв — весь робочий час доступний</p>
        ) : (
          <div className="flex flex-col gap-2">
            {breaks.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="time" value={b.start} onChange={e => onBreakFieldChange(i, 'start', e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg bg-white/70 border border-white/80 text-xs text-foreground outline-none focus:border-primary" />
                <span className="text-xs text-muted-foreground/60">—</span>
                <input type="time" value={b.end} onChange={e => onBreakFieldChange(i, 'end', e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg bg-white/70 border border-white/80 text-xs text-foreground outline-none focus:border-primary" />
                <button type="button" onClick={() => onRemoveBreak(i)} className="text-muted-foreground/60 hover:text-destructive transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-70 active:scale-95 transition-all"
      >
        {saving
          ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
          : <>Налаштувати та продовжити <ArrowRight size={16} /></>}
      </button>
    </motion.div>
  );
}
