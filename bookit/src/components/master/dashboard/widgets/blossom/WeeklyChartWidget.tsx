'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWeeklyOverview } from '@/lib/supabase/hooks/useWeeklyOverview';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { getNow } from '@/lib/utils/now';

const DAYS    = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const BAR_MAX = 110;

function getTodayIdx(): number { return (new Date().getDay() + 6) % 7; }

function getWeekDates(): Date[] {
  const today = getNow();
  const day   = today.getDay();
  const mon   = new Date(today);
  mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getPrevWeekRange() {
  const today = getNow();
  const day   = today.getDay();
  const mon   = new Date(today);
  mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1) - 7);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { from: toISO(mon), to: toISO(sun) };
}

function formatDelta(curr: number, prev: number): { label: string; positive: boolean } | null {
  if (prev === 0) return null;
  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct === 0) return null;
  return { label: `${pct > 0 ? '+' : ''}${pct}%`, positive: pct > 0 };
}

interface BarTooltipProps { dayLabel: string; date: string; bookings: number; revenue: number }

function BarTooltip({ dayLabel, date, bookings, revenue }: BarTooltipProps) {
  return (
    <div
      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 w-28 rounded-[12px] p-3 text-[13px] pointer-events-none"
      style={{ background: 'var(--hero-card-bg)', boxShadow: 'var(--hero-card-shadow)' }}
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
  const [mode, setMode]     = useState<'bookings' | 'revenue'>('bookings');
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const today     = getTodayIdx();
  const weekDates = useMemo(() => getWeekDates(), []);
  const prevRange = useMemo(() => getPrevWeekRange(), []);
  const { bookings: prevBookings } = useBookings(prevRange.from, prevRange.to);

  const values = useMemo(
    () => data.map(d => (mode === 'bookings' ? d.bookings : d.revenue)),
    [data, mode],
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
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span
            style={{
              fontFamily:    "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize:      'clamp(2rem, 6vw, 2.8rem)',
              fontWeight:    300,
              letterSpacing: '-0.01em',
              color:         'var(--text-primary)',
              lineHeight:    1,
              display:       'block',
            }}
          >
            {displayValue}
          </span>
          {delta && (
            <p className="text-[12px] mt-1 text-[var(--text-tertiary)]">
              <span style={{ color: delta.positive ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                {delta.label}
              </span>
              {' '}vs минулий тиждень
            </p>
          )}
        </div>

        {/* Text-tab mode toggle */}
        <div className="flex items-center gap-3 flex-shrink-0 pt-1">
          {(['bookings', 'revenue'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setActiveBar(null); }}
              className="relative text-[13px] font-medium pb-px transition-colors duration-150"
              style={{ color: mode === m ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            >
              {m === 'bookings' ? 'Записи' : 'Дохід'}
              {mode === m && (
                <motion.div
                  layoutId="blossom-weekly-tab"
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bars */}
      {isLoading ? (
        <div className="h-[110px] skeleton-shimmer rounded-xl" />
      ) : (
        <div className="flex items-end gap-[4px]" style={{ height: 130 }}>
          {values.map((val, i) => {
            const barH     = val === 0 ? 3 : Math.max(Math.round((val / maxVal) * BAR_MAX), 8);
            const isToday  = i === today;
            const isActive = activeBar === i;
            const d        = weekDates[i];
            const dateStr  = d ? `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}` : '';

            return (
              <button
                key={i}
                type="button"
                className="relative flex flex-col items-center justify-end flex-1 bg-transparent border-0 p-0 min-w-0"
                onClick={() => setActiveBar(prev => prev === i ? null : i)}
              >
                {isActive && (
                  <BarTooltip
                    dayLabel={DAYS[i]} date={dateStr}
                    bookings={data[i]?.bookings ?? 0} revenue={data[i]?.revenue ?? 0}
                  />
                )}
                {val > 0 && !isActive && (
                  <span
                    className={`text-[10px] font-bold mb-[4px] ${isToday ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}
                  >
                    {mode === 'bookings' ? val : val >= 1000 ? `${Math.round(val / 1000)}к` : val}
                  </span>
                )}
                <motion.div
                  key={`bar-${i}-${mode}`}
                  className="w-full"
                  style={{
                    height:        barH,
                    borderRadius:  '100px 100px 4px 4px',
                    background:    isActive || isToday ? 'var(--accent)' : 'var(--border-strong)',
                    transformOrigin: 'bottom',
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: isToday || isActive ? 1 : 0.55 }}
                  transition={{ type: 'spring' as const, duration: 0.7, bounce: 0.12, delay: i * 0.055 }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Day labels */}
      <div className="grid grid-cols-7 mt-2">
        {DAYS.map((d, i) => (
          <div key={d} className="flex justify-center">
            <span
              className="text-[12px] font-medium"
              style={{ color: i === today ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: i === today ? 700 : 400 }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
