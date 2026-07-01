'use client';

import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { X, Loader2, Plus, Umbrella, CalendarOff, Clock, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';
import type { Schedule, DayKey } from '../hooks/useSettingsForm';
import { DAYS_ORDER } from '../hooks/useSettingsForm';
import type { TimeOffEntry } from '@/lib/supabase/hooks/useTimeOff';
import type { TimeOffType, AddTimeOffPayload } from '@/app/(master)/dashboard/settings/actions';

const DAYS_UA_SHORT: Record<DayKey, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд',
};

const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const;

const TYPES: { key: TimeOffType; label: string }[] = [
  { key: 'day_off',   label: 'Вихідний' },
  { key: 'vacation',  label: 'Відпустка' },
  { key: 'short_day', label: 'Короткий' },
];

const TYPE_ICONS: Record<TimeOffType, React.FC<{ size?: number; className?: string }>> = {
  vacation:  Umbrella,
  day_off:   CalendarOff,
  short_day: Clock,
};

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return format(new Date(y, m - 1, d), 'd MMM', { locale: uk });
}

function entryLabel(e: TimeOffEntry): string {
  if (e.type === 'vacation' && e.startDate !== e.endDate) {
    return `${formatDate(e.startDate)} — ${formatDate(e.endDate)}`;
  }
  return formatDate(e.startDate);
}

function entrySubLabel(e: TimeOffEntry): string {
  if (e.type === 'vacation')  return 'Відпустка';
  if (e.type === 'day_off')   return 'Вихідний';
  if (e.type === 'short_day') return `Короткий день · ${e.startTime}–${e.endTime}`;
  return '';
}

interface Props {
  schedule: Schedule;
  onToggleDay: (day: DayKey) => void;
  entries: TimeOffEntry[];
  isLoading: boolean;
  onAdd: (payload: AddTimeOffPayload) => void;
  onRemove: (id: string) => void;
  isAdding: boolean;
  addError: string | null;
}

