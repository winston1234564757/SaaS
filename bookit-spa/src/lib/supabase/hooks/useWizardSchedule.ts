import { useQuery } from '@tanstack/react-query';
import { supabase } from '../client';
import type { TimeRange } from '@/lib/utils/smartSlots';

export interface ScheduleStore {
  templates: Record<string, {
    start_time: string; end_time: string;
    break_start: string | null; break_end: string | null;
    is_working: boolean;
  }>;
  exceptions: Record<string, {
    is_day_off: boolean; start_time: string | null; end_time: string | null;
  }>;
  bookingsByDate: Record<string, TimeRange[]>;
}

export function useWizardSchedule(masterId: string | undefined | null, from: string, to: string) {
  return useQuery({
    queryKey: ['wizard-schedule', masterId, from, to],
    queryFn: async () => {
      if (!masterId) throw new Error('No masterId');
      const [tmplRes, excRes, bookRes, timeOffRes] = await Promise.all([
        supabase.from('schedule_templates')
          .select('day_of_week, is_working, start_time, end_time, break_start, break_end')
          .eq('master_id', masterId),
        supabase.from('schedule_exceptions')
          .select('date, is_day_off, start_time, end_time')
          .eq('master_id', masterId).gte('date', from).lte('date', to),
        supabase.from('bookings')
          .select('date, start_time, end_time')
          .eq('master_id', masterId).neq('status', 'cancelled')
          .gte('date', from).lte('date', to),
        supabase.from('master_time_off')
          .select('type, start_date, end_date, start_time, end_time')
          .eq('master_id', masterId).lte('start_date', to).gte('end_date', from),
      ]);

      if (tmplRes.error) throw tmplRes.error;
      if (excRes.error)  throw excRes.error;
      if (bookRes.error) throw bookRes.error;
      // timeOffRes помилки не кидаємо — таблиця може ще не існувати на старих середовищах

      const templates: ScheduleStore['templates'] = {};
      for (const t of (tmplRes.data ?? [])) {
        templates[t.day_of_week] = {
          start_time: t.start_time, end_time: t.end_time,
          break_start: t.break_start ?? null, break_end: t.break_end ?? null,
          is_working: t.is_working !== false,
        };
      }

      const exceptions: ScheduleStore['exceptions'] = {};

      // 1. Базові schedule_exceptions
      for (const e of (excRes.data ?? [])) {
        exceptions[e.date] = {
          is_day_off: e.is_day_off,
          start_time: e.start_time ?? null, end_time: e.end_time ?? null,
        };
      }

      // 2. master_time_off — перезаписує / доповнює (вищий пріоритет)
      for (const toff of (timeOffRes.data ?? [])) {
        // Розгортаємо діапазон vacation у окремі дати
        let cur = new Date(toff.start_date + 'T00:00:00');
        const last = new Date(toff.end_date + 'T00:00:00');
        while (cur <= last) {
          const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
          if (dateStr >= from && dateStr <= to) {
            if (toff.type === 'vacation' || toff.type === 'day_off') {
              exceptions[dateStr] = { is_day_off: true, start_time: null, end_time: null };
            } else if (toff.type === 'short_day') {
              exceptions[dateStr] = {
                is_day_off: false,
                start_time: toff.start_time ? (toff.start_time as string).slice(0, 5) : null,
                end_time:   toff.end_time   ? (toff.end_time   as string).slice(0, 5) : null,
              };
            }
          }
          cur.setDate(cur.getDate() + 1);
        }
      }

      const bookingsByDate: ScheduleStore['bookingsByDate'] = {};
      for (const b of (bookRes.data ?? [])) {
        const k = b.date as string;
        if (!bookingsByDate[k]) bookingsByDate[k] = [];
        bookingsByDate[k].push({
          start: (b.start_time as string).slice(0, 5),
          end:   (b.end_time   as string).slice(0, 5),
        });
      }

      return { templates, exceptions, bookingsByDate } as ScheduleStore;
    },
    enabled: !!masterId,
    staleTime: 30_000,           // 30s — schedule must be fresh to avoid double-bookings
    gcTime:    1000 * 60 * 5,    // 5 min — released when wizard is closed for a while
    retry: 3,                    // Silent retries on flaky mobile networks
  });
}
