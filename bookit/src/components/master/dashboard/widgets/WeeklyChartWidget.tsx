'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeeklyOverview } from '@/lib/supabase/hooks/useWeeklyOverview';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { getNow } from '@/lib/utils/now';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const BAR_MAX_H = 96;

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
    <div className="flex items-end gap-2 px-5" style={{ height: BAR_MAX_H + 28 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 skeleton-shimmer rounded-xl"
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

function BarTooltip({ dayLabel, date, bookings, revenue }: BarTooltipProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        pointerEvents: 'none',
        width: 'max-content',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <div
          className="px-4 py-3 flex flex-col gap-1.5"
          style={{
            borderRadius: 16,
            background: 'var(--text-primary)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.20)',
            minWidth: 116,
          }}
        >
          <p
            className="text-center uppercase tracking-wider"
            style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.42)' }}
          >
            {dayLabel}&nbsp;·&nbsp;{date}
          </p>
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-4">
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.42)' }}>Записи</span>
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
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.42)' }}>Дохід</span>
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
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 8,
            height: 8,
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
    <div className="bento-card overflow-visible flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div>
          <p className="dash-eyebrow mb-2">
            {mode === 'bookings' ? 'Записи за тиждень' : 'Дохід за тиждень'}
          </p>
          <div style={{ height: '2.8rem', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className="flex items-baseline gap-2.5"
              >
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant, Georgia, serif)',
                    fontSize: '2.1rem',
                    fontWeight: 600,
                    letterSpacing: '-0.025em',
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}
                >
                  {displayValue}
                </p>
                {delta && (
                  <span
                    className={`trend-chip ${delta.positive ? 'trend-chip-up' : 'trend-chip-down'}`}
                    style={{ fontSize: '10px', marginBottom: 2 }}
                  >
                    {delta.label}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          {delta && (
            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: 2 }}>
              vs минулий тиждень
            </p>
          )}
        </div>

        {/* Mode toggle */}
        <div className="pill-tabs flex-shrink-0">
          {(['bookings', 'revenue'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setActiveBar(null); }}
              className={`pill-tab ${mode === m ? 'pill-tab-active' : 'pill-tab-inactive'}`}
            >
              {mode === m && (
                <motion.div
                  layoutId="weekly-mode-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--accent)', zIndex: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {m === 'bookings' ? 'Записи' : 'Дохід'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bars */}
      {isLoading ? (
        <SkeletonBars />
      ) : (
        <div
          className="flex items-end gap-1.5 px-5"
          style={{ height: BAR_MAX_H + 28, overflow: 'visible', position: 'relative' }}
        >
          {values.map((val, i) => {
            const barH = val === 0
              ? 4
              : Math.max(Math.round((val / maxVal) * BAR_MAX_H), 8);
            const isToday  = i === today;
            const isActive = activeBar === i;
            const d = weekDates[i];
            const dateStr = d
              ? `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
              : '';

            const barBg = (isActive || isToday)
              ? 'var(--accent)'
              : 'var(--accent-light)';

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end gap-1.5 cursor-pointer"
                style={{ position: 'relative' }}
                onClick={() => setActiveBar(prev => prev === i ? null : i)}
              >
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

                {val > 0 && !isActive && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: isToday ? 'var(--accent)' : 'var(--text-tertiary)',
                      opacity: isToday ? 1 : 0.6,
                    }}
                  >
                    {mode === 'bookings'
                      ? val
                      : val >= 1000
                        ? `${Math.round(val / 1000)}к`
                        : val}
                  </span>
                )}

                <motion.div
                  key={`${mode}-${i}`}
                  className="w-full rounded-xl"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 220,
                    damping: 26,
                    delay: i * 0.04,
                  }}
                  style={{
                    height: barH,
                    background: barBg,
                    transformOrigin: 'bottom',
                    transition: 'background 0.25s ease',
                    boxShadow: (isActive || isToday)
                      ? '0 2px 12px rgba(168,137,106,0.30)'
                      : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Day labels */}
      <div className="flex gap-1.5 px-5 pt-2 pb-5">
        {DAYS.map((d, i) => (
          <div key={d} className="flex-1 text-center">
            <span
              style={{
                fontSize: '10px',
                fontWeight: i === today ? 700 : 500,
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
