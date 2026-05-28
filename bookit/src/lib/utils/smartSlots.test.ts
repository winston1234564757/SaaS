import { describe, it, expect, vi } from 'vitest';
import { generateAvailableSlots, scoreSlots, buildSlotRenderItems, toMins, fromMins, type SlotInfo } from './smartSlots';

// ── Helpers ───────────────────────────────────────────────────────────────────

function available(slots: { time: string; available: boolean }[]) {
  return slots.filter(s => s.available).map(s => s.time);
}

// ── toMins / fromMins ─────────────────────────────────────────────────────────

describe('toMins / fromMins', () => {
  it('converts "09:00" → 540', () => expect(toMins('09:00')).toBe(540));
  it('converts "18:30" → 1110', () => expect(toMins('18:30')).toBe(1110));
  it('round-trips 00:00', () => expect(fromMins(toMins('00:00'))).toBe('00:00'));
  it('round-trips 23:30', () => expect(fromMins(toMins('23:30'))).toBe('23:30'));
});

// ── Basic availability ────────────────────────────────────────────────────────

describe('generateAvailableSlots – basic', () => {
  it('returns empty when workStart >= workEnd', () => {
    const slots = generateAvailableSlots({
      workStart: '18:00', workEnd: '09:00',
      bookings: [], breaks: [], bufferMinutes: 0, requestedDuration: 30,
    });
    expect(slots).toHaveLength(0);
  });

  it('marks all slots available in an empty day (no buffer)', () => {
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '11:00',
      bookings: [], breaks: [], bufferMinutes: 0, requestedDuration: 30,
    });
    expect(available(slots)).toEqual(['09:00', '09:30', '10:00', '10:30']);
  });

  it('last slot is unavailable when duration exceeds remaining time', () => {
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '10:00',
      bookings: [], breaks: [], bufferMinutes: 0, requestedDuration: 60,
    });
    // Only one 60-min slot fits: 09:00–10:00
    expect(available(slots)).toEqual(['09:00']);
  });

  it('no slots when duration > working window', () => {
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '10:00',
      bookings: [], breaks: [], bufferMinutes: 0, requestedDuration: 90,
    });
    expect(available(slots)).toHaveLength(0);
  });
});

// ── Overlap prevention ────────────────────────────────────────────────────────

describe('generateAvailableSlots – no overlaps', () => {
  it('blocks slot that starts inside an existing booking', () => {
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '12:00',
      bookings: [{ start: '09:30', end: '10:30' }],
      breaks: [], bufferMinutes: 0, requestedDuration: 30,
    });
    // 09:00 → ends 09:30 which is exactly where booking starts — boundary, should be OK
    // 09:30 → overlaps booking (09:30–10:30)
    // 10:00 → overlaps booking
    // 10:30 → booking ends, slot starts at 10:30 → OK
    // 11:00, 11:30 → OK
    expect(available(slots)).toEqual(['09:00', '10:30', '11:00', '11:30']);
  });

  it('blocks a multi-slot (60 min) request that partially overlaps a booking', () => {
    // Booking 11:00–12:00. Duration = 60 min.
    // Slot at 10:30 → would span 10:30–11:30 → overlaps booking → blocked
    // Slot at 09:00 → spans 09:00–10:00 → clear → available
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '14:00',
      bookings: [{ start: '11:00', end: '12:00' }],
      breaks: [], bufferMinutes: 0, requestedDuration: 60,
    });
    // Available: 09:00, 09:30, 10:00 (spans 10:00–11:00, edge at 11:00 — no overlap since booking starts AT 11:00), 12:00, 12:30, 13:00
    // 10:00 ends at 11:00 — booking starts at 11:00 → end <= booking.start → no overlap → available
    // 10:30 → ends 11:30 → overlaps [11:00,12:00) → blocked
    expect(available(slots)).toContain('09:00');
    expect(available(slots)).toContain('10:00');
    expect(available(slots)).not.toContain('10:30');
    expect(available(slots)).toContain('12:00');
  });

  it('guarantees no slot overlaps any returned booking window', () => {
    const bookings = [
      { start: '10:00', end: '11:00' },
      { start: '13:00', end: '14:30' },
    ];
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '18:00',
      bookings,
      breaks: [], bufferMinutes: 0, requestedDuration: 60,
    });

    for (const slot of slots.filter(s => s.available)) {
      const slotStart = toMins(slot.time);
      const slotEnd   = slotStart + 60;
      for (const b of bookings) {
        const bs = toMins(b.start);
        const be = toMins(b.end);
        // Overlap condition: slotStart < be AND slotEnd > bs
        const overlaps = slotStart < be && slotEnd > bs;
        expect(overlaps).toBe(false);
      }
    }
  });
});

