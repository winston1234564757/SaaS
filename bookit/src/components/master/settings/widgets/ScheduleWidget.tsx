'use client';
// humanized

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, ChevronDown, ChevronUp, Plus, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getNow } from '@/lib/utils/now';
import { toMins } from '@/lib/utils/smartSlots';
import type { Schedule, DayKey } from '../hooks/useSettingsForm';
import { DAYS_ORDER } from '../hooks/useSettingsForm';

type LiveStatus = 'working' | 'break' | 'before' | 'after' | 'off';

interface DayBusyness {
  date: string;
  total: number;
  booked: number;
  rate: number;
}

interface ScheduleWidgetProps {
  schedule: Schedule;
  bufferTime: number;
  breaks: any[];
  busynessData?: {
    today: DayBusyness | null;
    week: DayBusyness;
    month: DayBusyness;
    days: DayBusyness[];
  };
  onScheduleChange: (schedule: Schedule) => void;
  onBufferChange: (val: number) => void;
  onBreaksChange: (breaks: any[]) => void;
}

const DAYS_UA_SHORT: Record<DayKey, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд',
};

const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const getBusynessColor = (rate: number) => {
  if (rate < 40) return 'text-[#0B6B2E]';
  if (rate < 70) return 'text-[#9A4508]';
  return 'text-destructive';
};

const getBusynessBarColor = (rate: number) => {
  if (rate < 40) return 'bg-success';
  if (rate < 70) return 'bg-warning';
  return 'bg-destructive';
};

