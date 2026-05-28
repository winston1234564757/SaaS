'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeeklyOverview } from '@/lib/supabase/hooks/useWeeklyOverview';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { getNow } from '@/lib/utils/now';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const BAR_MAX_H = 104;

function getTodayIdx(): number {
  return (new Date().getDay() + 6) % 7;
}

function getWeekDates(): Date[] {
  const today = getNow();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getPrevWeekRange(): { from: string; to: string } {
  const today = getNow();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) - 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toISO(monday), to: toISO(sunday) };
}

function formatDelta(curr: number, prev: number): { label: string; positive: boolean } | null {
  if (prev === 0) return null;
  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct === 0) return null;
  return { label: `${pct > 0 ? '+' : ''}${pct}%`, positive: pct > 0 };
}

interface BarTooltipProps {
  dayLabel: string;
  date: string;
  bookings: number;
  revenue: number;
}

function BarTooltip({ dayLabel, date, bookings, revenue }: BarTooltipProps) {
  return (
    <div
      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 w-28 rounded-[12px] p-3 text-[13px] pointer-events-none"
      style={{
        background: 'var(--hero-card-bg)',
        boxShadow: 'var(--hero-card-shadow)',
      }}
    >
      <p className="font-semibold mb-1.5" style={{ color: 'var(--accent-on)' }}>{dayLabel} · {date}</p>
      <div className="flex items-center justify-between mb-0.5">
        <span style={{ color: 'var(--accent-on)', opacity: 0.5 }}>Записи</span>
        <span className="metric-value font-bold" style={{ color: 'var(--accent-on)' }}>{bookings}</span>
      </div>
      <div className="flex items-center justify-between">
        <span style={{ color: 'var(--accent-on)', opacity: 0.5 }}>Дохід</span>
        <span className="metric-value font-bold" style={{ color: 'var(--accent-on)' }}>
          {revenue > 0 ? formatPrice(revenue) : '—'}
        </span>
      </div>
    </div>
  );
}

export function WeeklyChartWidget() {
  const { data, isLoading } = useWeeklyOverview();
  const [mode, setMode] = useState<'bookings' | 'revenue'>('bookings');
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const today = getTodayIdx();
  const weekDates = useMemo(() => getWeekDates(), []);
  const prevRange = useMemo(() => getPrevWeekRange(), []);

  const { bookings: prevBookings } = useBookings(prevRange.from, prevRange.to);

  const values = useMemo(
    () => data.map(d => (mode === 'bookings' ? d.bookings : d.revenue)),
    [data, mode]
  );
  const maxVal = useMemo(() => Math.max(...values, 1), [values]);

  const totalBookings = data.reduce((s, d) => s + d.bookings, 0);
  const totalRevenue  = data.reduce((s, d) => s + d.revenue, 0);
  const displayValue  = mode === 'bookings' ? String(totalBookings) : formatPrice(totalRevenue);

  const prevTotalBookings = prevBookings?.filter(b => b.status !== 'cancelled').length ?? 0;
  const prevTotalRevenue  = prevBookings?.filter(b => b.status === 'completed').reduce((s, b) => s + b.total_price, 0) ?? 0;
  const delta = useMemo(() => {
    const curr = mode === 'bookings' ? totalBookings : totalRevenue;
    const prev = mode === 'bookings' ? prevTotalBookings : prevTotalRevenue;
    return formatDelta(curr, prev);
  }, [mode, totalBookings, totalRevenue, prevTotalBookings, prevTotalRevenue]);

  return (
    <div className="bento-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-0 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="metric-value text-[clamp(1.8rem,5vw,2.5rem)] font-bold text-[var(--text-primary)] leading-none">
              {displayValue}
            </span>
            {delta && (
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-[3px] rounded-full text-[10px] font-bold ${
                  delta.positive ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
                }`}
              >
                {delta.label}
              </span>
            )}
          </div>
          {delta && (
            <p className="text-[13px] mt-1 text-[var(--text-tertiary)]">vs минулий тиждень</p>
          )}
        </div>

        {/* Mode toggle */}
        <div
          className="flex items-center gap-0.5 p-[3px] rounded-full flex-shrink-0"
          style={{ background: 'var(--border)' }}
        >
          {(['bookings', 'revenue'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setActiveBar(null); }}
              className="relative px-3 py-[5px] rounded-full text-[13px] font-medium active:scale-[0.95] transition-transform duration-100"
              style={{ color: mode === m ? 'var(--accent-on)' : 'var(--text-tertiary)' }}
            >
              {mode === m && (
                <motion.div
                  layoutId="weekly-mode-tab"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
                />
              )}
              <span className="relative z-10">{m === 'bookings' ? 'Записи' : 'Дохід'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div className="px-4 pt-5 pb-2">
        {isLoading ? (
          <div className="h-[104px] skeleton-shimmer rounded-xl" />
        ) : (
          <div className="flex items-end gap-[3px] h-[120px]">
            {values.map((val, i) => {
              const barH     = val === 0 ? 3 : Math.max(Math.round((val / maxVal) * BAR_MAX_H), 6);
              const isToday  = i === today;
              const isActive = activeBar === i;
              const d        = weekDates[i];
              const dateStr  = d
                ? `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
                : '';

              return (
                <div
                  key={i}
                  className="relative flex flex-col items-center justify-end flex-1 cursor-pointer"
                  onClick={() => setActiveBar(prev => prev === i ? null : i)}
                >
                  {isActive && (
                    <BarTooltip
                      dayLabel={DAYS[i]}
                      date={dateStr}
                      bookings={data[i]?.bookings ?? 0}
                      revenue={data[i]?.revenue ?? 0}
                    />
                  )}

                  {val > 0 && !isActive && (
                    <span
                      className={`text-[10px] font-bold mb-[3px] ${
                        isToday ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                      }`}
                    >
                      {mode === 'bookings'
                        ? val
                        : val >= 1000
                          ? `${Math.round(val / 1000)}к`
                          : val}
                    </span>
                  )}

                  <motion.div
                    key={`bar-${i}-${mode}`}
                    className="w-full rounded-t-[4px]"
                    style={{
                      height: barH,
                      background: isActive || isToday ? 'var(--accent)' : 'var(--border-strong)',
                      transformOrigin: 'bottom',
                    }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: isToday || isActive ? 1 : 0.55 }}
                    transition={{
                      type: 'spring' as const,
                      duration: 0.7,
                      bounce: 0.12,
                      delay: i * 0.055,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 px-4 pb-5">
        {DAYS.map((d, i) => (
          <div key={d} className="flex justify-center">
            <span
              className={`text-[12px] font-medium ${
                i === today ? 'font-bold' : ''
              }`}
              style={{ color: i === today ? 'var(--accent)' : 'var(--text-tertiary)' }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