// ── Buffer enforcement ────────────────────────────────────────────────────────

describe('generateAvailableSlots – buffer', () => {
  it('prevents a slot that cannot fit buffer before the next booking', () => {
    // Booking at 11:00. Duration = 30 min. Buffer = 10 min.
    // Slot at 10:00 → ends 10:30 → buffer requires next event >= 10:40 → booking at 11:00 >= 10:40 → OK
    // Slot at 10:30 → ends 11:00 → buffer requires next event >= 11:10 → booking at 11:00 < 11:10 → BLOCKED
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '12:00',
      bookings: [{ start: '11:00', end: '11:30' }],
      breaks: [], bufferMinutes: 10, requestedDuration: 30,
    });
    expect(available(slots)).toContain('10:00');
    expect(available(slots)).not.toContain('10:30');
  });

  it('prevents a slot that cannot fit buffer before end-of-day', () => {
    // WorkEnd 10:00. Duration = 30 min. Buffer = 15 min.
    // Slot at 09:30 → ends 10:00 → buffer requires workEnd >= 10:15 → 10:00 < 10:15 → BLOCKED
    // Slot at 09:00 → ends 09:30 → next event = workEnd 10:00 → 09:30 + 15 = 09:45 <= 10:00 → OK
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '10:00',
      bookings: [], breaks: [], bufferMinutes: 15, requestedDuration: 30,
    });
    expect(available(slots)).toEqual(['09:00']);
    expect(available(slots)).not.toContain('09:30');
  });

  it('with buffer=0 slot right before end-of-day is available', () => {
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '10:00',
      bookings: [], breaks: [], bufferMinutes: 0, requestedDuration: 30,
    });
    expect(available(slots)).toContain('09:30');
  });
});

// ── Past cutoff (Safety buffer) ────────────────────────────────────────────────────────

describe('generateAvailableSlots – past cutoff (today)', () => {
  it('filters out past slots with a safety buffer of 30 minutes on current date', () => {
    // Mock current time to 10:15
    const mockNow = new Date('2023-10-05T10:15:00');
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);

    const slots = generateAvailableSlots({
      selectedDate: '2023-10-05',
      workStart: '09:00', workEnd: '14:00',
      bookings: [], breaks: [], bufferMinutes: 0, requestedDuration: 30,
    });

    // Current time: 10:15. Buffer: 30 mins.
    // Cutoff = 10:45. Any slot starting < 10:45 is blocked (reason: past).
    // 09:00, 09:30, 10:00, 10:30 should be blocked.
    // 11:00 should be available.
    
    expect(available(slots)).not.toContain('10:00');
    expect(available(slots)).not.toContain('10:30');
    expect(available(slots)).toContain('11:00');
    expect(available(slots)).toContain('11:30');

    // Also check reasoning
    const tenThirtySlot = slots.find(s => s.time === '10:30');
    expect(tenThirtySlot?.reason).toBe('past');

    vi.useRealTimers();
  });

  it('ignores the safety buffer if selectedDate is not today', () => {
    // Current time: 15:45
    const mockNow = new Date('2023-10-05T15:45:00');
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);

    const slots = generateAvailableSlots({
      selectedDate: '2023-10-06', // Tomorrow
      workStart: '12:00', workEnd: '18:00',
      bookings: [], breaks: [], bufferMinutes: 0, requestedDuration: 30,
    });

    // Since selectedDate is tomorrow, the 12:00 slot configures ignoring the today buffer.
    expect(available(slots)).toContain('12:00');
    expect(available(slots)).toContain('12:30');

    vi.useRealTimers();
  });
});

// ── Break windows ─────────────────────────────────────────────────────────────

