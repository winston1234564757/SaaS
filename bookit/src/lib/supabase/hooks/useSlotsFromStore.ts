import { useMemo } from 'react';
import { generateAvailableSlots, type TimeRange } from '@/lib/utils/smartSlots';
import type { ScheduleStore } from './useWizardSchedule';
import type { WorkingHoursConfig } from '@/types/database';

const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function useSlotsFromStore(
  date: string | null,
  durationMin: number,
  bufferMin: number,
  workingHours: Partial<WorkingHoursConfig> | null,
  store: ScheduleStore | undefined,
): string[] {
  return useMemo(() => {
    if (!date || !store || durationMin <= 0) return [];

    const dow = DOW_KEYS[new Date(date + 'T12:00:00').getDay()];
    const tpl = store.templates[dow];
    if (!tpl?.is_working) return [];

    const exc = store.exceptions[date];
    if (exc?.is_day_off) return [];

    const breaks: TimeRange[] = [
      ...(tpl.break_start && tpl.break_end
        ? [{ start: tpl.break_start.slice(0, 5), end: tpl.break_end.slice(0, 5) }]
        : []),
      ...(workingHours?.breaks ?? []),
    ];

    const workStart = exc?.start_time?.slice(0, 5) ?? tpl.start_time.slice(0, 5);
    const workEnd   = exc?.end_time?.slice(0, 5)   ?? tpl.end_time.slice(0, 5);
    const selectedDate = new Date(date + 'T12:00:00');

    return generateAvailableSlots({
      workStart,
      workEnd,
      bookings: store.bookingsByDate[date] ?? [],
      breaks,
      bufferMinutes:     bufferMin,
      requestedDuration: durationMin,
      stepMinutes:       15,
      selectedDate,
    })
      .filter(s => s.available)
      .map(s => s.time);
  }, [date, durationMin, bufferMin, workingHours, store]);
}
