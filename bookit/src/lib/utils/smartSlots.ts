/**
 * Smart Slot Engine
 *
 * Core guarantee:
 *   A slot starting at T is valid ONLY when:
 *     T + requestedDuration + bufferMinutes <= next_event_start
 *   where "event" = an existing booking, a break window, or end of the working day.
 */

// ── Public types ──────────────────────────────────────────────────────────────

export interface TimeRange {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export interface GenerateSlotsParams {
  workStart: string;
  workEnd: string;
  bookings: TimeRange[];
  breaks: TimeRange[];
  bufferMinutes: number;
  requestedDuration: number;
  /** Grid step in minutes (default 30) */
  stepMinutes?: number;
}

/** Why a slot is unavailable — used for differentiated UI rendering */
export type SlotReason = 'available' | 'booked' | 'break' | 'buffer' | 'overflow';

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
  return (
    String(Math.floor(mins / 60)).padStart(2, '0') +
    ':' +
    String(mins % 60).padStart(2, '0')
  );
}

// ── Core slot generator ───────────────────────────────────────────────────────

/**
 * Returns every grid slot within the working day with `available` + `reason`.
 *
 * Reasons:
 *  'available' — slot is bookable
 *  'booked'    — slot overlaps an existing booking
 *  'break'     — slot overlaps a break/lunch window
 *  'buffer'    — slot itself is free but buffer after it conflicts with the next event
 *  'overflow'  — slot + duration extends past end of working day
 */
export function generateAvailableSlots(params: GenerateSlotsParams): SlotInfo[] {
  const {
    workStart,
    workEnd,
    bookings,
    breaks,
    bufferMinutes,
    requestedDuration,
    stepMinutes = 30,
  } = params;

  const workStartMin = toMins(workStart);
  const workEndMin   = toMins(workEnd);

  if (workStartMin >= workEndMin || requestedDuration <= 0) return [];

  const inWindow = (e: { start: number; end: number }) =>
    e.end > workStartMin && e.start < workEndMin;

  const bookingEvents = bookings
    .map(b => ({ start: toMins(b.start), end: toMins(b.end) }))
    .filter(inWindow)
    .sort((a, b) => a.start - b.start);

  const breakEvents = breaks
    .map(b => ({ start: toMins(b.start), end: toMins(b.end) }))
    .filter(inWindow)
    .sort((a, b) => a.start - b.start);

  const allEvents = [...bookingEvents, ...breakEvents].sort((a, b) => a.start - b.start);

  const result: SlotInfo[] = [];

  for (let t = workStartMin; t < workEndMin; t += stepMinutes) {
    const slotEnd = t + requestedDuration;

    // 1. Duration overflow
    if (slotEnd > workEndMin) {
      result.push({ time: fromMins(t), available: false, reason: 'overflow' });
      continue;
    }

    // 2. Booking overlap
    if (bookingEvents.some(e => e.end > t && e.start < slotEnd)) {
      result.push({ time: fromMins(t), available: false, reason: 'booked' });
      continue;
    }

    // 3. Break overlap
    if (breakEvents.some(e => e.end > t && e.start < slotEnd)) {
      result.push({ time: fromMins(t), available: false, reason: 'break' });
      continue;
    }

    // 4. Buffer — find next event that starts at or after slotEnd
    let nextEventStart = workEndMin;
    for (const e of allEvents) {
      if (e.start >= slotEnd && e.start < nextEventStart) {
        nextEventStart = e.start;
      }
    }

    if (slotEnd + bufferMinutes <= nextEventStart) {
      result.push({ time: fromMins(t), available: true, reason: 'available' });
    } else {
      result.push({ time: fromMins(t), available: false, reason: 'buffer' });
    }
  }

  return result;
}

// ── Break-separator renderer helper ──────────────────────────────────────────

export type SlotRenderItem =
  | { kind: 'slot';  slot: SlotWithScore }
  | { kind: 'break'; start: string; end: string; label: string };

/**
 * Converts a scored slot list into render items for the UI:
 *  - Available slots → 'slot' items (selectable buttons)
 *  - Consecutive break-reason slots → single 'break' separator
 *  - Booked / buffer / overflow slots → omitted (no visual clutter)
 *
 * Break windows with start between 11:00–15:00 are labelled "Обід",
 * others "Перерва".
 */
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
      // Find which break window owns this slot
      const slotMin = toMins(slot.time);
      const brk = breakWindows.find(b => b.start <= slotMin && slotMin < b.end);

      if (brk) {
        // Skip all slots that belong to this break window
        const brkEnd = brk.end;
        while (i < slots.length && toMins(slots[i].time) < brkEnd) i++;

        const startH = (brk.start / 60) | 0;
        const label = startH >= 11 && startH < 15 ? 'Обід' : 'Перерва';
        items.push({ kind: 'break', start: brk.raw.start, end: brk.raw.end, label });
      } else {
        i++; // orphan break slot — skip silently
      }
      continue;
    }

    if (slot.available) {
      items.push({ kind: 'slot', slot });
    }
    // booked / buffer / overflow → silently omitted

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
