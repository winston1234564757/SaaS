'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday as isTodayFn,
} from 'date-fns';
import { uk } from 'date-fns/locale';
import { CalendarDays, LayoutList } from 'lucide-react';
import { type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { cn } from '@/lib/utils/cn';
import { pluralUk } from '@/lib/utils/pluralUk';

interface Props {
  bookings: BookingWithServices[];
  month: Date;
  onDayClick: (date: Date) => void;
  onWeekClick: (date: Date) => void;
}

const SHORT_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function shortPrice(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}к`;
  return `${n}`;
}

export function MonthlyAnalyticsView({ bookings, month, onDayClick, onWeekClick }: Props) {
  const [subView, setSubView] = useState<'calendar' | 'weeks'>('calendar');

  const monthStart = useMemo(() => startOfMonth(month), [month]);
  const monthEnd   = useMemo(() => endOfMonth(month),   [month]);

  const weeks = useMemo(
    () => eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 }),
    [monthStart, monthEnd],
  );

  const dayData = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      if (!map[b.date]) map[b.date] = { revenue: 0, count: 0 };
      map[b.date].revenue += b.total_price;
      map[b.date].count   += 1;
    });
    return map;
  }, [bookings]);

  const maxDayRevenue = useMemo(() => {
    let max = 0;
    eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach(d => {
      const r = dayData[d.toISOString().split('T')[0]]?.revenue ?? 0;
      if (r > max) max = r;
    });
    return max || 1;
  }, [dayData, monthStart, monthEnd]);

  const calendarGrid = useMemo(() =>
    weeks.map(ws => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: ws, end: we }).map(d => {
        const key  = d.toISOString().split('T')[0];
        const data = dayData[key] ?? { revenue: 0, count: 0 };
        return {
          date:     d,
          key,
          revenue:  data.revenue,
          count:    data.count,
          inMonth:  isSameMonth(d, month),
          isToday:  isTodayFn(d),
        };
      });
    }),
  [weeks, dayData, month]);

  const weekStats = useMemo(() =>
    weeks.map(ws => {
      const we   = endOfWeek(ws, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: ws, end: we }).map(d => {
        const key  = d.toISOString().split('T')[0];
        const data = dayData[key] ?? { revenue: 0, count: 0 };
        return { date: d, ...data, inMonth: isSameMonth(d, month) };
      });

      const inMonthDays = days.filter(d => d.inMonth);
      const totalRevenue = inMonthDays.reduce((a, d) => a + d.revenue, 0);
      const totalCount   = inMonthDays.reduce((a, d) => a + d.count,   0);
      const bestDay: { date: Date; count: number } | null = inMonthDays
        .filter(d => d.count > 0)
        .reduce<{ date: Date; count: number } | null>(
          (acc, d) => (!acc || d.count > acc.count ? { date: d.date, count: d.count } : acc),
          null,
        );

      return {
        weekStart:    ws,
        weekEnd:      we,
        days,
        totalRevenue,
        totalCount,
        bestDay,
        hasMonthDays: days.some(d => d.inMonth),
      };
    }),
  [weeks, dayData, month]);

  const filteredWeeks = weekStats.filter(w => w.hasMonthDays);

  const totalRevenue  = filteredWeeks.reduce((a, w) => a + w.totalRevenue, 0);
  const totalBookings = filteredWeeks.reduce((a, w) => a + w.totalCount,   0);

  return (
    <div className="flex flex-col gap-4">

      {/* Summary + toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <span className="text-xl lg:text-3xl font-black text-foreground heading-serif tracking-tight">{formatPrice(totalRevenue)}</span>
          <span className="text-[10px] lg:text-[12px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
            {totalBookings} {pluralUk(totalBookings, 'запис', 'записи', 'записів')}
          </span>
        </div>

        <div className="flex p-1 rounded-xl bg-white/50 border border-white/60 gap-0.5">
          <button
            onClick={() => setSubView('calendar')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all',
              subView === 'calendar'
                ? 'bg-white shadow-sm text-primary'
                : 'text-muted-foreground/50 hover:text-muted-foreground',
            )}
          >
            <CalendarDays size={11} />
            Календар
          </button>
          <button
            onClick={() => setSubView('weeks')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all',
              subView === 'weeks'
                ? 'bg-white shadow-sm text-primary'
                : 'text-muted-foreground/50 hover:text-muted-foreground',
            )}
          >
            <LayoutList size={11} />
            Тижні
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Calendar sub-view ────────────────────────────── */}
        {subView === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {/* Day name header */}
            <div className="grid grid-cols-7 mb-1">
              {SHORT_DAYS.map((d, i) => (
                <div
                  key={d}
                  className="text-center text-[9px] font-black uppercase tracking-[0.12em] py-2.5"
                  style={{ color: i >= 5 ? 'var(--accent)' : 'var(--text-tertiary)' }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Week rows */}
            <div className="flex flex-col">
              {calendarGrid.map((week, wi) => (
                <div
                  key={wi}
                  className="grid grid-cols-7"
                  style={{ borderTop: wi > 0 ? '0.5px solid var(--border)' : undefined, opacity: 0.08 > 0 ? 1 : 1 }}
                >
                  {week.map((day, di) => {
                    const intensity = day.inMonth && day.revenue > 0
                      ? day.revenue / maxDayRevenue
                      : 0;
                    const globalIdx = wi * 7 + di;

                    return (
                      <motion.button
                        key={day.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: !day.inMonth ? 0.2 : 1 }}
                        transition={{ delay: globalIdx * 0.006, duration: 0.18 }}
                        whileTap={day.inMonth ? { scale: 0.82 } : {}}
                        onClick={() => day.inMonth && onDayClick(day.date)}
                        disabled={!day.inMonth}
                        className="relative flex flex-col items-center py-2.5 gap-1 select-none"
                        style={{ cursor: day.inMonth ? 'pointer' : 'default', minHeight: 60 }}
                      >
                        {/* Day number — today gets a filled circle, otherwise bare */}
                        <div
                          className="relative flex items-center justify-center"
                          style={{ width: 30, height: 30 }}
                        >
                          {day.isToday && (
                            <motion.div
                              layoutId="today-indicator"
                              className="absolute inset-0 rounded-full"
                              style={{ background: 'var(--accent)' }}
                              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            />
                          )}
                          <span
                            className="relative z-10 text-[14px] font-black tabular-nums leading-none"
                            style={{
                              color: day.isToday
                                ? '#ffffff'
                                : 'var(--text-primary)',
                            }}
                          >
                            {format(day.date, 'd')}
                          </span>
                        </div>

                        {/* Booking dots */}
                        {day.inMonth && day.count > 0 && (
                          <div className="flex items-center gap-[3px]">
                            {Array.from({ length: Math.min(day.count, 3) }).map((_, idx) => (
                              <div
                                key={idx}
                                className="rounded-full"
                                style={{
                                  width:      5,
                                  height:     5,
                                  background: 'var(--accent)',
                                  opacity:    0.4 + intensity * 0.6,
                                }}
                              />
                            ))}
                            {day.count > 3 && (
                              <span
                                className="text-[7px] font-bold leading-none"
                                style={{ color: 'var(--accent)', opacity: 0.6 }}
                              >
                                +{day.count - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Revenue text — only on moderate-to-high revenue days */}
                        {day.inMonth && intensity > 0.25 && (
                          <span
                            className="leading-none tabular-nums"
                            style={{
                              fontSize:   '6.5px',
                              fontWeight: 700,
                              color:      'var(--accent)',
                              opacity:    0.45 + intensity * 0.4,
                            }}
                          >
                            {shortPrice(day.revenue)}
                          </span>
                        )}

                        {/* Revenue underline — scales with intensity */}
                        {day.inMonth && intensity > 0 && (
                          <motion.div
                            className="absolute bottom-0 rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: globalIdx * 0.006 + 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            style={{
                              left:       `${20 + (1 - intensity) * 15}%`,
                              right:      `${20 + (1 - intensity) * 15}%`,
                              height:     Math.max(Math.round(intensity * 2.5), 1),
                              background: 'var(--accent)',
                              opacity:    0.22 + intensity * 0.5,
                            }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Weeks sub-view ────────────────────────────────── */}
        {subView === 'weeks' && (
          <motion.div
            key="weeks"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3"
          >
            {filteredWeeks.map((week, wi) => {
              const maxInWeek = Math.max(...week.days.map(d => d.count), 1);

              return (
                <motion.button
                  key={week.weekStart.toISOString()}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: wi * 0.05, type: 'spring', stiffness: 260, damping: 28 }}
                  onClick={() => onWeekClick(week.weekStart)}
                  className="bento-card p-5 lg:p-7 flex flex-col gap-4 lg:gap-6 text-left active:scale-[0.98] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:border-primary/20"
                  style={{
                    borderLeft: week.totalCount > 0 ? '4px solid var(--accent)' : undefined,
                  }}
                >
                  {/* Header: range + revenue */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Тиждень {wi + 1}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {format(week.weekStart, 'd MMM', { locale: uk })}
                        {' — '}
                        {format(week.weekEnd, 'd MMM', { locale: uk })}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-sm font-black text-foreground">
                        {week.totalRevenue > 0 ? formatPrice(week.totalRevenue) : '—'}
                      </span>
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {week.totalCount} {pluralUk(week.totalCount, 'запис', 'записи', 'записів')}
                      </span>
                    </div>
                  </div>

                  {/* Mini day bar chart */}
                  <div className="grid grid-cols-7 gap-1 items-end">
                    {week.days.map((d, di) => {
                      const barH = d.inMonth && d.count > 0
                        ? Math.max(6, Math.round((d.count / maxInWeek) * 32))
                        : 0;
                      return (
                        <div key={di} className="flex flex-col items-center gap-1">
                          <div className="flex items-end justify-center h-8 w-full">
                            {barH > 0 ? (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: barH }}
                                className="w-full rounded-t-sm"
                                style={{ background: 'var(--accent)', opacity: 0.5 }}
                              />
                            ) : (
                              <div
                                className="w-full rounded-sm"
                                style={{
                                  height:     3,
                                  background: d.inMonth ? 'var(--border)' : 'transparent',
                                }}
                              />
                            )}
                          </div>
                          <span
                            className="text-[8px] font-bold"
                            style={{
                              color: !d.inMonth
                                ? 'transparent'
                                : d.count > 0
                                ? 'var(--accent)'
                                : 'var(--text-tertiary)',
                              opacity: d.inMonth ? 1 : 0,
                            }}
                          >
                            {SHORT_DAYS[di]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Best day */}
                  {week.bestDay && (
                    <div
                      className="flex items-center gap-2 pt-2"
                      style={{ borderTop: '0.5px solid var(--border)' }}
                    >
                      <span
                        className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Топ-день
                      </span>
                      <span
                        className="text-[10px] font-bold capitalize"
                        style={{ color: 'var(--accent)' }}
                      >
                        {format(week.bestDay!.date, 'EEEE', { locale: uk })}
                      </span>
                      <span
                        className="text-[9px] font-semibold ml-auto"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {week.bestDay!.count} {pluralUk(week.bestDay!.count, 'запис', 'записи', 'записів')}
                      </span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