describe('generateAvailableSlots – breaks', () => {
  it('blocks slots that overlap a break window', () => {
    // Break 12:00–13:00. Duration = 30 min.
    // 11:30 → ends 12:00 → boundary, no overlap → OK (buffer=0)
    // 12:00 → overlaps break → blocked
    // 13:00 → OK
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '17:00',
      bookings: [], breaks: [{ start: '12:00', end: '13:00' }],
      bufferMinutes: 0, requestedDuration: 30,
    });
    expect(available(slots)).toContain('11:30');
    expect(available(slots)).not.toContain('12:00');
    expect(available(slots)).not.toContain('12:30');
    expect(available(slots)).toContain('13:00');
  });

  it('multiple breaks all block correctly', () => {
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '18:00',
      bookings: [],
      breaks: [
        { start: '11:00', end: '11:30' },
        { start: '14:00', end: '15:00' },
      ],
      bufferMinutes: 0, requestedDuration: 30,
    });
    expect(available(slots)).not.toContain('11:00');
    expect(available(slots)).not.toContain('14:00');
    expect(available(slots)).not.toContain('14:30');
    expect(available(slots)).toContain('10:30');
    expect(available(slots)).toContain('11:30');
    expect(available(slots)).toContain('15:00');
  });

  it('buffer also applies before break windows', () => {
    // Break at 13:00. Duration=30, buffer=15.
    // Slot at 12:30 → ends 13:00 → buffer requires next event (break start 13:00) >= 13:15 → 13:00 < 13:15 → BLOCKED
    // Slot at 12:00 → ends 12:30 → next event (break) at 13:00 → 12:30+15=12:45 <= 13:00 → OK
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '17:00',
      bookings: [],
      breaks: [{ start: '13:00', end: '14:00' }],
      bufferMinutes: 15, requestedDuration: 30,
    });
    expect(available(slots)).toContain('12:00');
    expect(available(slots)).not.toContain('12:30');
    expect(available(slots)).toContain('14:00');
  });
});

// ── Combined scenario ─────────────────────────────────────────────────────────

describe('generateAvailableSlots – combined', () => {
  it('real-world day: bookings + break + buffer, no overlaps', () => {
    // Day: 09:00–18:00, buffer=10min, duration=60min
    // Bookings: 10:00–11:00, 14:00–15:30
    // Break: 13:00–13:30
    const bookings = [
      { start: '10:00', end: '11:00' },
      { start: '14:00', end: '15:30' },
    ];
    const breaks = [{ start: '13:00', end: '13:30' }];
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '18:00',
      bookings, breaks, bufferMinutes: 10, requestedDuration: 60,
    });

    const avail = available(slots);

    // 09:00 → ends 10:00 → next event = booking 10:00 → 10:00+10=10:10 > 10:00 → BLOCKED
    // (slot ends exactly at booking start, but buffer = 10 → 10:00+10=10:10 > 10:00 → blocked)
    expect(avail).not.toContain('09:00');

    // 09:30 → spans 09:30–10:30 → overlaps booking 10:00–11:00 → BLOCKED
    expect(avail).not.toContain('09:30');

    // 11:00 → spans 11:00–12:00 → no overlap → next event = break 13:00 → 12:00+10=12:10 <= 13:00 → OK
    expect(avail).toContain('11:00');

    // 11:30 → spans 11:30–12:30 → next event = break 13:00 → 12:30+10=12:40 <= 13:00 → OK
    expect(avail).toContain('11:30');

    // 12:00 → spans 12:00–13:00 → boundary with break (break starts at 13:00, slot ends at 13:00) →
    // no overlap → next event = break 13:00 → 13:00+10=13:10 > 13:00 → BLOCKED
    expect(avail).not.toContain('12:00');

    // 13:30 → spans 13:30–14:30 → overlaps booking 14:00–15:30 → BLOCKED
    expect(avail).not.toContain('13:30');

    // 15:30 → spans 15:30–16:30 → no overlap → next event = workEnd 18:00 → 16:30+10=16:40 <= 18:00 → OK
    expect(avail).toContain('15:30');

    // Verify strictly: no available slot overlaps any booking or break
    const allEvents = [
      ...bookings.map(b => ({ start: toMins(b.start), end: toMins(b.end) })),
      ...breaks.map(b  => ({ start: toMins(b.start), end: toMins(b.end) })),
    ];
    for (const s of avail) {
      const st = toMins(s);
      const en = st + 60;
      for (const ev of allEvents) {
        expect(st < ev.end && en > ev.start).toBe(false);
      }
    }
  });
});

// ── buildSlotRenderItems ──────────────────────────────────────────────────────

