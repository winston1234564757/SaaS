'use client';

import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { getNow } from '@/lib/utils/now';
import { toMins } from '@/lib/utils/smartSlots';

interface DayBusyness {
  date: string;
  total: number;
  booked: number;
  rate: number;
}

interface BusynessResult {
  today: DayBusyness | null;
  week: DayBusyness;
  month: DayBusyness;
  days: DayBusyness[];
}

export function useBusyness() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const now = getNow();
  const today = format(now, 'yyyy-MM-dd');
  const weekEnd = format(addDays(now, 7), 'yyyy-MM-dd');
  const monthEnd = format(addDays(now, 30), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['busyness', masterId, today],
    queryFn: async () => {
      const supabase = createClient();

      const [bookingsRes, templatesRes, exceptionsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('date, status, start_time, end_time')
          .eq('master_id', masterId!)
          .gte('date', today)
          .lte('date', monthEnd)
          .neq('status', 'cancelled'),
        supabase
          .from('schedule_templates')
          .select('day_of_week, is_working, start_time, end_time, break_start, break_end')
          .eq('master_id', masterId!),
        supabase
          .from('schedule_exceptions')
          .select('date, is_day_off, start_time, end_time')
          .eq('master_id', masterId!)
          .gte('date', today)
          .lte('date', monthEnd),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (templatesRes.error) throw templatesRes.error;

      // Map templates by day of week
      const templates: Record<string, typeof templatesRes.data[number]> = {};
      for (const t of (templatesRes.data ?? [])) {
        templates[t.day_of_week] = t;
      }

      // Map exceptions by date
      const exceptions: Record<string, typeof exceptionsRes.data[number]> = {};
      for (const e of (exceptionsRes.data ?? [])) {
        exceptions[e.date] = e;
      }

      // Group bookings by date
      const bookingsByDate: Record<string, typeof bookingsRes.data> = {};
      for (const b of (bookingsRes.data ?? [])) {
        const d = b.date as string;
        if (!bookingsByDate[d]) bookingsByDate[d] = [];
        bookingsByDate[d].push(b);
      }

      const days: DayBusyness[] = [];
      for (let i = 0; i < 30; i++) {
        const date = addDays(now, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dow = String(date.getDay());
        const dayOfWeekStr = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];

        const exception = exceptions[dateStr];
        const template = templates[dayOfWeekStr];

        let isWorking = false;
        let startTime = '09:00';
        let endTime = '18:00';
        let breakStart: string | null = null;
        let breakEnd: string | null = null;

        if (exception) {
          isWorking = !exception.is_day_off;
          if (isWorking) {
            startTime = exception.start_time || '09:00';
            endTime = exception.end_time || '18:00';
          }
        } else if (template) {
          isWorking = template.is_working !== false;
          if (isWorking) {
            startTime = template.start_time || '09:00';
            endTime = template.end_time || '18:00';
            breakStart = template.break_start || null;
            breakEnd = template.break_end || null;
          }
        } else {
          // Default: weekend Saturday and Sunday, workdays Monday-Friday 09:00-18:00
          isWorking = dow !== '0' && dow !== '6';
        }

        if (!isWorking) continue;

        // Calculate working minutes
        const workDur = toMins(endTime.slice(0, 5)) - toMins(startTime.slice(0, 5));
        let breakDur = 0;
        if (breakStart && breakEnd) {
          breakDur = toMins(breakEnd.slice(0, 5)) - toMins(breakStart.slice(0, 5));
        }
        const totalWorkingMinutes = Math.max(0, workDur - breakDur);

        if (totalWorkingMinutes <= 0) continue;

        // Calculate booked minutes on this day
        const dayBookings = bookingsByDate[dateStr] ?? [];
        let totalBookedMinutes = 0;
        for (const b of dayBookings) {
          if (b.start_time && b.end_time) {
            const startMin = toMins(b.start_time.slice(0, 5));
            const endMin = toMins(b.end_time.slice(0, 5));
            totalBookedMinutes += Math.max(0, endMin - startMin);
          }
        }

        // Convert to 1-hour slots/hours for cleaner display
        const total = Math.max(1, Math.round(totalWorkingMinutes / 60));
        const booked = Math.min(total, Math.round(totalBookedMinutes / 60));
        const rate = Math.min(100, Math.round((totalBookedMinutes / totalWorkingMinutes) * 100));

        days.push({
          date: dateStr,
          total,
          booked,
          rate,
        });
      }

      const todayEntry = days.find(d => d.date === today) ?? null;

      const weekDays = days.filter(d => d.date <= weekEnd);
      const weekTotal = weekDays.reduce((s, d) => s + d.total, 0);
      const weekBooked = weekDays.reduce((s, d) => s + d.booked, 0);

      const monthTotal = days.reduce((s, d) => s + d.total, 0);
      const monthBooked = days.reduce((s, d) => s + d.booked, 0);

      return {
        today: todayEntry,
        week: {
          date: 'week',
          total: weekTotal,
          booked: weekBooked,
          rate: weekTotal > 0 ? Math.round((weekBooked / weekTotal) * 100) : 0,
        },
        month: {
          date: 'month',
          total: monthTotal,
          booked: monthBooked,
          rate: monthTotal > 0 ? Math.round((monthBooked / monthTotal) * 100) : 0,
        },
        days,
      } satisfies BusynessResult;
    },
    enabled: !!masterId,
    staleTime: 60_000,
    placeholderData: {
      today: null,
      week: { date: 'week', total: 0, booked: 0, rate: 0 },
      month: { date: 'month', total: 0, booked: 0, rate: 0 },
      days: [],
    } satisfies BusynessResult,
  });
}

