'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeeklyOverview } from '@/lib/supabase/hooks/useWeeklyOverview';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { getNow } from '@/lib/utils/now';
import { BarChart2 } from 'lucide-react';
import { useSmartTooltip } from '@/lib/hooks/useSmartTooltip';
import { pluralUk } from '@/lib/utils/pluralUk';
import { Section } from '@/components/ui/Section';

const DAYS      = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const FULL_DAYS = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
const BAR_MAX = 96;
const TOOLTIP_H_EST  = 56;
const GAP            = 6;

function getTodayIdx(): number { return (new Date().getDay() + 6) % 7; }

// Монохромна sequential-рампа на акценті: глибший = більше. Висота = первинний сигнал,
// колір підсилює щільність. Пік-день виривається solid-акцентом (зірка), решта тихі.
function barFill(val: number, max: number, isPeak: boolean): string {
  if (isPeak) return 'var(--accent)';
  const pct = val === 0 ? 12 : Math.round(26 + (val / max) * 46); // 26→72% — тихіше за пік
  return `color-mix(in srgb, var(--accent) ${pct}%, transparent)`;
}

function compact(val: number, mode: 'bookings' | 'revenue'): string {
  if (mode === 'bookings') return String(val);
  return val >= 1000 ? `${Math.round(val / 1000)}к` : String(val);
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

interface BarTooltipInfo { left: number; top: number; dayLabel: string; bookings: number; revenue: number }

/* ─── WeekBars — чиста презентація (пік=зірка, сьогодні=позиція, решта тихі) ─── */
export function WeekBars({
  values, mode, todayIdx, activeBar, onBarClick,
}: {
  values: number[];
  mode: 'bookings' | 'revenue';
  todayIdx: number;
  activeBar: number | null;
  onBarClick: (i: number, e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const maxVal  = Math.max(...values, 1);
  const hasData = values.some(v => v > 0);
  const peakIdx = hasData ? values.indexOf(Math.max(...values)) : -1;

  return (
    <>
      <div className="flex items-end gap-[3px]" style={{ height: 110 }}>
        {values.map((val, i) => {
          const barH    = val === 0 ? 2 : Math.max(Math.round((val / maxVal) * BAR_MAX), 5);
          const isPeak  = i === peakIdx;
          const isToday = i === todayIdx;
          const isActive = activeBar === i;
          const emphasis = isPeak || isActive;
          const fill    = barFill(val, maxVal, emphasis);
          const ariaLabel = `${DAYS[i]}: ${val === 0 ? 'немає записів' : mode === 'bookings' ? `${val} записів` : formatPrice(val)}${isPeak ? ', найсильніший день' : ''}`;

          return (
            <button
              key={i}
              type="button"
              className="relative flex flex-col items-center justify-end flex-1 cursor-pointer bg-transparent border-0 p-0"
              onClick={(e) => onBarClick(i, e)}
              aria-label={ariaLabel}
              aria-pressed={isActive}
            >
              {/* Selective label: лише пік (dataviz — не число на кожному барі) */}
              {isPeak && val > 0 && !isActive && (
                <span className="metric-value text-[11px] font-bold mb-1 text-[var(--accent)]">
                  {compact(val, mode)}
                </span>
              )}
              <motion.div
                key={`bar-${i}-${mode}`}
                className="w-full"
                style={{
                  height:          barH,
                  borderRadius:    '4px 4px 0 0',
                  background:      fill,
                  transformOrigin: 'bottom',
                  border:          isToday && !emphasis
                    ? '1.5px solid color-mix(in srgb, var(--accent) 55%, transparent)'
                    : `1px solid ${emphasis ? 'var(--accent)' : fill}`,
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ type: 'spring' as const, duration: 0.6, bounce: 0.06, delay: i * 0.05 }}
              />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-7 mt-2">
        {DAYS.map((d, i) => (
          <div key={d} className="flex flex-col items-center gap-1">
            <span
              className="text-[10px] font-bold tabular-nums"
              style={{ color: i === todayIdx ? 'var(--accent)' : 'var(--text-sub, var(--text-secondary))', opacity: i === todayIdx ? 1 : 0.7 }}
            >
              {d}
            </span>
            {i === todayIdx && <span aria-hidden className="w-1 h-1 rounded-full" style={{ background: 'var(--accent)' }} />}
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── LowDataWeek — 1–2 активні дні: editorial-список замість порожніх барів ─── */
export function LowDataWeek({
  entries, mode,
}: {
  entries: { i: number; bookings: number; revenue: number }[];
  mode: 'bookings' | 'revenue';
}) {
  return (
    <div className="flex flex-col">
      {entries.map((e, idx) => {
        const isPeak = idx === 0;
        const primary = mode === 'bookings' ? String(e.bookings) : formatPrice(e.revenue);
        const unit    = mode === 'bookings' ? pluralUk(e.bookings, 'запис', 'записи', 'записів') : '';
        const sub     = mode === 'bookings'
          ? (e.revenue > 0 ? formatPrice(e.revenue) : null)
          : `${e.bookings} ${pluralUk(e.bookings, 'запис', 'записи', 'записів')}`;

        return (
          <div key={e.i} className={`flex items-center justify-between gap-3 py-3 ${idx > 0 ? 'border-t border-border' : ''}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span aria-hidden className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isPeak ? 'var(--accent)' : 'var(--border-strong)' }} />
              <span
                className={isPeak ? 'text-[15px] font-semibold' : 'text-[14px]'}
                style={{ color: isPeak ? 'var(--text-primary)' : 'var(--text-sub, var(--text-secondary))' }}
              >
                {FULL_DAYS[e.i]}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="metric-value text-[15px] font-bold" style={{ color: isPeak ? 'var(--accent)' : 'var(--text-primary)' }}>
                {primary}
              </span>
              {unit && <span className="text-[12px] ml-1" style={{ color: 'var(--text-sub, var(--text-secondary))' }}>{unit}</span>}
              {sub && <span className="text-[11px] ml-2" style={{ color: 'var(--text-tertiary)' }}>{sub}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WeeklyChartWidget() {
  const { data, isLoading } = useWeeklyOverview();
  const [mode, setMode]         = useState<'bookings' | 'revenue'>('bookings');
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [tooltip, setTooltip]   = useState<BarTooltipInfo | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const clampedLeft = useSmartTooltip(tooltipRef, tooltip?.left ?? null);
  const today     = getTodayIdx();
  const prevRange = useMemo(() => getPrevWeekRange(), []);
  const { bookings: prevBookings } = useBookings(prevRange.from, prevRange.to);

  const values = useMemo(() => data.map(d => (mode === 'bookings' ? d.bookings : d.revenue)), [data, mode]);

  const totalBookings = data.reduce((s, d) => s + d.bookings, 0);
  const totalRevenue  = data.reduce((s, d) => s + d.revenue, 0);
  const activeEntries = useMemo(
    () => data
      .map((d, i) => ({ i, bookings: d.bookings, revenue: d.revenue }))
      .filter(e => e.bookings > 0)
      .sort((a, b) => (mode === 'bookings' ? b.bookings - a.bookings : b.revenue - a.revenue)),
    [data, mode],
  );
  const displayValue  = mode === 'bookings' ? String(totalBookings) : formatPrice(totalRevenue);

  const prevTotalBookings = prevBookings?.filter(b => b.status !== 'cancelled').length ?? 0;
  const prevTotalRevenue  = prevBookings?.filter(b => b.status === 'completed').reduce((s, b) => s + b.total_price, 0) ?? 0;
  const delta = useMemo(() => {
    const curr = mode === 'bookings' ? totalBookings : totalRevenue;
    const prev = mode === 'bookings' ? prevTotalBookings : prevTotalRevenue;
    return formatDelta(curr, prev);
  }, [mode, totalBookings, totalRevenue, prevTotalBookings, prevTotalRevenue]);

  useEffect(() => {
    if (!tooltip) return;
    const dismiss = () => { setActiveBar(null); setTooltip(null); };
    window.addEventListener('scroll', dismiss, { passive: true });
    return () => window.removeEventListener('scroll', dismiss);
  }, [tooltip]);

  const handleBarClick = (i: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (activeBar === i) { setActiveBar(null); setTooltip(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const flipDown = rect.top < TOOLTIP_H_EST + GAP + 8;
    setActiveBar(i);
    setTooltip({
      left: centerX,
      top: flipDown ? rect.bottom + GAP : rect.top - TOOLTIP_H_EST - GAP,
      dayLabel: FULL_DAYS[i],
      bookings: data[i]?.bookings ?? 0,
      revenue: data[i]?.revenue ?? 0,
    });
  };

  const Toggle = (
    <div className="flex items-center gap-0.5 p-[3px] rounded-full flex-shrink-0" style={{ background: 'var(--border)' }}>
      {(['bookings', 'revenue'] as const).map(m => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => { setMode(m); setActiveBar(null); setTooltip(null); }}
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
  );

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Fixed tooltip — сибл поза Section: escape backdrop-filter containment */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="weekly-tooltip"
            className="pointer-events-none fixed z-[9000]"
            style={{ left: clampedLeft ?? tooltip.left, top: tooltip.top, transform: 'translateX(-50%)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring' as const, duration: 0.22, bounce: 0 }}
            >
              <div
                ref={tooltipRef}
                className="px-3 py-2 rounded-xl text-[11px] whitespace-nowrap"
                style={{ background: 'var(--hero-card-bg)', boxShadow: 'var(--hero-card-shadow)' }}
              >
                <p className="font-bold mb-1" style={{ color: 'var(--accent-on)' }}>{tooltip.dayLabel}</p>
                <p style={{ color: 'var(--accent-on)', opacity: 0.65 }}>
                  {tooltip.bookings} {pluralUk(tooltip.bookings, 'запис', 'записи', 'записів')} · {tooltip.revenue > 0 ? formatPrice(tooltip.revenue) : '—'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Section
        title="Тиждень"
        icon={BarChart2}
        action={Toggle}
        className="flex-1 flex flex-col"
        bodyClassName="flex flex-col flex-1"
      >
        {/* Домінанта — сума тижня + delta */}
        <div className="flex items-baseline gap-2">
          <span className="metric-value text-[2rem] font-bold leading-none text-[var(--text-primary)] whitespace-nowrap">
            {displayValue}
          </span>
          {delta && (
            <span className="text-[12px] font-bold" style={{ color: delta.positive ? 'var(--success)' : 'var(--error)' }}>
              {delta.label}
            </span>
          )}
        </div>
        {delta && <p className="text-[11px] mt-0.5 text-[var(--text-sub,var(--text-secondary))]">vs минулий тиждень</p>}

        {/* Бари */}
        <div className="mt-auto pt-5" onMouseLeave={() => { setActiveBar(null); setTooltip(null); }}>
          {isLoading ? (
            <div className="h-[110px] skeleton-shimmer rounded-lg" />
          ) : totalBookings === 0 ? (
            <div className="flex items-center gap-2 h-[110px]" style={{ color: 'var(--text-tertiary)' }}>
              <BarChart2 size={14} strokeWidth={1.6} />
              <span className="text-[12px]">Записів за тиждень ще немає</span>
            </div>
          ) : activeEntries.length <= 2 ? (
            <LowDataWeek entries={activeEntries} mode={mode} />
          ) : (
            <WeekBars values={values} mode={mode} todayIdx={today} activeBar={activeBar} onBarClick={handleBarClick} />
          )}
        </div>
      </Section>
    </div>
  );
}
