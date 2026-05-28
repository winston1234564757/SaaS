function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

interface ScheduleEntry {
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  is_working: boolean;
}

interface BookingSlot {
  start_time: string;
  end_time: string;
  status: string;
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function computeOccupancy(
  schedule: ScheduleEntry[],
  bookings: BookingSlot[],
  monthStart: Date,
  monthEnd: Date,
): number {
  const byDay = Object.fromEntries(schedule.map(s => [s.day_of_week, s]));

  let totalWorkingMins = 0;
  const cur = new Date(monthStart);
  while (cur <= monthEnd) {
    const entry = byDay[DAY_KEYS[cur.getDay()]];
    if (entry?.is_working && entry.start_time && entry.end_time) {
      totalWorkingMins += Math.max(0, toMins(entry.end_time) - toMins(entry.start_time));
    }
    cur.setDate(cur.getDate() + 1);
  }

  const totalBookedMins = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + Math.max(0, toMins(b.end_time) - toMins(b.start_time)), 0);

  return totalWorkingMins > 0
    ? Math.min(100, Math.round((totalBookedMins / totalWorkingMins) * 100))
    : 0;
}
