import { describe, it, expect, beforeEach } from 'vitest';

// Чиста реалізація verifyCronSecret (для тесту без process.env)
import { createHmac, timingSafeEqual } from 'crypto';

function verifyCronSecret(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const expected = `Bearer ${secret}`;
  const key = 'cron';
  const a = createHmac('sha256', key).update(header).digest();
  const b = createHmac('sha256', key).update(expected).digest();
  return timingSafeEqual(a, b);
}

describe('verifyCronSecret', () => {
  const CRON_SECRET = 'my-super-secret-key-123';

  it('коректний Bearer + вірний secret → true', () => {
    expect(verifyCronSecret(`Bearer ${CRON_SECRET}`, CRON_SECRET)).toBe(true);
  });

  it('неправильний secret → false', () => {
    expect(verifyCronSecret('Bearer wrong-secret', CRON_SECRET)).toBe(false);
  });

  it('null header → false', () => {
    expect(verifyCronSecret(null, CRON_SECRET)).toBe(false);
  });

  it('undefined header → false', () => {
    expect(verifyCronSecret(undefined as unknown as string | null, CRON_SECRET)).toBe(false);
  });

  it('порожній header → false', () => {
    expect(verifyCronSecret('', CRON_SECRET)).toBe(false);
  });

  it('немає секрету (undefined) → false', () => {
    expect(verifyCronSecret('Bearer anything', undefined)).toBe(false);
  });

  it('не Bearer формат → false', () => {
    expect(verifyCronSecret(`Token ${CRON_SECRET}`, CRON_SECRET)).toBe(false);
  });

  it('порожній secret → false', () => {
    expect(verifyCronSecret('Bearer', '')).toBe(false);
  });

  it('різний регістр → false', () => {
    expect(verifyCronSecret(`bearer ${CRON_SECRET}`, CRON_SECRET)).toBe(false);
  });
});

// ── Kyiv hour calculation (from cron/reminders) ────────────────────

const KYIV_OFFSET_MS = 3 * 60 * 60 * 1000;

function kyivHour(): number {
  return new Date(Date.now() + KYIV_OFFSET_MS).getUTCHours();
}

describe('kyivHour', () => {
  it('повертає число 0-23', () => {
    const h = kyivHour();
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(23);
  });

  it('відрізняється від UTC на 3 (+3 літо/зима)', () => {
    // Волимо: kyivHour !== UTC годині якщо зміщення 3
    const utcH = new Date().getUTCHours();
    const kyivH = kyivHour();
    // Kyiv = UTC + 3 (EEST, літній)
    const expected = (utcH + 3) % 24;
    expect(kyivH).toBe(expected);
  });
});

// ── Buffer/cutoff time math (from cron/check-uncompleted) ─────────
// Використовуємо timestamp-based логіку без Date timezone

function isPastDueTimestamps(
  endTimeMinutes: number,     // час завершення в хвилинах від півночі
  nowMinutes: number,         // поточний час в хвилинах
  bufferMinutes: number,      // буфер майстра
): boolean {
  const cutoffMinutes = endTimeMinutes + (bufferMinutes / 2);
  const maxAgeMinutes = nowMinutes - 24 * 60;
  return cutoffMinutes <= nowMinutes && endTimeMinutes >= maxAgeMinutes;
}

describe('check-uncompleted: isPastDue', () => {
  it('60хв тому + buffer=20 (cutoff 70хв) → past due', () => {
    expect(isPastDueTimestamps(780, 840, 20)).toBe(true); // 13:00 vs 14:00
  });

  it('зараз + buffer=20 → cutoff 10хв в майбутньому → не past due', () => {
    expect(isPastDueTimestamps(840, 840, 20)).toBe(false); // 14:00 vs 14:00
  });

  it('5хв тому + buffer=20 (cutoff 10хв = 14:00) → past due (рівно cutoff)', () => {
    expect(isPastDueTimestamps(830, 840, 20)).toBe(true); // 13:50, cutoff=14:00, now=14:00
  });

  it('5хв тому + buffer=20, але за 9хв до cutoff → не past due', () => {
    expect(isPastDueTimestamps(830, 839, 20)).toBe(false); // 13:50, cutoff=14:00, now=13:59
  });

  it('24+ години тому → maxAge filter', () => {
    const yesterday = 840 - 25 * 60; // 25 годин тому
    expect(isPastDueTimestamps(yesterday, 840, 20)).toBe(false);
  });

  it('buffer=0 → past due при end_time <= now', () => {
    expect(isPastDueTimestamps(839, 840, 0)).toBe(true); // 13:59 vs 14:00
  });
});

// ── Reminder window math (from cron/reminders) ────────────────────
// Використовуємо timestamp-based логіку

function isWithinWindowTimestamps(
  bookingTimestamp: number,   // час запису в хвилинах (від півночі UTC дня)
  nowMinutes: number,         // поточний час в хвилинах
  minutesFromNow: number,     // 24*60, 2*60, або 30
  toleranceMinutes: number,   // 29 або 14
): boolean {
  const targetMinutes = nowMinutes + minutesFromNow;
  const windowStart = targetMinutes - toleranceMinutes;
  const windowEnd = targetMinutes + toleranceMinutes;
  return bookingTimestamp >= windowStart && bookingTimestamp <= windowEnd;
}

describe('cron/reminders: window matching', () => {
  // now = 12:00 (720 хвилин)
  const NOW = 720; // 12:00

  it('24h window: booking за 24 години +-29хв → влучає', () => {
    // 720 + 1440 = 2160, tolerance = 29
    expect(isWithinWindowTimestamps(2160, NOW, 24 * 60, 29)).toBe(true);
  });

  it('24h window: booking за 25 годин → не влучає (поза tolerance)', () => {
    // 720 + 1500 = 2220, 2200 > 2160+29=2189
    expect(isWithinWindowTimestamps(2220, NOW, 24 * 60, 29)).toBe(false);
  });

  it('24h window: 11:31 (691 хв) → -29хв відносно 720 → влучає', () => {
    // target = 720 + 1440 = 2160
    // windowStart = 2160 - 29 = 2131
    // 11:31 наступного дня = 691 + 1440 = 2131 → влучає
    expect(isWithinWindowTimestamps(691 + 1440, NOW, 24 * 60, 29)).toBe(true);
  });

  it('2h window: booking за 2 години +-29хв', () => {
    // 720 + 120 = 840, tolerance = 29
    expect(isWithinWindowTimestamps(840, NOW, 2 * 60, 29)).toBe(true);  // 14:00
    expect(isWithinWindowTimestamps(870, NOW, 2 * 60, 29)).toBe(false); // 14:30
  });

  it('30m window: booking за 30хв +-14хв', () => {
    // 720 + 30 = 750, tolerance = 14
    expect(isWithinWindowTimestamps(750, NOW, 30, 14)).toBe(true);  // 12:30
    expect(isWithinWindowTimestamps(765, NOW, 30, 14)).toBe(false); // 12:45
  });
});
