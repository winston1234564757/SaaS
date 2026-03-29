import { useState, useCallback } from 'react';
import {
  format,
  addDays, addWeeks, addMonths, addYears,
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
} from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────

export type Preset = 'day' | 'week' | 'month' | 'year' | 'all';

export interface DateRangeState {
  preset:     Preset;
  offset:     number;
  startDate:  string;
  endDate:    string;
  label:      string;
  canGoNext:  boolean;
  setPreset:  (p: Preset) => void;
  goPrev:     () => void;
  goNext:     () => void;
}

// ── Locale helpers ────────────────────────────────────────────────────────────

const UA_MONTHS       = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const UA_MONTHS_SHORT = ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'];

// yyyy-MM-dd, no timezone shift
function toYMD(d: Date): string { return format(d, 'yyyy-MM-dd'); }

// ── Core range calculator ─────────────────────────────────────────────────────

export function computeRange(
  preset: Preset,
  offset: number,
): { start: Date; end: Date; label: string } {
  const now = new Date();

  if (preset === 'all') {
    return { start: new Date(2020, 0, 1), end: now, label: 'За весь час' };
  }

  if (preset === 'day') {
    const d = addDays(now, offset);
    const label =
      offset === 0  ? 'Сьогодні' :
      offset === -1 ? 'Вчора'    :
      `${d.getDate()} ${UA_MONTHS_SHORT[d.getMonth()]}`;
    return { start: startOfDay(d), end: endOfDay(d), label };
  }

  if (preset === 'week') {
    const d = addWeeks(now, offset);
    const s = startOfWeek(d, { weekStartsOn: 1 });
    const e = endOfWeek(d,   { weekStartsOn: 1 });
    const label =
      offset === 0  ? 'Цей тиждень'     :
      offset === -1 ? 'Минулий тиждень' :
      `${s.getDate()} ${UA_MONTHS_SHORT[s.getMonth()]}–${e.getDate()} ${UA_MONTHS_SHORT[e.getMonth()]}`;
    return { start: s, end: e, label };
  }

  if (preset === 'month') {
    const d = addMonths(now, offset);
    const s = startOfMonth(d);
    const e = endOfMonth(d);
    const label = `${UA_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    return { start: s, end: e, label };
  }

  // year
  const d = addYears(now, offset);
  return {
    start: startOfYear(d),
    end:   endOfYear(d),
    label: String(d.getFullYear()),
  };
}

export function getPrevPeriodRange(
  preset: Preset,
  offset: number,
): { startDate: string; endDate: string } | null {
  if (preset === 'all') return null;
  const { start, end } = computeRange(preset, offset - 1);
  return { startDate: toYMD(start), endDate: toYMD(end) };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDateRange(): DateRangeState {
  const [preset, setPresetState] = useState<Preset>('month');
  const [offset, setOffset]      = useState(0);

  const setPreset  = useCallback((p: Preset) => { setPresetState(p); setOffset(0); }, []);
  const goPrev     = useCallback(() => { if (preset !== 'all') setOffset(o => o - 1); }, [preset]);
  const goNext     = useCallback(() => {
    if (preset !== 'all') setOffset(o => Math.min(o + 1, 0));
  }, [preset]);

  const { start, end, label } = computeRange(preset, offset);

  return {
    preset, offset,
    startDate:  toYMD(start),
    endDate:    toYMD(end),
    label,
    canGoNext:  preset !== 'all' && offset < 0,
    setPreset,
    goPrev,
    goNext,
  };
}
