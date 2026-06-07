'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, ChevronDown, ChevronUp, Plus, Trash2, RefreshCw, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { format, startOfWeek, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { Schedule, DayKey } from '../hooks/useSettingsForm';
import { DAYS_ORDER } from '../hooks/useSettingsForm';

interface ScheduleWidgetProps {
  schedule: Schedule;
  bufferTime: number;
  breaks: any[];
  retentionCycleDays: number;
  occupancyData?: number[];
  busynessData?: any;
  onScheduleChange: (schedule: Schedule) => void;
  onBufferChange: (val: number) => void;
  onBreaksChange: (breaks: any[]) => void;
  onRetentionCycleDaysChange: (val: number) => void;
}

const DAYS_UA_SHORT: Record<DayKey, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд',
};
const DAYS_UA_FULL: Record<DayKey, string> = {
  mon: 'Понеділок', tue: 'Вівторок', wed: 'Середа', thu: 'Четвер', fri: "П'ятниця", sat: 'Субота', sun: 'Неділя',
};

export function ScheduleWidget({
  schedule,
  bufferTime,
  breaks,
  retentionCycleDays,
  occupancyData,
  busynessData,
  onScheduleChange,
  onBufferChange,
  onBreaksChange,
  onRetentionCycleDaysChange,
}: ScheduleWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  const getBusynessColor = (rate: number) => {
    if (rate < 40) return 'text-success';
    if (rate < 70) return 'text-warning';
    return 'text-error';
  };

  const getBusynessBarColor = (rate: number) => {
    if (rate < 40) return 'bg-success';
    if (rate < 70) return 'bg-warning';
    return 'bg-error';
  };

  const now = new Date();
  const dayIndex = now.getDay();
  const normalizedDayKey = dayIndex === 0 ? 'sun' : DAYS_ORDER[dayIndex - 1];
  const currentTime = format(now, 'HH:mm');
  const todaySchedule = schedule[normalizedDayKey] || schedule['mon'];
  const isWorkingToday = todaySchedule.is_working;
  const isWorkingNow = isWorkingToday &&
    currentTime >= todaySchedule.start_time &&
    currentTime <= todaySchedule.end_time;

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const maxBookings = occupancyData ? Math.max(...occupancyData, 1) : 1;

  const toggleDay = (day: DayKey) =>
    onScheduleChange({ ...schedule, [day]: { ...schedule[day], is_working: !schedule[day].is_working } });

  const setDayTime = (day: DayKey, field: 'start_time' | 'end_time', val: string) =>
    onScheduleChange({ ...schedule, [day]: { ...schedule[day], [field]: val } });

  return (
    <div className="widget-card overflow-hidden">
      {/* ── Summary (always visible) ── */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'size-9 rounded-2xl flex items-center justify-center shadow-md',
              isWorkingNow ? 'bg-success text-white' : 'bg-warning text-white',
            )}>
              <Clock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[11px] uppercase tracking-widest text-text-mute leading-none mb-1">
                Графік роботи
              </h3>
              <p className={cn('text-[10px] font-bold uppercase tracking-tighter', isWorkingNow ? 'text-success' : 'text-warning')}>
                {isWorkingNow ? 'Зараз працюю' : 'Зараз перерва'}
              </p>
            </div>
          </div>

          <button type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-secondary border border-border text-[11px] font-bold text-muted-foreground hover:bg-accent/5 hover:text-accent hover:border-accent/20 active:scale-[0.88] cursor-pointer transition-all shadow-sm"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Згорнути' : 'Налаштувати'}
          </button>
        </div>

        {/* Today hours */}
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            {isWorkingToday ? todaySchedule.start_time : '—'}
          </h2>
          <div className="w-8 h-[2px] bg-muted/40 rounded-full" />
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            {isWorkingToday ? todaySchedule.end_time : '—'}
          </h2>
          <p className="text-[11px] font-bold text-text-mute uppercase tracking-widest flex items-center gap-1.5 ml-2">
            <Calendar size={12} className="text-accent" />
            {isWorkingToday ? 'Сьогодні' : 'Вихідний'}
          </p>
        </div>

        {/* Week mini-visualization */}
        <div className="grid grid-cols-7 gap-1.5 px-0.5">
          {DAYS_ORDER.map((day, i) => {
            const isWorking = schedule[day].is_working;
            const isToday = day === normalizedDayKey;
            const jsDayIndex = i === 6 ? 0 : i + 1;
            const bookings = occupancyData ? occupancyData[jsDayIndex] : 0;
            const occupancy = isWorking ? (occupancyData ? Math.round((bookings / maxBookings) * 100) : 10) : 0;
            const fillLevel = `${Math.max(occupancy, isWorking ? 5 : 0)}%`;
            const statusColor = occupancy > 80 ? 'bg-error' : occupancy > 50 ? 'bg-warning' : 'bg-success';
            return (
              <div key={day} className="flex flex-col items-center gap-1.5">
                <span className={cn('text-[10px] font-bold uppercase tracking-tighter', isToday ? 'text-accent' : 'text-text-mute/30')}>
                  {DAYS_UA_SHORT[day]}
                </span>
                <div className={cn(
                  'w-full aspect-[4/8] rounded-full flex flex-col items-end justify-end border transition-all shadow-inner-sm relative overflow-hidden',
                  isWorking ? 'bg-secondary border-border' : 'bg-muted/10 border-transparent opacity-30',
                  isToday && 'ring-2 ring-accent ring-offset-2 scale-110 z-10 shadow-lg shadow-accent/10',
                )}>
                  {isWorking && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: fillLevel }}
                      className={cn('absolute bottom-0 inset-x-0 opacity-20', statusColor)}
                    />
                  )}
                </div>
                <span className={cn(
                  'text-[9px] font-bold leading-none',
                  isWorking ? (isToday ? 'text-accent' : 'text-text-mute/50') : 'text-transparent',
                )}>
                  {isWorking ? `${occupancy}%` : '0%'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Busyness Load Metrics (Week/Month) */}
        {busynessData && (
          <div className="mt-6 pt-4 border-t border-muted/20 space-y-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-text-mute uppercase tracking-widest">
                Завантаженість робочого часу
              </span>
            </div>

            <div className="space-y-3">
              {/* Week busyness */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">За цей тиждень</span>
                  <span className={cn("font-bold font-mono", getBusynessColor(busynessData.week.rate))}>
                    {busynessData.week.rate}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", getBusynessBarColor(busynessData.week.rate))}
                    initial={{ width: 0 }}
                    animate={{ width: `${busynessData.week.rate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[10px] text-text-mute">{busynessData.week.booked} з {busynessData.week.total} годин заповнено</p>
              </div>

              {/* Month busyness */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">За 30 днів</span>
                  <span className={cn("font-bold font-mono", getBusynessColor(busynessData.month.rate))}>
                    {busynessData.month.rate}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", getBusynessBarColor(busynessData.month.rate))}
                    initial={{ width: 0 }}
                    animate={{ width: `${busynessData.month.rate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
                <p className="text-[10px] text-text-mute">{busynessData.month.booked} з {busynessData.month.total} годин заповнено</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Inline editor (expandable) ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-muted/20 p-6 flex flex-col gap-6">

              {/* Weekly schedule rows */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">Дні та години</p>
                {DAYS_ORDER.map((day) => (
                  <div
                    key={day}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all',
                      schedule[day].is_working ? 'bg-secondary border-border shadow-sm' : 'bg-muted/10 border-transparent opacity-50',
                    )}
                  >
                    {/* Toggle */}
                    <button type="button"
                      onClick={() => toggleDay(day)}
                      aria-label={schedule[day].is_working ? 'Вимкнути' : 'Увімкнути'}
                      aria-pressed={schedule[day].is_working}
                      className={cn(
                        'relative rounded-full transition-colors shrink-0 active:scale-[0.88] cursor-pointer',
                        schedule[day].is_working ? 'bg-[var(--btn-primary-bg)]' : 'bg-muted-foreground/25',
                      )}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <motion.div
                        animate={{ x: schedule[day].is_working ? 21 : 3 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className="absolute top-[3px] left-0 size-4 rounded-full bg-white shadow-sm"
                      />
                    </button>

                    <span className="text-[11px] font-bold w-6 shrink-0">{DAYS_UA_SHORT[day]}</span>

                    {schedule[day].is_working ? (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                          type="time"
                          value={schedule[day].start_time}
                          onChange={(e) => setDayTime(day, 'start_time', e.target.value)}
                          aria-label={`Початок роботи ${DAYS_UA_SHORT[day]}`}
                          className="flex-1 min-w-0 px-2 py-1.5 rounded-xl bg-muted/20 border border-transparent focus:bg-secondary focus:border-accent/30 focus:ring-1 focus:ring-accent/20 outline-none text-xs font-medium text-center"
                        />
                        <span className="text-muted-foreground/30 text-xs shrink-0">—</span>
                        <input
                          type="time"
                          value={schedule[day].end_time}
                          onChange={(e) => setDayTime(day, 'end_time', e.target.value)}
                          aria-label={`Кінець роботи ${DAYS_UA_SHORT[day]}`}
                          className="flex-1 min-w-0 px-2 py-1.5 rounded-xl bg-muted/20 border border-transparent focus:bg-secondary focus:border-accent/30 focus:ring-1 focus:ring-accent/20 outline-none text-xs font-medium text-center"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/70 flex-1">Вихідний</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Buffer time */}
              <div className="p-5 rounded-2xl bg-accent/5 border border-accent/10">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={15} className="text-accent" />
                  <h4 className="text-sm font-bold">Час між клієнтами</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[0, 5, 10, 15, 20, 30, 45, 60].map((min) => (
                    <button type="button"
                      key={min}
                      onClick={() => onBufferChange(min)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.88] cursor-pointer',
                        bufferTime === min
                          ? 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] shadow-lg shadow-[var(--btn-primary-bg)]/20'
                          : 'bg-secondary border border-muted/30 text-muted-foreground hover:border-accent/30',
                      )}
                    >
                      {min === 0 ? 'Без буферу' : `${min} хв`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Retention cycle */}
              <div className="p-5 rounded-2xl bg-accent/5 border border-accent/10">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw size={15} className="text-accent" />
                  <h4 className="text-sm font-bold">Цикл повернення клієнта</h4>
                </div>
                <p className="text-[11px] text-muted-foreground/60 mb-3">
                  Через скільки днів клієнт вважається неактивним
                </p>
                <div className="flex flex-wrap gap-2">
                  {[14, 21, 30, 45, 60, 90].map((days) => (
                    <button type="button"
                      key={days}
                      onClick={() => onRetentionCycleDaysChange(days)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.88] cursor-pointer',
                        retentionCycleDays === days
                          ? 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] shadow-lg shadow-[var(--btn-primary-bg)]/20'
                          : 'bg-secondary border border-muted/30 text-muted-foreground hover:border-accent/30',
                      )}
                    >
                      {days} днів
                    </button>
                  ))}
                </div>
              </div>

              {/* Breaks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-muted-foreground/50" />
                    <h4 className="text-sm font-bold">Перерви</h4>
                  </div>
                  <button type="button"
                    onClick={() => onBreaksChange([...breaks, { start: '13:00', end: '14:00' }])}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent/10 text-accent text-xs font-bold active:scale-[0.88] cursor-pointer transition-all"
                  >
                    <Plus size={13} /> Додати
                  </button>
                </div>
                {breaks.length === 0 ? (
                  <div className="py-6 rounded-2xl border border-dashed border-muted/30 flex flex-col items-center justify-center text-muted-foreground/35 gap-1.5">
                    <Clock size={20} strokeWidth={1.2} />
                    <p className="text-[11px] font-medium">Перерв не додано</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {breaks.map((b, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-2xl bg-secondary border border-border/60 shadow-sm">
                        <input
                          type="time"
                          value={b.start}
                          onChange={(e) => {
                            const nb = [...breaks];
                            nb[i] = { ...nb[i], start: e.target.value };
                            onBreaksChange(nb);
                          }}
                          aria-label={`Початок перерви ${i + 1}`}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-muted/20 border border-transparent focus:bg-secondary focus:border-accent/30 focus:ring-1 focus:ring-accent/20 outline-none text-sm font-medium"
                        />
                        <span className="text-muted-foreground/30">—</span>
                        <input
                          type="time"
                          value={b.end}
                          onChange={(e) => {
                            const nb = [...breaks];
                            nb[i] = { ...nb[i], end: e.target.value };
                            onBreaksChange(nb);
                          }}
                          aria-label={`Кінець перерви ${i + 1}`}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-muted/20 border border-transparent focus:bg-secondary focus:border-accent/30 focus:ring-1 focus:ring-accent/20 outline-none text-sm font-medium"
                        />
                        <button type="button"
                          onClick={() => onBreaksChange(breaks.filter((_, idx) => idx !== i))}
                          aria-label="Видалити перерву"
                          className="size-9 rounded-xl bg-error/5 text-error flex items-center justify-center hover:bg-error/10 active:scale-[0.88] cursor-pointer transition-all shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
