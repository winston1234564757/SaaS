import { toZonedTime } from 'date-fns-tz';
import { getNow } from './now';

/**
 * Smart Slot Engine (v2 - Bulletproof)
 * 
 * Strict timezone isolation, absolute overlap math, and duration-aware validation.
 */

// ── Public types ──────────────────────────────────────────────────────────────

export interface TimeRange {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export interface TimeOffEntry {
  type: 'vacation' | 'day_off' | 'short_day';
  startTime?: string | null;
  endTime?: string | null;
}

export interface GenerateSlotsParams {
  workStart: string;
  workEnd: string;
  bookings: TimeRange[];
  breaks: TimeRange[];
  bufferMinutes: number;
  requestedDuration: number;
  stepMinutes?: number;
  selectedDate?: string | Date;
  timeOff?: TimeOffEntry | null;
  /** Explicit timezone handling to prevent server/client leakage */
  timezone?: string; 
}

export type SlotReason = 'available' | 'booked' | 'break' | 'buffer' | 'overflow' | 'past';

export interface SlotInfo {
  time: string;
  available: boolean;
  reason: SlotReason;
}

export interface SlotWithScore extends SlotInfo {
  score: number;
  isSuggested: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fromMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Strict Collision Formula:
 * Two periods [S1, E1] and [S2, E2] overlap if:
 * S1 < E2 AND E1 > S2
 */
function isOverlapping(s1: number, e1: number, s2: number, e2: number): boolean {
  return s1 < e2 && e1 > s2;
}

// ── Core slot generator ───────────────────────────────────────────────────────

/**
 * Generates all possible slots based on working hours, bookings, and breaks.
 * Uses strict timezone isolation and atomic overlap checks.
 */
export function generateAvailableSlots(params: GenerateSlotsParams): SlotInfo[] {
  const {
    bookings,
    breaks,
    bufferMinutes,
    requestedDuration,
    stepMinutes = 30,
    selectedDate,
    timeOff,
    timezone = 'Europe/Kyiv'
  } = params;

  // 1. Time Off Handling (Vacation/Short Day)
  if (timeOff) {
    if (timeOff.type === 'vacation' || timeOff.type === 'day_off') return [];
    if (timeOff.type === 'short_day' && timeOff.startTime && timeOff.endTime) {
      params = { ...params, workStart: timeOff.startTime, workEnd: timeOff.endTime };
    }
  }

  const workStartMin = toMins(params.workStart);
  const workEndMin = toMins(params.workEnd);

  if (workStartMin >= workEndMin || requestedDuration <= 0) return [];

  // 2. Strict Timezone Cutoff (For today's slots)
  let minAllowedStart = 0;
  if (selectedDate) {
    const nowInTZ = toZonedTime(getNow(), timezone);
    
    // Build a comparable date string (YYYY-MM-DD) from the zoned object
    const year = nowInTZ.getFullYear();
    const month = String(nowInTZ.getMonth() + 1).padStart(2, '0');
    const day = String(nowInTZ.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    const selectedStr = typeof selectedDate === 'string' 
      ? selectedDate.split('T')[0] 
      : `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    if (selectedStr === todayStr) {
      const SAFETY_BUFFER_MINUTES = 30; 
      const currentMinutes = nowInTZ.getHours() * 60 + nowInTZ.getMinutes();
      minAllowedStart = currentMinutes + SAFETY_BUFFER_MINUTES;
    }
  }

  // 3. Normalize Events into Minutes
  const bookingBlocks = bookings.map(b => ({
    start: toMins(b.start),
    end: toMins(b.end)
  }));

  const breakBlocks = breaks.map(b => ({
    start: toMins(b.start),
    end: toMins(b.end)
  }));

  const result: SlotInfo[] = [];

  // 4. Grid Iteration
  for (let t = workStartMin; t < workEndMin; t += stepMinutes) {
    const slotStart = t;
    const slotEnd = t + requestedDuration;
    const totalBlockedEnd = slotEnd + bufferMinutes;

    // A. Past Cutoff
    if (slotStart < minAllowedStart) {
      result.push({ time: fromMins(t), available: false, reason: 'past' });
      continue;
    }

    // B. Working Day Overflow (The entire duration + buffer must fit)
    if (totalBlockedEnd > workEndMin) {
      // Check if specifically the service fits (even if buffer overflows)
      if (slotEnd > workEndMin) {
        result.push({ time: fromMins(t), available: false, reason: 'overflow' });
      } else {
        result.push({ time: fromMins(t), available: false, reason: 'buffer' });
      }
      continue;
    }

    // C. Booking Overlap Check
    // We check if [slotStart, totalBlockedEnd] overlaps any existing booking
    const bookingOverlap = bookingBlocks.some(b => isOverlapping(slotStart, totalBlockedEnd, b.start, b.end));
    if (bookingOverlap) {
      result.push({ time: fromMins(t), available: false, reason: 'booked' });
      continue;
    }

    // D. Break Overlap Check
    // We check if [slotStart, totalBlockedEnd] overlaps any break
    const breakOverlap = breakBlocks.some(b => isOverlapping(slotStart, totalBlockedEnd, b.start, b.end));
    if (breakOverlap) {
      result.push({ time: fromMins(t), available: false, reason: 'break' });
      continue;
    }

    // E. Succession Check (Atomic Logic)
    // If we passed all checks, the slot is available
    result.push({ time: fromMins(t), available: true, reason: 'available' });
  }

  return result;
}

// ── Break-separator renderer helper ──────────────────────────────────────────

export type SlotRenderItem =
  | { kind: 'slot';  slot: SlotWithScore }
  | { kind: 'break'; start: string; end: string; label: string };

export function buildSlotRenderItems(
  slots: SlotWithScore[],
  breaks: TimeRange[],
): SlotRenderItem[] {
  const items: SlotRenderItem[] = [];
  const breakWindows = breaks.map(b => ({ start: toMins(b.start), end: toMins(b.end), raw: b }));

  let i = 0;
  while (i < slots.length) {
    const slot = slots[i];

    if (slot.reason === 'break') {
      const slotMin = toMins(slot.time);
      const brk = breakWindows.find(b => b.start <= slotMin && slotMin < b.end);

      if (brk) {
        const brkEnd = brk.end;
        while (i < slots.length && toMins(slots[i].time) < brkEnd) i++;
        const startH = (brk.start / 60) | 0;
        const label = startH >= 11 && startH < 15 ? 'Обід' : 'Перерва';
        items.push({ kind: 'break', start: brk.raw.start, end: brk.raw.end, label });
      } else {
        i++;
      }
      continue;
    }

    if (slot.available) {
      items.push({ kind: 'slot', slot });
    }
    i++;
  }

  return items;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

const MAX_SUGGESTIONS = 3;

export function scoreSlots(
  slots: SlotInfo[],
  options: { clientHistoryTimes?: string[] } = {},
): SlotWithScore[] {
  const { clientHistoryTimes = [] } = options;

  const hourFreq: Record<number, number> = {};
  clientHistoryTimes.forEach(t => {
    const h = (toMins(t) / 60) | 0;
    hourFreq[h] = (hourFreq[h] ?? 0) + 1;
  });
  const maxFreq = Math.max(...Object.values(hourFreq), 0);

  const scored: SlotWithScore[] = slots.map(slot => {
    if (!slot.available) return { ...slot, score: -999, isSuggested: false };

    const mins = toMins(slot.time);
    const hour = (mins / 60) | 0;
    let score = 0;

    if (maxFreq > 0 && hourFreq[hour]) score += Math.round(3 * (hourFreq[hour] / maxFreq));
    if (hour >= 10 && hour < 14)       score += 2;
    else if (hour >= 14 && hour < 18)  score += 1;
    if (mins < 570)  score -= 1;
    if (hour >= 18)  score -= 1;

    return { ...slot, score, isSuggested: false };
  });

  const available = scored.filter(s => s.available).sort((a, b) => b.score - a.score);
  const topScore  = available[0]?.score ?? 0;

  if (available.length >= 3 && topScore > 0) {
    let count = 0;
    for (const s of available) {
      if (count >= MAX_SUGGESTIONS) break;
      if (s.score >= topScore - 1) {
        const target = scored.find(x => x.time === s.time);
        if (target) { target.isSuggested = true; count++; }
      }
    }
  }

  return scored;
}
