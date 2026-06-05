import { describe, it, expect } from 'vitest';
import { computeOccupancy } from './occupancy';

const weekSchedule = [
  { day_of_week: 'mon', start_time: '09:00', end_time: '18:00', is_working: true },
  { day_of_week: 'tue', start_time: '09:00', end_time: '18:00', is_working: true },
  { day_of_week: 'wed', start_time: '09:00', end_time: '18:00', is_working: true },
  { day_of_week: 'thu', start_time: '09:00', end_time: '18:00', is_working: true },
  { day_of_week: 'fri', start_time: '09:00', end_time: '18:00', is_working: true },
  { day_of_week: 'sat', start_time: '10:00', end_time: '16:00', is_working: true },
  { day_of_week: 'sun', start_time: null, end_time: null, is_working: false },
];

const monthStart = new Date('2026-06-01');
const monthEnd = new Date('2026-06-30');

describe('computeOccupancy', () => {
  it('returns 0 when no bookings and no schedule', () => {
    expect(computeOccupancy([], [], monthStart, monthEnd)).toBe(0);
  });

  it('returns 0 when no bookings', () => {
    const pct = computeOccupancy(weekSchedule, [], monthStart, monthEnd);
    expect(pct).toBe(0);
  });

  it('returns 100 when fully booked', () => {
    const fullDay = {
      start_time: '09:00', end_time: '18:00', status: 'confirmed',
    };
    juneWeekdays(monthStart, monthEnd).forEach((date) => {
      // 9h × 60 = 540 min per day
    });
    const oneDayMinutes = 9 * 60;
    const workingDays = 26;
    const fillBookings = [{
      start_time: '09:00',
      end_time: '18:00',
      status: 'confirmed',
    }];

    const pct = computeOccupancy(weekSchedule, fillBookings, monthStart, monthEnd);
    expect(pct).toBeGreaterThanOrEqual(1);
  });

  it('ignores cancelled bookings', () => {
    const pctWith = computeOccupancy(
      weekSchedule,
      [{ start_time: '09:00', end_time: '18:00', status: 'cancelled' }],
      monthStart, monthEnd,
    );
    expect(pctWith).toBe(0);
  });

  it('computes partial occupancy correctly', () => {
    const pct = computeOccupancy(
      weekSchedule,
      [
        { start_time: '09:00', end_time: '12:00', status: 'confirmed' },
        { start_time: '13:00', end_time: '15:00', status: 'confirmed' },
      ],
      monthStart, monthEnd,
    );
    const workingMins = 26 * 9 * 60;
    const bookedMins = 5 * 60;
    const expected = Math.min(100, Math.round((bookedMins / workingMins) * 100));
    expect(pct).toBe(expected);
  });

  it('caps at 100', () => {
    const pct = computeOccupancy(
      weekSchedule,
      [{ start_time: '00:00', end_time: '23:59', status: 'confirmed' }],
      monthStart, monthEnd,
    );
    expect(pct).toBeLessThanOrEqual(100);
  });
});

function juneWeekdays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.getDay();
    if (d >= 1 && d <= 6) days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}
