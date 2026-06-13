'use client';

import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { X, Loader2, Plus, Umbrella, Sun, Clock } from 'lucide-react';
import { useTimeOff, type TimeOffEntry } from '@/lib/supabase/hooks/useTimeOff';
import type { TimeOffType } from '@/app/(master)/dashboard/settings/actions';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

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

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors';
  const labelClass = 'text-[11px] font-medium text-muted-foreground mb-1.5 block';

  const TYPES: { key: TimeOffType; label: string }[] = [
    { key: 'day_off',   label: 'Вихідний' },
    { key: 'vacation',  label: 'Відпустка' },
    { key: 'short_day', label: 'Короткий день' },
  ];

  return (
    <div className="flex flex-col gap-4">

      {/* ── Entries list ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col gap-1.5">
          {[0, 1].map(i => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-secondary/40 animate-pulse">
              <div className="size-3 rounded-full bg-secondary/60 shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 w-28 rounded bg-secondary/60" />
                <div className="h-2.5 w-16 rounded bg-secondary/60" />
              </div>
              <div className="size-11 rounded-lg bg-secondary/60" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40">
          <Umbrella size={15} className="text-muted-foreground/60 shrink-0" />
          <p className="text-xs text-muted-foreground/60">
            Запорука якісної роботи — якісний відпочинок)
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium text-muted-foreground/60 px-1 mb-0.5">Заплановано</p>
          <AnimatePresence mode="popLayout">
            {entries.map(e => {
              const Icon = TYPE_ICONS[e.type];
              const color = TYPE_COLOR[e.type];
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={SPRING}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-secondary/40"
                >
                  <span style={{ color }} className="shrink-0 flex items-center">
                    <Icon size={13} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-tight truncate">
                      {entryLabel(e)}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60">{entrySubLabel(e)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    aria-label="Видалити"
                    className="size-11 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 active:scale-[0.88] cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Form (always visible) ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-4 rounded-2xl bg-secondary/50 border border-border">

        {/* Type selector */}
        <LayoutGroup id="vacation-tabs">
        <div className="grid grid-cols-3 gap-1.5">
          {TYPES.map(t => {
            const isActive = type === t.key;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => { setType(t.key); resetForm(); }}
                className={[
                  'relative min-h-[44px] px-1.5 py-2 rounded-xl text-[10px] font-medium border',
                  'transition-colors duration-150 cursor-pointer active:scale-[0.96] transform-gpu',
                  'flex items-center justify-center text-center leading-tight',
                  isActive
                    ? 'text-accent-foreground border-transparent'
                    : 'bg-background/60 text-muted-foreground border-border hover:border-accent/40',
                ].join(' ')}
              >
                {isActive && (
                  <motion.div
                    layoutId="vacation-type-active"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'var(--accent)' }}
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
        <div className="flex flex-col gap-3">
          {type === 'vacation' && (
            <>
              <div>
                <label className={labelClass}>Початок</label>
                <input
                  type="date" value={startDate} min={today}
                  onChange={e => setStartDate(e.target.value)}
                  aria-label="Початок відпустки"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Кінець</label>
                <input
                  type="date" value={endDate} min={startDate || today}
                  onChange={e => setEndDate(e.target.value)}
                  aria-label="Кінець відпустки"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {type === 'day_off' && (
            <div>
              <label className={labelClass}>Дата</label>
              <input
                type="date" value={startDate} min={today}
                onChange={e => setStartDate(e.target.value)}
                aria-label="Дата вихідного"
                className={inputClass}
              />
            </div>
          )}

          {type === 'short_day' && (
            <>
              <div>
                <label className={labelClass}>Дата</label>
                <input
                  type="date" value={startDate} min={today}
                  onChange={e => setStartDate(e.target.value)}
                  aria-label="Дата скороченого дня"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Від</label>
                  <input
                    type="time" value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    aria-label="Початок скороченого дня"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>До</label>
                  <input
                    type="time" value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    aria-label="Кінець скороченого дня"
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Error */}
        {addError && (
          <p className="text-[11px] text-destructive">{addError}</p>
        )}

        {/* Save */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!isFormValid() || isAdding}
          className="w-full py-2.5 rounded-xl text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
        >
          {isAdding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Зберегти
        </button>

      </div>
    </div>
  );
}