describe('buildSlotRenderItems', () => {
  it('emits only available slots when no breaks', () => {
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '11:00',
      bookings: [], breaks: [], bufferMinutes: 0, requestedDuration: 30, stepMinutes: 30,
    });
    const scored = scoreSlots(slots);
    const items = buildSlotRenderItems(scored, []);
    expect(items.every(i => i.kind === 'slot')).toBe(true);
    expect(items.length).toBe(scored.filter(s => s.available).length);
  });

  it('collapses consecutive break slots into one break separator', () => {
    const breaks = [{ start: '12:00', end: '13:00' }];
    const slots = generateAvailableSlots({
      workStart: '11:00', workEnd: '14:00',
      bookings: [], breaks, bufferMinutes: 0, requestedDuration: 30, stepMinutes: 30,
    });
    const scored = scoreSlots(slots);
    const items = buildSlotRenderItems(scored, breaks);
    const breakItems = items.filter(i => i.kind === 'break');
    expect(breakItems.length).toBe(1);
    expect((breakItems[0] as any).start).toBe('12:00');
    expect((breakItems[0] as any).end).toBe('13:00');
  });

  it('labels break as "Обід" when it starts between 11:00 and 15:00', () => {
    const breaks = [{ start: '13:00', end: '14:00' }];
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '17:00',
      bookings: [], breaks, bufferMinutes: 0, requestedDuration: 30, stepMinutes: 30,
    });
    const items = buildSlotRenderItems(scoreSlots(slots), breaks);
    const brk = items.find(i => i.kind === 'break') as any;
    expect(brk?.label).toBe('Обід');
  });

  it('labels break as "Перерва" when outside lunch hours', () => {
    const breaks = [{ start: '16:00', end: '16:30' }];
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '18:00',
      bookings: [], breaks, bufferMinutes: 0, requestedDuration: 30, stepMinutes: 30,
    });
    const items = buildSlotRenderItems(scoreSlots(slots), breaks);
    const brk = items.find(i => i.kind === 'break') as any;
    expect(brk?.label).toBe('Перерва');
  });

  it('omits booked and buffer slots', () => {
    const slots = generateAvailableSlots({
      workStart: '09:00', workEnd: '12:00',
      bookings: [{ start: '10:00', end: '11:00' }],
      breaks: [], bufferMinutes: 15, requestedDuration: 30, stepMinutes: 30,
    });
    const items = buildSlotRenderItems(scoreSlots(slots), []);
    // Only 'slot' items (available) should appear — no booked/buffer
    expect(items.every(i => i.kind === 'slot')).toBe(true);
    for (const item of items) {
      if (item.kind === 'slot') expect(item.slot.available).toBe(true);
    }
  });
});

// ── scoreSlots ────────────────────────────────────────────────────────────────

describe('scoreSlots', () => {
  // Helper to create SlotInfo from simple objects
  function makeSlots(raw: { time: string; available: boolean }[]): SlotInfo[] {
    return raw.map(s => ({
      ...s,
      reason: s.available ? ('available' as const) : ('booked' as const),
    }));
  }

  const baseSlots: SlotInfo[] = makeSlots([
    { time: '09:00', available: true  },
    { time: '09:30', available: false },
    { time: '11:00', available: true  },
    { time: '15:00', available: true  },
    { time: '19:00', available: true  },
  ]);

  it('unavailable slots get score -999', () => {
    const scored = scoreSlots(baseSlots);
    expect(scored.find(s => s.time === '09:30')?.score).toBe(-999);
  });

  it('golden-hour slot scores higher than late slot', () => {
    const scored = scoreSlots(baseSlots);
    const golden = scored.find(s => s.time === '11:00')!;
    const late   = scored.find(s => s.time === '19:00')!;
    expect(golden.score).toBeGreaterThan(late.score);
  });

  it('marks at most MAX_SUGGESTIONS=3 slots as suggested', () => {
    const many: SlotInfo[] = Array.from({ length: 10 }, (_, i) => ({
      time: `${String(9 + i).padStart(2,'0')}:00`,
      available: true,
      reason: 'available' as const,
    }));
    const scored = scoreSlots(many);
    expect(scored.filter(s => s.isSuggested).length).toBeLessThanOrEqual(3);
  });

  it('no slots suggested if fewer than 3 available', () => {
    const few: SlotInfo[] = [
      { time: '10:00', available: true,  reason: 'available' },
      { time: '10:30', available: true,  reason: 'available' },
    ];
    const scored = scoreSlots(few);
    expect(scored.filter(s => s.isSuggested).length).toBe(0);
  });

  it('client history boosts matching hour', () => {
    const scored = scoreSlots(baseSlots, { clientHistoryTimes: ['11:00', '11:30', '11:00'] });
    const boosted = scored.find(s => s.time === '11:00')!;
    const normal  = scored.find(s => s.time === '15:00')!;
    expect(boosted.score).toBeGreaterThan(normal.score);
  });
});