export function ScheduleWidget({
  schedule,
  bufferTime,
  breaks,
  busynessData,
  onScheduleChange,
  onBufferChange,
  onBreaksChange,
}: ScheduleWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  const dayOccupancy = useMemo<Record<string, number>>(() => {
    if (!busynessData?.days?.length) return {};
    const groups: Record<string, { total: number; booked: number }> = {};
    for (const d of busynessData.days) {
      const dow = DOW_KEYS[new Date(d.date + 'T12:00:00').getDay()];
      if (!groups[dow]) groups[dow] = { total: 0, booked: 0 };
      groups[dow].total += d.total;
      groups[dow].booked += d.booked;
    }
    const result: Record<string, number> = {};
    for (const [dow, { total, booked }] of Object.entries(groups)) {
      result[dow] = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;
    }
    return result;
  }, [busynessData?.days]);

  const workingDays = DAYS_ORDER.filter(d => schedule[d].is_working).length;
  const weeklyHours = useMemo(() => DAYS_ORDER.reduce((acc, d) => {
    if (!schedule[d].is_working) return acc;
    const [sh, sm] = schedule[d].start_time.split(':').map(Number);
    const [eh, em] = schedule[d].end_time.split(':').map(Number);
    return acc + (eh + em / 60) - (sh + sm / 60);
  }, 0), [schedule]);

  // Live-tick so the status flips at open/close/break boundaries without a reload
  const [now, setNow] = useState(() => getNow());
  useEffect(() => {
    const id = setInterval(() => setNow(getNow()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dayIndex = now.getDay();
  const normalizedDayKey = dayIndex === 0 ? 'sun' : DAYS_ORDER[dayIndex - 1];
  const todaySchedule = schedule[normalizedDayKey] || schedule['mon'];
  const isWorkingToday = todaySchedule.is_working;

  const liveStatus: LiveStatus = useMemo(() => {
    if (!isWorkingToday) return 'off';
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const startMin = toMins(todaySchedule.start_time);
    const endMin = toMins(todaySchedule.end_time);
    if (nowMin < startMin) return 'before';
    if (nowMin >= endMin) return 'after';
    const onBreak = (breaks ?? []).some(
      (b) => b?.start && b?.end && nowMin >= toMins(b.start) && nowMin < toMins(b.end),
    );
    return onBreak ? 'break' : 'working';
  }, [isWorkingToday, now, todaySchedule.start_time, todaySchedule.end_time, breaks]);

  const STATUS_UI: Record<LiveStatus, { label: string; chip: string; text: string }> = {
    working: { label: 'Зараз працюю', chip: 'bg-success text-[var(--accent-on)]', text: 'text-[#0D6B2F]' },
    break:   { label: 'Зараз перерва', chip: 'bg-warning text-[var(--accent-on)]', text: 'text-[#92400E]' },
    before:  { label: `Відкриття о ${todaySchedule.start_time}`, chip: 'bg-secondary border border-border text-text-sub', text: 'text-text-sub' },
    after:   { label: 'Робочий день завершено', chip: 'bg-secondary border border-border text-text-sub', text: 'text-text-sub' },
    off:     { label: 'Сьогодні вихідний', chip: 'bg-secondary border border-border text-text-sub', text: 'text-text-sub' },
  };
  const statusUi = STATUS_UI[liveStatus];

  const setDayTime = (day: DayKey, field: 'start_time' | 'end_time', val: string) =>
    onScheduleChange({ ...schedule, [day]: { ...schedule[day], [field]: val } });

  /* ─── Summary panel (left) ─── */
  const summaryPanel = (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'size-9 rounded-2xl flex items-center justify-center shadow-md shrink-0',
            statusUi.chip,
          )}>
            <Clock size={18} />
          </div>
          <div>
            <h3 className="font-bold text-[11px] text-text-sub leading-none mb-1">
              Графік роботи
            </h3>
            <p className={cn('text-[10px] font-bold', statusUi.text)}>
              {statusUi.label}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          aria-controls="schedule-editor"
          className="lg:hidden flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-secondary border border-border text-[11px] font-bold text-text-sub hover:bg-accent/5 hover:text-accent hover:border-accent/20 active:scale-[0.88] cursor-pointer transition-all shadow-sm"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Згорнути' : 'Налаштувати'}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">
          {isWorkingToday ? todaySchedule.start_time : '—'}
        </h2>
        <div className="w-8 h-[2px] bg-muted/40 rounded-full" />
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">
          {isWorkingToday ? todaySchedule.end_time : '—'}
        </h2>
        <p className="text-[11px] font-bold text-text-sub flex items-center gap-1.5 ml-2">
          <Calendar size={12} className="text-accent" />
          {isWorkingToday ? 'Сьогодні' : 'Вихідний'}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1.5 px-0.5">
        {DAYS_ORDER.map((day) => {
          const isWorking = schedule[day].is_working;
          const isToday = day === normalizedDayKey;
          const occupancy = isWorking ? (dayOccupancy[day] ?? 0) : 0;
          const statusColor = occupancy >= 85 ? 'bg-success' : occupancy > 60 ? 'bg-warning' : occupancy >= 40 ? 'bg-info' : 'bg-destructive';
          return (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <span className={cn('text-[10px] font-bold', isToday ? 'text-accent' : 'text-text-sub')}>
                {DAYS_UA_SHORT[day]}
              </span>
              <div
                aria-label={`${DAYS_UA_SHORT[day]}: ${isWorking ? `${occupancy}%` : 'вихідний'}`}
                className={cn(
                  'w-full aspect-[4/8] rounded-full flex flex-col items-end justify-end border transition-all relative overflow-hidden',
                  isWorking ? 'bg-secondary border-border' : 'bg-muted/10 border-transparent opacity-30',
                  isToday && 'ring-2 ring-accent ring-offset-2 scale-110 z-10 shadow-lg shadow-accent/10',
                )}
              >
                {isWorking && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: occupancy / 100 }}
                    className={cn('absolute bottom-0 inset-x-0 h-full origin-bottom opacity-20', statusColor)}
                  />
                )}
              </div>
              <span className={cn('text-[9px] font-bold leading-none', isWorking ? (isToday ? 'text-accent' : 'text-text-sub') : 'text-transparent')}>
                {isWorking ? `${occupancy}%` : '0%'}
              </span>
            </div>
          );
        })}
      </div>

      {busynessData && (
        <div className="pt-4 border-t border-muted/20 space-y-4">
          <span className="text-[10px] font-bold text-text-sub">Завантаженість</span>
          <div className="space-y-3">
            {[
              { label: 'Тиждень', data: busynessData.week },
              { label: '30 днів', data: busynessData.month },
            ].map(({ label, data }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">{label}</span>
                  <span className={cn('font-bold font-mono', getBusynessColor(data.rate))}>{data.rate}%</span>
                </div>
                <div role="progressbar" aria-valuenow={data.rate} aria-valuemin={0} aria-valuemax={100} aria-label={`Завантаженість ${label}`}
                  className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={cn('h-full w-full origin-left', getBusynessBarColor(data.rate))}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: data.rate / 100 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ─── Days editor (right panel on desktop) ─── */
  const daysEditor = (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold text-text-sub">Години роботи</p>
        <p className="text-[10px] text-text-sub">вихідні — у «Вихідні та відпустки»</p>
      </div>
      {DAYS_ORDER.map((day) => (
        <div
          key={day}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all',
            schedule[day].is_working ? 'bg-secondary border-border shadow-sm' : 'bg-muted/10 border-transparent opacity-50',
          )}
        >
          <span className={cn('text-[11px] font-bold w-7 shrink-0', !schedule[day].is_working && 'text-text-sub')}>{DAYS_UA_SHORT[day]}</span>
          {schedule[day].is_working ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input type="time" value={schedule[day].start_time}
                onChange={(e) => setDayTime(day, 'start_time', e.target.value)}
                aria-label={`Початок роботи ${DAYS_UA_SHORT[day]}`}
                className="flex-1 min-w-0 px-2 py-1.5 rounded-xl bg-muted/20 border border-transparent focus:bg-secondary focus:border-accent/30 focus:ring-1 focus:ring-accent/20 outline-none text-xs font-medium text-center"
              />
              <span className="text-text-sub text-xs shrink-0">—</span>
              <input type="time" value={schedule[day].end_time}
                onChange={(e) => setDayTime(day, 'end_time', e.target.value)}
                aria-label={`Кінець роботи ${DAYS_UA_SHORT[day]}`}
                className="flex-1 min-w-0 px-2 py-1.5 rounded-xl bg-muted/20 border border-transparent focus:bg-secondary focus:border-accent/30 focus:ring-1 focus:ring-accent/20 outline-none text-xs font-medium text-center"
              />
            </div>
          ) : (
            <span className="text-[11px] text-text-sub flex-1">Вихідний</span>
          )}
        </div>
      ))}
    </div>
  );

  /* ─── Bottom panels (full-width on desktop) ─── */
  const bufferPanel = (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-accent shrink-0" />
        <h4 className="text-sm font-bold">Між клієнтами</h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[0, 5, 10, 15, 20, 30, 45, 60].map((min) => (
          <button type="button" key={min} onClick={() => onBufferChange(min)} aria-pressed={bufferTime === min}
            className={cn(
              'px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.88] cursor-pointer',
              bufferTime === min
                ? 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] shadow-lg shadow-[var(--btn-primary-bg)]/20'
                : 'bg-secondary border border-muted/30 text-text-sub hover:border-accent/30',
            )}
          >
            {min === 0 ? 'Без' : `${min} хв`}
          </button>
        ))}
      </div>
    </div>
  );

  const breaksPanel = (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-text-sub shrink-0" />
          <h4 className="text-sm font-bold">Перерви</h4>
        </div>
        <button type="button" onClick={() => onBreaksChange([...breaks, { start: '13:00', end: '14:00' }])}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 text-accent text-xs font-bold active:scale-[0.88] cursor-pointer transition-all"
        >
          <Plus size={12} /> Додати
        </button>
      </div>
      {breaks.length === 0 ? (
        <div className="flex-1 py-4 rounded-2xl border border-dashed border-muted/30 flex flex-col items-center justify-center text-text-sub gap-1.5">
          <Clock size={18} strokeWidth={1.2} />
          <p className="text-[11px] font-medium">Перерв не додано</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {breaks.map((b, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary border border-border/60 shadow-sm">
              <input type="time" value={b.start}
                onChange={(e) => { const nb = [...breaks]; nb[i] = { ...nb[i], start: e.target.value }; onBreaksChange(nb); }}
                aria-label={`Початок перерви ${i + 1}`}
                className="flex-1 px-2 py-1.5 rounded-lg bg-muted/20 border border-transparent focus:bg-secondary focus:border-accent/30 focus:ring-1 focus:ring-accent/20 outline-none text-xs font-medium"
              />
              <span className="text-text-sub text-xs shrink-0">—</span>
              <input type="time" value={b.end}
                onChange={(e) => { const nb = [...breaks]; nb[i] = { ...nb[i], end: e.target.value }; onBreaksChange(nb); }}
                aria-label={`Кінець перерви ${i + 1}`}
                className="flex-1 px-2 py-1.5 rounded-lg bg-muted/20 border border-transparent focus:bg-secondary focus:border-accent/30 focus:ring-1 focus:ring-accent/20 outline-none text-xs font-medium"
              />
              <button type="button" onClick={() => onBreaksChange(breaks.filter((_, idx) => idx !== i))} aria-label="Видалити перерву"
                className="size-8 rounded-lg bg-destructive/5 text-destructive flex items-center justify-center hover:bg-destructive/10 active:scale-[0.88] cursor-pointer transition-all shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const weeklyStatsPanel = (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-accent shrink-0" />
        <h4 className="text-sm font-bold">Підсумок тижня</h4>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        <div className="p-3 rounded-2xl bg-accent/5 border border-accent/10 flex flex-col justify-between">
          <p className="text-[10px] font-bold text-text-sub">Роб. днів</p>
          <p className="text-3xl font-bold tabular-nums text-accent">{workingDays}</p>
        </div>
        <div className="p-3 rounded-2xl bg-secondary border border-border flex flex-col justify-between">
          <p className="text-[10px] font-bold text-text-sub">Год/тиждень</p>
          <p className="text-3xl font-bold tabular-nums text-text-primary">{Math.round(weeklyHours)}</p>
        </div>
        <div className="col-span-2 p-3 rounded-2xl bg-muted/20 border border-border/60 flex items-center justify-between">
          <span className="text-xs font-bold text-text-sub">Приблизно за місяць</span>
          <span className="text-sm font-bold text-text-primary tabular-nums">
            ≈ {Math.round(weeklyHours * 4.33)} год
          </span>
        </div>
      </div>
    </div>
  );

  /* ─── Mobile editor panel (accordion) ─── */
  const mobileEditorPanel = (
    <div className="flex flex-col gap-6">
      {daysEditor}
      <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10">
        {bufferPanel}
      </div>
      <div>{breaksPanel}</div>
    </div>
  );

  return (
    <div className="widget-card overflow-hidden">
      {/* Desktop: 2-row layout — top 2-col, bottom full-width 3-col */}
      <div className="hidden lg:flex flex-col divide-y divide-border/20">
        <div className="flex divide-x divide-border/20">
          <div className="p-6 w-[38%] shrink-0">{summaryPanel}</div>
          <div className="p-6 flex-1 min-w-0">{daysEditor}</div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border/20">
          <div className="p-5">{bufferPanel}</div>
          <div className="p-5">{breaksPanel}</div>
          <div className="p-5">{weeklyStatsPanel}</div>
        </div>
      </div>

      {/* Mobile: summary + accordion */}
      <div className="lg:hidden">
        <div className="p-5">{summaryPanel}</div>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div id="schedule-editor" key="editor"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-muted/20 p-5">{mobileEditorPanel}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
