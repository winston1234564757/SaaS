'use client';

import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { X, Loader2, Plus, Umbrella, Sun, Clock } from 'lucide-react';
import { useTimeOff, type TimeOffEntry } from '@/lib/supabase/hooks/useTimeOff';
import type { TimeOffType } from '@/app/(master)/dashboard/settings/actions';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return format(new Date(y, m - 1, d), 'd MMMM yyyy', { locale: uk });
}

function entryLabel(e: TimeOffEntry): string {
  if (e.type === 'vacation') {
    if (e.startDate === e.endDate) return formatDate(e.startDate);
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

const TYPE_ICONS: Record<TimeOffType, React.FC<{ size?: number; className?: string }>> = {
  vacation:  Umbrella,
  day_off:   Sun,
  short_day: Clock,
};

const TYPE_COLOR: Record<TimeOffType, string> = {
  vacation:  'var(--info)',
  day_off:   'var(--warning)',
  short_day: 'var(--success)',
};

const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const;

const TYPES: { key: TimeOffType; label: string }[] = [
  { key: 'day_off',   label: 'Вихідний' },
  { key: 'vacation',  label: 'Відпустка' },
  { key: 'short_day', label: 'Короткий' },
];

export function VacationManager() {
  const { entries, isLoading, add, remove, isAdding, addError } = useTimeOff();

  const today = todayStr();

  const [type, setType]           = useState<TimeOffType>('day_off');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime]     = useState('14:00');

  function resetForm() {
    setStartDate('');
    setEndDate('');
    setStartTime('09:00');
    setEndTime('14:00');
  }

  function isFormValid(): boolean {
    if (!startDate || startDate < today) return false;
    if (type === 'vacation' && (!endDate || endDate < startDate)) return false;
    if (type === 'short_day' && (!startTime || !endTime || startTime >= endTime)) return false;
    return true;
  }

  function handleAdd() {
    if (!isFormValid()) return;
    add({
      type,
      startDate,
      endDate: type === 'vacation' ? endDate : startDate,
      startTime: type === 'short_day' ? startTime : undefined,
      endTime:   type === 'short_day' ? endTime   : undefined,
    });
    resetForm();
  }

  const inputCls =
    'w-full px-3 py-2 rounded-xl bg-background/60 border border-border text-xs text-foreground ' +
    'outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors';
  const labelCls = 'block text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1';

  return (
    <div className="flex flex-col gap-4">

      {/* Entries */}
      {isLoading ? (
        <div className="flex flex-col gap-1.5">
          {[0, 1].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/40 animate-pulse">
              <div className="size-2 rounded-full bg-muted shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 w-28 rounded-full bg-muted" />
                <div className="h-2.5 w-16 rounded-full bg-muted" />
              </div>
              <div className="size-10 rounded-xl bg-muted shrink-0" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-secondary/30 border border-border/40">
          <Umbrella size={14} className="text-muted-foreground/40 shrink-0" />
          <p className="text-xs text-muted-foreground/50 leading-snug">
            Запорука якісної роботи — якісний відпочинок
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-1 mb-0.5">
            Заплановано
          </p>
          <AnimatePresence mode="popLayout">
            {entries.map(e => {
              const Icon = TYPE_ICONS[e.type];
              const color = TYPE_COLOR[e.type];
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={SPRING}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/40"
                >
                  <span style={{ color }} className="shrink-0">
                    <Icon size={12} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-tight truncate">
                      {entryLabel(e)}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">{entrySubLabel(e)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    aria-label="Видалити"
                    className="size-10 flex items-center justify-center rounded-xl text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 active:scale-[0.88] cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Form */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-secondary/40 border border-border/60">

        {/* Type tabs — flex-1 guarantees equal width + height */}
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
                    'relative flex-1 min-h-[44px] rounded-xl text-[11px] font-medium cursor-pointer',
                    'transition-colors duration-100 active:scale-[0.96] transform-gpu',
                    'flex items-center justify-center text-center leading-snug px-1',
                    isActive
                      ? 'text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground/80',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="vacation-type-indicator"
                      className="absolute inset-0 rounded-xl bg-accent"
                      transition={SPRING}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          {type === 'vacation' && (
            <>
              <div>
                <label className={labelCls}>Початок</label>
                <input
                  type="date" value={startDate} min={today}
                  onChange={e => setStartDate(e.target.value)}
                  aria-label="Початок відпустки"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Кінець</label>
                <input
                  type="date" value={endDate} min={startDate || today}
                  onChange={e => setEndDate(e.target.value)}
                  aria-label="Кінець відпустки"
                  className={inputCls}
                />
              </div>
            </>
          )}

          {type === 'day_off' && (
            <div>
              <label className={labelCls}>Дата</label>
              <input
                type="date" value={startDate} min={today}
                onChange={e => setStartDate(e.target.value)}
                aria-label="Дата вихідного"
                className={inputCls}
              />
            </div>
          )}

          {type === 'short_day' && (
            <>
              <div>
                <label className={labelCls}>Дата</label>
                <input
                  type="date" value={startDate} min={today}
                  onChange={e => setStartDate(e.target.value)}
                  aria-label="Дата скороченого дня"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Від</label>
                  <input
                    type="time" value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    aria-label="Початок скороченого дня"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>До</label>
                  <input
                    type="time" value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    aria-label="Кінець скороченого дня"
                    className={inputCls}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {addError && (
          <p className="text-[11px] text-destructive px-1">{addError}</p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={!isFormValid() || isAdding}
          className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
        >
          {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Зберегти
        </button>

      </div>
    </div>
  );
}
