'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWeeklyOverview } from '@/lib/supabase/hooks/useWeeklyOverview';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { getNow } from '@/lib/utils/now';
import { BarChart2 } from 'lucide-react';

const DAYS    = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const BAR_MAX = 96;

function getTodayIdx(): number { return (new Date().getDay() + 6) % 7; }

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

interface BarTooltipProps { dayLabel: string; bookings: number; revenue: number }

function BarTooltip({ dayLabel, bookings, revenue }: BarTooltipProps) {
  return (
    <div
      className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 rounded-[4px] p-2 text-[11px] pointer-events-none whitespace-nowrap"
      style={{ background: 'var(--hero-card-bg)', boxShadow: 'var(--hero-card-shadow)' }}
    >
      <p className="font-bold mb-1" style={{ color: 'var(--accent-on)' }}>{dayLabel}</p>
      <p style={{ color: 'var(--accent-on)', opacity: 0.65 }}>{bookings} зап · {revenue > 0 ? formatPrice(revenue) : '—'}</p>
    </div>
  );
}

export function WeeklyChartWidget() {
  const { data, isLoading } = useWeeklyOverview();
  const [mode, setMode]     = useState<'bookings' | 'revenue'>('bookings');
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const today     = getTodayIdx();
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
    <div className="bento-card overflow-hidden flex flex-col flex-1">
      {/* Header */}
      <div className="px-4 pt-4 pb-0 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="metric-value text-[2rem] font-bold leading-tight text-[var(--text-primary)]">
              {displayValue}
            </span>
            {delta && (
              <span
                className="text-[11px] font-bold"
                style={{ color: delta.positive ? 'var(--success)' : 'var(--error)' }}
              >
                {delta.label}
              </span>
            )}
          </div>
          {delta && (
            <p className="text-[11px] mt-0.5 text-[var(--text-tertiary)]">vs минулий тиждень</p>
          )}
        </div>

        <div
          className="flex items-center gap-0.5 p-[3px] rounded-full flex-shrink-0"
          style={{ background: 'var(--border)' }}
        >
          {(['bookings', 'revenue'] as const).map(m => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => { setMode(m); setActiveBar(null); }}
              className="px-2.5 py-[4px] rounded-full text-[11px] font-bold active:scale-[0.95] transition duration-150 ease-out"
              style={{
                color: mode === m ? 'var(--accent-on)' : 'var(--text-tertiary)',
                background: mode === m ? 'var(--accent)' : 'transparent',
              }}
            >
              {m === 'bookings' ? 'Записи' : 'Дохід'}
            </button>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div className="px-4 pt-4 pb-2">
        {isLoading ? (
          <div className="h-[96px] skeleton-shimmer rounded-lg" />
        ) : (
          <div className="flex items-end gap-[3px]" style={{ height: 110 }}>
            {values.map((val, i) => {
              const barH     = val === 0 ? 2 : Math.max(Math.round((val / maxVal) * BAR_MAX), 5);
              const isToday  = i === today;
              const isActive = activeBar === i;
              const ariaLabel = `${DAYS[i]}: ${val === 0 ? 'немає записів' : mode === 'bookings' ? `${val} записів` : formatPrice(val)}`;

              return (
                <button
                  key={i}
                  type="button"
                  className="relative flex flex-col items-center justify-end flex-1 cursor-pointer bg-transparent border-0 p-0"
                  onClick={() => setActiveBar(prev => prev === i ? null : i)}
                  aria-label={ariaLabel}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <BarTooltip
                      dayLabel={DAYS[i]}
                      bookings={data[i]?.bookings ?? 0} revenue={data[i]?.revenue ?? 0}
                    />
                  )}
                  {val > 0 && !isActive && (
                    <span
                      className="font-mono text-[9px] font-bold mb-[3px] tabular-nums"
                      style={{ color: isToday ? 'var(--accent)' : 'var(--text-tertiary)', opacity: isToday ? 1 : 0.6 }}
                    >
                      {mode === 'bookings' ? val : val >= 1000 ? `${Math.round(val / 1000)}к` : val}
                    </span>
                  )}
                  <motion.div
                    key={`bar-${i}-${mode}`}
                    className="w-full"
                    style={{
                      height:          barH,
                      borderRadius:    '3px 3px 0 0',
                      background:      isActive || isToday ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 20%, transparent)',
                      transformOrigin: 'bottom',
                      border:          `1px solid color-mix(in srgb, var(--accent) ${isToday || isActive ? 100 : 15}%, transparent)`,
                    }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ type: 'spring' as const, duration: 0.6, bounce: 0.06, delay: i * 0.05 }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 px-4 pb-4">
        {DAYS.map((d, i) => (
          <div key={d} className="flex justify-center">
            <span
              className="font-mono text-[10px] font-bold"
              style={{ color: i === today ? 'var(--accent)' : 'var(--text-tertiary)', opacity: i === today ? 1 : 0.5 }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>

      {!isLoading && totalBookings === 0 && (
        <div className="flex items-center gap-2 px-4 pb-3" style={{ color: 'var(--text-tertiary)' }}>
          <BarChart2 size={14} strokeWidth={1.6} />
          <span className="text-[12px]">Записів за тиждень ще немає</span>
        </div>
      )}
    </div>
  );
}
