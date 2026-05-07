'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeeklyOverview } from '@/lib/supabase/hooks/useWeeklyOverview';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { getNow } from '@/lib/utils/now';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const BAR_MAX_H = 80;

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

function SkeletonBars() {
  const heights = [50, 80, 35, 100, 72, 28, 60];
  return (
    <div className="flex items-end gap-2 px-5" style={{ height: BAR_MAX_H + 24 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 skeleton-shimmer rounded-lg"
          style={{ height: Math.round((h / 100) * BAR_MAX_H) }}
        />
      ))}
    </div>
  );
}

interface BarTooltipProps {
  dayLabel: string;
  date: string;
  bookings: number;
  revenue: number;
}

/* Tooltip: outer div handles CSS centering, inner motion.div handles animation.
   Mixing CSS transform with Framer Motion transforms causes offset — keep them separate. */
function BarTooltip({ dayLabel, date, bookings, revenue }: BarTooltipProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        pointerEvents: 'none',
        width: 'max-content',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.88 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div
          className="rounded-2xl px-4 py-3 flex flex-col gap-1.5"
          style={{
            background: 'var(--text-primary)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.22)',
            minWidth: 124,
          }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wider text-center"
            style={{ color: 'rgba(255,255,255,0.50)' }}
          >
            {dayLabel} · {date}
          </p>
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Записи</span>
              <span
                style={{
                  fontFamily: 'var(--font-cormorant, Georgia, serif)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'white',
                }}
              >
                {bookings}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Дохід</span>
              <span
                style={{
                  fontFamily: 'var(--font-cormorant, Georgia, serif)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'white',
                }}
              >
                {revenue > 0 ? formatPrice(revenue) : '—'}
              </span>
            </div>
          </div>
        </div>
        {/* Arrow */}
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 9,
            height: 9,
            background: 'var(--text-primary)',
          }}
        />
      </motion.div>
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
    <div className="bento-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Тиждень
          </p>

          {/* Animated total + WoW delta */}
          <div style={{ height: '2.6rem', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className="flex items-baseline gap-2 mt-1"
              >
                <p
                  className="leading-none"
                  style={{
                    fontFamily: 'var(--font-cormorant, Georgia, serif)',
                    fontSize: '1.6rem',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                  }}
                >
                  {displayValue}
                </p>
                {delta && (
                  <span
                    className="text-[11px] font-bold leading-none"
                    style={{ color: delta.positive ? 'var(--success)' : 'var(--error)' }}
                  >
                    {delta.label}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          {delta && (
            <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              vs минулий тиждень
            </p>
          )}
        </div>

        {/* Mode toggle */}
        <div
          className="flex rounded-xl p-1 gap-0.5"
          style={{ background: 'var(--background-deep)' }}
        >
          {(['bookings', 'revenue'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setActiveBar(null); }}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300"
              style={{
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? 'white' : 'var(--text-tertiary)',
              }}
            >
              {m === 'bookings' ? 'Записи' : 'Дохід'}
            </button>
          ))}
        </div>
      </div>

      {/* Bars — key={mode} forces re-animation when switching */}
      {isLoading ? (
        <SkeletonBars />
      ) : (
        <div
          className="flex items-end gap-2 px-5"
          style={{ height: BAR_MAX_H + 32, overflow: 'visible', position: 'relative' }}
        >
          {values.map((val, i) => {
            const barH = val === 0
              ? 3
              : Math.max(Math.round((val / maxVal) * BAR_MAX_H), 6);
            const isToday  = i === today;
            const isActive = activeBar === i;
            const d = weekDates[i];
            const dateStr = d
              ? `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
              : '';

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end gap-1.5 cursor-pointer"
                style={{ position: 'relative' }}
                onClick={() => setActiveBar(prev => prev === i ? null : i)}
              >
                {/* Tooltip — positioned via wrapper div, animated via inner motion */}
                <AnimatePresence>
                  {isActive && (
                    <BarTooltip
                      dayLabel={DAYS[i]}
                      date={dateStr}
                      bookings={data[i]?.bookings ?? 0}
                      revenue={data[i]?.revenue ?? 0}
                    />
                  )}
                </AnimatePresence>

                {/* Value label — hidden when tooltip is open */}
                {val > 0 && !isActive && (
                  <span
                    className="text-[9px] font-bold tabular-nums leading-none"
                    style={{
                      color: isToday ? 'var(--accent)' : 'var(--text-tertiary)',
                      opacity: isToday ? 1 : 0.7,
                    }}
                  >
                    {mode === 'bookings'
                      ? val
                      : val >= 1000
                        ? `${Math.round(val / 1000)}к`
                        : val}
                  </span>
                )}

                {/* Bar */}
                <motion.div
                  key={`${mode}-${i}`}
                  className="w-full rounded-[6px]"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 28,
                    delay: i * 0.05,
                  }}
                  style={{
                    height: barH,
                    background: isActive
                      ? 'var(--accent)'
                      : isToday
                      ? 'var(--accent)'
                      : 'var(--accent-light)',
                    transformOrigin: 'bottom',
                    boxShadow: (isActive || isToday)
                      ? '0 2px 10px rgba(194,73,106,0.28)'
                      : 'none',
                    transition: 'background 0.3s ease, box-shadow 0.3s ease',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Day labels */}
      <div className="flex gap-2 px-5 pt-1.5 pb-4">
        {DAYS.map((d, i) => (
          <div key={d} className="flex-1 text-center">
            <span
              className="text-[10px] font-semibold"
              style={{
                color: i === today ? 'var(--accent)' : 'var(--text-tertiary)',
                opacity: i === today ? 1 : 0.55,
              }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
