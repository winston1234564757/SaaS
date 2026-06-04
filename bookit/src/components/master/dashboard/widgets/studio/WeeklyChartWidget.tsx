'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWeeklyOverview } from '@/lib/supabase/hooks/useWeeklyOverview';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { getNow } from '@/lib/utils/now';

const DAYS    = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const BAR_MAX = 96;

function getTodayIdx(): number { return (new Date().getDay() + 6) % 7; }

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDates(): Date[] {
  const today = getNow();
  const day   = today.getDay();
  const mon   = new Date(today);
  mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}

function getPrevWeekRange() {
  const today = getNow();
  const day = today.getDay();
  const mon = new Date(today);
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
      className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 rounded-[4px] p-2 text-[11px] pointer-events-none whitespace-nowrap"
      style={{ background: 'rgba(8,20,24,0.97)', border: '1px solid var(--border)' }}
    >
      <p className="font-mono font-bold mb-0.5 tracking-[0.08em] uppercase" style={{ color: 'var(--accent)' }}>{dayLabel} · {date}</p>
      <p className="font-mono" style={{ color: 'var(--text-secondary)' }}>{bookings} зап · {revenue > 0 ? formatPrice(revenue) : '—'}</p>
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

  const values = useMemo(() => data.map(d => (mode === 'bookings' ? d.bookings : d.revenue)), [data, mode]);
  const maxVal  = useMemo(() => Math.max(...values, 1), [values]);

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
      <div className="flex items-baseline justify-between gap-4 mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <div className="flex items-baseline gap-3">
          <span className="metric-value text-[2rem] font-bold leading-none text-[var(--text-primary)]">
            {displayValue}
          </span>
          {delta && (
            <span
              className="text-[12px] font-bold"
              style={{ color: delta.positive ? 'var(--success)' : 'var(--error)' }}
            >
              {delta.label}
            </span>
          )}
        </div>

        {/* Underline text mode toggle */}
        <div className="flex items-center gap-4">
          {(['bookings', 'revenue'] as const).map(m => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => { setMode(m); setActiveBar(null); }}
              className="relative text-[11px] font-bold tracking-[0.14em] uppercase pb-px transition-colors duration-150"
              style={{ color: mode === m ? 'var(--accent)' : 'var(--text-tertiary)' }}
            >
              {m === 'bookings' ? 'Записи' : 'Дохід'}
              {mode === m && (
                <motion.div
                  layoutId="studio-weekly-tab"
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bars — rectangular, precise */}
      {isLoading ? (
        <div className="h-[96px] skeleton-shimmer rounded-lg" />
      ) : (
        <div className="flex items-end gap-[3px]" style={{ height: 110 }}>
          {values.map((val, i) => {
            const barH     = val === 0 ? 2 : Math.max(Math.round((val / maxVal) * BAR_MAX), 6);
            const isToday  = i === today;
            const isActive  = activeBar === i;
            const d         = weekDates[i];
            const dateStr   = d ? `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}` : '';
            const ariaLabel = `${DAYS[i]}: ${val === 0 ? 'немає записів' : mode === 'bookings' ? `${val} записів` : formatPrice(val)}`;

            return (
              <button
                key={i}
                type="button"
                aria-label={ariaLabel}
                aria-pressed={isActive}
                className="relative flex flex-col items-center justify-end flex-1 bg-transparent border-0 p-0 min-w-0"
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
                    className="font-mono text-[9px] font-bold mb-[3px] tabular-nums"
                    style={{ color: isToday || isActive ? 'var(--accent)' : 'var(--text-tertiary)', opacity: isToday || isActive ? 1 : 0.5 }}
                  >
                    {mode === 'bookings' ? val : val >= 1000 ? `${Math.round(val / 1000)}к` : val}
                  </span>
                )}
                <motion.div
                  key={`bar-${i}-${mode}`}
                  className="w-full"
                  style={{
                    height:          barH,
                    borderRadius:    '2px 2px 0 0',
                    background:      isActive || isToday ? 'var(--accent)' : 'var(--border-strong)',
                    transformOrigin: 'bottom',
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: isToday || isActive ? 1 : 0.6 }}
                  transition={{ type: 'spring' as const, duration: 0.6, bounce: 0.06, delay: i * 0.05 }}
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
              className="font-mono text-[10px] font-bold tracking-[0.06em]"
              style={{ color: i === today ? 'var(--accent)' : 'var(--text-tertiary)', opacity: i === today ? 1 : 0.5 }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
