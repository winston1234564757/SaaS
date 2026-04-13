// src/components/shared/wizard/useBookingScheduleData.ts
import { useMemo, useEffect, type MutableRefObject } from 'react';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import {
  generateAvailableSlots, scoreSlots,
  type TimeRange,
} from '@/lib/utils/smartSlots';
import { buildOffDaySet } from '@/lib/utils/bookingEngine';
import type { WorkingHoursConfig } from '@/types/database';
import { DOW, toISO, getDays } from './helpers';
import type { WizardStep } from './types';

interface UseBookingScheduleDataParams {
  masterId: string;
  isOpen: boolean;
  step: WizardStep;
  effectiveDuration: number;
  selectedDate: Date | null;
  selectedDateRef: MutableRefObject<Date | null>;
  clientHistoryTimes: string[];
  workingHours?: WorkingHoursConfig | null;
  setSelectedDate: (d: Date) => void;
}

export function useBookingScheduleData({
  masterId, isOpen, step, effectiveDuration,
  selectedDate, selectedDateRef, clientHistoryTimes,
  workingHours, setSelectedDate,
}: UseBookingScheduleDataParams) {
  const days = useMemo(() => getDays(30), []);
  const fromDateStr = useMemo(() => toISO(days[0]), [days]);
  const toDateStr   = useMemo(() => toISO(days[days.length - 1]), [days]);

  const {
    data: scheduleStore,
    isLoading: scheduleLoading,
    isError: scheduleError,
    refetch: refetchSchedule,
  } = useWizardSchedule(isOpen ? masterId : null, fromDateStr, toDateStr);

  const offDayDates = useMemo(() => {
    if (!scheduleStore) return new Set<string>();
    return buildOffDaySet(
      Object.entries(scheduleStore.templates).map(([d, t]) => ({ day_of_week: d as any, is_working: t.is_working })),
      Object.entries(scheduleStore.exceptions).filter(([_, e]) => e.is_day_off).map(([d]) => ({ date: d })),
      days
    );
  }, [scheduleStore, days]);

  // ── Schedule-derived: breaks for selected date ────────────────────────────────
  const selectedDayBreaks = useMemo<TimeRange[]>(() => {
    if (!selectedDate || !scheduleStore) return [];
    const tpl = scheduleStore.templates[DOW[selectedDate.getDay()]];
    if (!tpl) return [];
    return [
      ...(tpl.break_start && tpl.break_end ? [{ start: tpl.break_start.slice(0, 5), end: tpl.break_end.slice(0, 5) }] : []),
      ...(workingHours?.breaks ?? []),
    ];
  }, [selectedDate, scheduleStore, workingHours]);

  // ── Schedule-derived: slots for selected date ─────────────────────────────────
  const slots = useMemo(() => {
    if (!selectedDate || !scheduleStore || effectiveDuration === 0) return [];
    const dateStr = toISO(selectedDate);
    if (offDayDates.has(dateStr)) return [];
    const tpl = scheduleStore.templates[DOW[selectedDate.getDay()]];
    if (!tpl) return [];
    const exc = scheduleStore.exceptions[dateStr];
    if (exc?.is_day_off) return [];
    const workStart = exc?.start_time?.slice(0, 5) ?? tpl.start_time.slice(0, 5);
    const workEnd   = exc?.end_time?.slice(0, 5)   ?? tpl.end_time.slice(0, 5);
    const raw = generateAvailableSlots({
      workStart, workEnd,
      bookings:          scheduleStore.bookingsByDate[dateStr] ?? [],
      breaks:            selectedDayBreaks,
      bufferMinutes:     workingHours?.buffer_time_minutes ?? 0,
      requestedDuration: effectiveDuration,
      stepMinutes:       15,
      selectedDate:      selectedDate,
    });
    return scoreSlots(raw, { clientHistoryTimes });
  }, [selectedDate, scheduleStore, offDayDates, effectiveDuration, selectedDayBreaks, workingHours, clientHistoryTimes]);

  // ── Schedule-derived: fully-booked dates ─────────────────────────────────────
  const fullyBookedDates = useMemo<Set<string>>(() => {
    if (!scheduleStore || effectiveDuration === 0) return new Set();
    const result = new Set<string>();
    for (const d of days) {
      const dateStr = toISO(d);
      if (offDayDates.has(dateStr)) continue;
      const tpl = scheduleStore.templates[DOW[d.getDay()]];
      if (!tpl) continue;
      const exc = scheduleStore.exceptions[dateStr];
      if (exc?.is_day_off) continue;
      const workStart = exc?.start_time?.slice(0, 5) ?? tpl.start_time.slice(0, 5);
      const workEnd   = exc?.end_time?.slice(0, 5)   ?? tpl.end_time.slice(0, 5);
      const dayBreaks: TimeRange[] = [
        ...(tpl.break_start && tpl.break_end ? [{ start: tpl.break_start.slice(0, 5), end: tpl.break_end.slice(0, 5) }] : []),
        ...(workingHours?.breaks ?? []),
      ];
      const s = generateAvailableSlots({
        workStart, workEnd,
        bookings:          scheduleStore.bookingsByDate[dateStr] ?? [],
        breaks:            dayBreaks,
        bufferMinutes:     workingHours?.buffer_time_minutes ?? 0,
        requestedDuration: effectiveDuration,
        stepMinutes:       15,
        selectedDate:      d,
      });
      if (!s.some(sl => sl.available)) result.add(dateStr);
    }
    return result;
  }, [scheduleStore, offDayDates, effectiveDuration, days, workingHours]);

  // ── Auto-focus: select first available day once pre-calc is done ─────────
  // Depends on fullyBookedDates (fires after month pre-calc finishes).
  // Only auto-selects when selectedDate is still null (never overrides user).
  useEffect(() => {
    if (step !== 'datetime' || !scheduleStore) return;
    if (selectedDateRef.current !== null) return;

    const firstAvailable = days.find(d => {
      const str = toISO(d);
      return !offDayDates.has(str) && !fullyBookedDates.has(str);
    });

    if (firstAvailable) setSelectedDate(firstAvailable);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, scheduleStore, fullyBookedDates, days, offDayDates]);

  // ── Scroll date strip whenever selectedDate changes ───────────────────────
  useEffect(() => {
    if (!selectedDate) return;
    const el = document.getElementById(`day-${toISO(selectedDate)}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedDate]);

  return {
    days,
    scheduleStore,
    scheduleLoading,
    scheduleError,
    refetchSchedule,
    offDayDates,
    selectedDayBreaks,
    slots,
    fullyBookedDates,
  };
}