export function VacationManagerView({
  schedule, onToggleDay, entries, isLoading, onAdd, onRemove, isAdding, addError,
}: Props) {
  const today = todayStr();
  const workingDays = DAYS_ORDER.filter(d => schedule[d].is_working).length;

  const [type, setType]           = useState<TimeOffType>('day_off');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime]     = useState('14:00');

  function resetForm() {
    setStartDate(''); setEndDate(''); setStartTime('09:00'); setEndTime('14:00');
  }
  function isFormValid(): boolean {
    if (!startDate || startDate < today) return false;
    if (type === 'vacation' && (!endDate || endDate < startDate)) return false;
    if (type === 'short_day' && (!startTime || !endTime || startTime >= endTime)) return false;
    return true;
  }
  function handleAdd() {
    if (!isFormValid()) return;
    onAdd({
      type,
      startDate,
      endDate: type === 'vacation' ? endDate : startDate,
      startTime: type === 'short_day' ? startTime : undefined,
      endTime:   type === 'short_day' ? endTime   : undefined,
    });
    resetForm();
  }

  const inputBase = 'min-w-0 px-3 py-2.5 rounded-xl bg-secondary border border-border text-xs text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors';
  const inputCls = `w-full ${inputBase}`;
  const labelCls = 'block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1';

  return (
    <div className="widget-card p-6 flex flex-col gap-6">
      {/* Header + hero summary */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
            <CalendarOff size={18} />
          </div>
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-widest text-text-sub leading-none mb-1">Вихідні та відпустки</h3>
            <p className="text-[10px] text-text-sub/80">Коли тебе немає — клієнти цього не забронюють</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="metric-value text-2xl text-foreground leading-none">{workingDays}<span className="text-sm text-text-sub font-bold"> / 7</span></p>
          <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest mt-0.5">робочих днів</p>
        </div>
      </div>

      {/* ── Weekly rhythm band (recurring days off) — full-width hero ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className={labelCls}>Робочий тиждень</p>
          <p className="text-[11px] text-text-sub">Тапни день, щоб зробити вихідним · години — у «Графік роботи»</p>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_ORDER.map(day => {
            const on = schedule[day].is_working;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onToggleDay(day)}
                aria-pressed={on}
                aria-label={`${DAYS_UA_SHORT[day]}: ${on ? 'робочий' : 'вихідний'}`}
                className={cn(
                  'flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-[0.94] cursor-pointer',
                  on
                    ? 'bg-accent/10 border-accent/25 text-foreground shadow-sm'
                    : 'bg-secondary/50 border-border text-text-sub',
                )}
              >
                <span className="text-xs font-bold uppercase tracking-tight">{DAYS_UA_SHORT[day]}</span>
                <span className={cn('text-[9px] font-bold uppercase tracking-widest', on ? 'text-success' : 'text-text-sub/60')}>
                  {on ? 'роб.' : 'вих.'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* ── One-off absences: list + add form ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Planned list */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Planned list */}
          {isLoading ? (
            <div className="flex flex-col gap-1.5">
              {[0, 1].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/40 animate-pulse">
                  <div className="size-2 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-28 rounded-full bg-muted" />
                    <div className="h-2.5 w-16 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-secondary/40 border border-dashed border-border">
              <Umbrella size={16} className="text-accent shrink-0" />
              <p className="text-xs text-text-sub leading-snug">
                Відпусток поки не заплановано. Запорука якісної роботи — якісний відпочинок.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className={labelCls}>Заплановано</p>
              <AnimatePresence mode="popLayout">
                {entries.map(e => {
                  const Icon = TYPE_ICONS[e.type];
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={SPRING}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/50 border border-border/60"
                    >
                      <span className="size-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                        <Icon size={14} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground leading-tight truncate">{entryLabel(e)}</p>
                        <p className="text-[11px] text-text-sub mt-0.5">{entrySubLabel(e)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(e.id)}
                        aria-label="Видалити"
                        className="size-9 flex items-center justify-center rounded-xl text-text-sub hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 active:scale-[0.88] cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Add form */}
        <div className="lg:col-span-5">
          <div className="flex flex-col gap-4 p-4 rounded-2xl bg-secondary/40 border border-border/60">
            <div className="flex items-center gap-2">
              <CalendarDays size={13} className="text-accent" />
              <p className="text-[11px] font-bold text-foreground">Додати відсутність</p>
            </div>

            <LayoutGroup id="vacation-type">
              <div className="flex gap-1 p-1 rounded-2xl bg-background/50">
                {TYPES.map(t => {
                  const isActive = type === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => { setType(t.key); resetForm(); }}
                      className={cn(
                        'relative flex-1 min-h-[40px] rounded-xl text-[11px] font-bold cursor-pointer transition-colors duration-100 active:scale-[0.96] flex items-center justify-center',
                        isActive ? 'text-accent-foreground' : 'text-text-sub hover:text-foreground',
                      )}
                    >
                      {isActive && <motion.div layoutId="vacation-type-indicator" className="absolute inset-0 rounded-xl bg-accent" transition={SPRING} />}
                      <span className="relative z-10">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>

            <div className={cn('gap-3', type === 'vacation' ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col')}>
              {type === 'vacation' ? (
                <>
                  <div className="min-w-0"><label className={labelCls}>Початок</label><input type="date" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} aria-label="Початок відпустки" className={inputCls} /></div>
                  <div className="min-w-0"><label className={labelCls}>Кінець</label><input type="date" value={endDate} min={startDate || today} onChange={e => setEndDate(e.target.value)} aria-label="Кінець відпустки" className={inputCls} /></div>
                </>
              ) : type === 'day_off' ? (
                <div className="min-w-0"><label className={labelCls}>Дата</label><input type="date" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} aria-label="Дата вихідного" className={inputCls} /></div>
              ) : (
                <>
                  <div className="min-w-0"><label className={labelCls}>Дата</label><input type="date" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} aria-label="Дата скороченого дня" className={inputCls} /></div>
                  <div className="min-w-0">
                    <label className={labelCls}>Години</label>
                    <div className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-secondary border border-border">
                      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} aria-label="Початок" className="w-[4.5rem] min-w-0 bg-transparent text-xs text-foreground outline-none" />
                      <span className="text-text-sub text-xs shrink-0">—</span>
                      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} aria-label="Кінець" className="w-[4.5rem] min-w-0 bg-transparent text-xs text-foreground outline-none" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {addError && <p className="text-[11px] text-destructive px-1">{addError}</p>}

            <button
              type="button"
              onClick={handleAdd}
              disabled={!isFormValid() || isAdding}
              className="w-full py-2.5 rounded-2xl text-xs font-bold bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
            >
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Зберегти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
