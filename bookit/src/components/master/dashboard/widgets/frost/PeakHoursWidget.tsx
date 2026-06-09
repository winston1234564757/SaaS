'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { subDays, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';
import { Clock } from 'lucide-react';

const DAYS  = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function toISO(d: Date) { return format(d, 'yyyy-MM-dd'); }

interface ActiveCell { dIdx: number; hIdx: number }
interface TooltipPos { left: number; top: number; flipDown: boolean }

export function PeakHoursWidget() {
  const now  = getNow();
  const from = toISO(subDays(now, 30));
  const to   = toISO(now);
  const { bookings, isLoading } = useBookings(from, to);
  const [activeCell,  setActiveCell]  = useState<ActiveCell | null>(null);
  const [tooltipPos,  setTooltipPos]  = useState<TooltipPos | null>(null);
  const [focusedCell, setFocusedCell] = useState<ActiveCell>({ dIdx: 0, hIdx: 0 });
  const cellRefs = useRef<(HTMLButtonElement | null)[][]>(
    Array.from({ length: 7 }, () => Array(HOURS.length).fill(null))
  );

  const { grid, max } = useMemo<{ grid: number[][]; max: number }>(() => {
    const g: number[][] = Array.from({ length: 7 }, () => Array(HOURS.length).fill(0));
    if (!bookings) return { grid: g, max: 0 };
    bookings.forEach(b => {
      if (!['confirmed', 'completed'].includes(b.status)) return;
      const d = new Date(b.date + 'T00:00:00');
      let dow = d.getDay() - 1; if (dow < 0) dow = 6;
      const hIdx = HOURS.indexOf(parseInt(b.start_time.split(':')[0], 10));
      if (hIdx !== -1) g[dow][hIdx]++;
    });
    const m = Math.max(...g.flat());
    return { grid: g, max: m };
  }, [bookings]);

  useEffect(() => {
    if (!activeCell) return;
    const dismiss = () => { setActiveCell(null); setTooltipPos(null); };
    window.addEventListener('scroll', dismiss, { passive: true });
    return () => window.removeEventListener('scroll', dismiss);
  }, [activeCell]);

  const handleCell = (dIdx: number, hIdx: number, target: HTMLElement) => {
    const isSame = activeCell?.dIdx === dIdx && activeCell?.hIdx === hIdx;
    if (isSame) { setActiveCell(null); setTooltipPos(null); return; }
    const rect = target.getBoundingClientRect();
    const TOOLTIP_H = 38;
    const GAP = 6;
    const flipDown = rect.top < TOOLTIP_H + GAP + 8;
    setActiveCell({ dIdx, hIdx });
    setTooltipPos({
      left: rect.left + rect.width / 2,
      top: flipDown ? rect.bottom + GAP : rect.top - TOOLTIP_H - GAP,
      flipDown,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, dIdx: number, hIdx: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCell(dIdx, hIdx, e.currentTarget);
      return;
    }
    let nd = dIdx, nh = hIdx;
    if      (e.key === 'ArrowRight') nd = (dIdx + 1) % 7;
    else if (e.key === 'ArrowLeft')  nd = (dIdx + 6) % 7;
    else if (e.key === 'ArrowDown')  nh = (hIdx + 1) % HOURS.length;
    else if (e.key === 'ArrowUp')    nh = (hIdx + HOURS.length - 1) % HOURS.length;
    else return;
    e.preventDefault();
    setFocusedCell({ dIdx: nd, hIdx: nh });
    cellRefs.current[nd]?.[nh]?.focus();
  };

  const tooltipInfo = useMemo(() => {
    if (!activeCell || !tooltipPos) return null;
    return {
      ...tooltipPos,
      count: grid[activeCell.dIdx][activeCell.hIdx],
      day:   DAYS[activeCell.dIdx],
      hour:  HOURS[activeCell.hIdx],
    };
  }, [activeCell, tooltipPos, grid]);

  if (isLoading) {
    return (
      <div className="bento-card p-4 flex flex-col flex-1">
        <div className="skeleton-shimmer h-4 w-24 rounded-full mb-3" />
        <div className="skeleton-shimmer rounded-xl flex-1" style={{ minHeight: 160 }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <AnimatePresence>
        {tooltipInfo && (
          <motion.div
            key="peak-tooltip"
            className="pointer-events-none fixed z-[9000]"
            style={{ left: tooltipInfo.left, top: tooltipInfo.top, transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, y: tooltipInfo.flipDown ? -4 : 4, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring' as const, duration: 0.22, bounce: 0 }}
          >
            <div
              className="px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap shadow-lg"
              style={{ background: 'var(--hero-card-bg)', color: 'var(--accent-on)' }}
            >
              <span style={{ opacity: 0.55 }}>{tooltipInfo.day} · {tooltipInfo.hour}:00</span>
              <span className="mx-1.5" style={{ opacity: 0.3 }}>·</span>
              <span>
                {tooltipInfo.count === 0
                  ? 'немає записів'
                  : `${tooltipInfo.count} ${pluralUk(tooltipInfo.count, 'запис', 'записи', 'записів')}`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bento-card p-4 flex flex-col flex-1" style={{ overflow: 'visible' }}>
        <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)] mb-3">
          Пікові години
        </p>

        <div className="flex gap-[3px] flex-1" onMouseLeave={() => { setActiveCell(null); setTooltipPos(null); }}>
          <div className="flex flex-col gap-[3px] pt-[18px] pr-1 shrink-0">
            {HOURS.map(h => (
              <div key={h} className="flex-1 flex items-center min-h-[10px]">
                <span className="font-mono text-[8px] lg:text-[10px] font-bold tabular-nums text-[var(--text-tertiary)] opacity-45 w-5 text-right">
                  {h}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-[3px] flex-1">
            {DAYS.map((day, dIdx) => (
              <div key={day} className="flex flex-col gap-[3px] flex-1 min-w-0">
                <div className="font-mono text-[9px] lg:text-[11px] font-bold text-[var(--text-tertiary)] text-center leading-none mb-[2px] opacity-55">
                  {day}
                </div>
                {HOURS.map((_, hIdx) => {
                  const intensity = max > 0 ? grid[dIdx][hIdx] / max : 0;
                  const isActive  = activeCell?.dIdx === dIdx && activeCell?.hIdx === hIdx;
                  const isFocused = focusedCell.dIdx === dIdx && focusedCell.hIdx === hIdx;
                  return (
                    <button
                      key={hIdx}
                      type="button"
                      ref={(el) => { cellRefs.current[dIdx][hIdx] = el; }}
                      tabIndex={isFocused ? 0 : -1}
                      className="flex-1 cursor-pointer min-h-[10px] w-full bg-transparent border-0 p-0"
                      aria-label={`${DAYS[dIdx]} ${HOURS[hIdx]}:00`}
                      aria-pressed={isActive}
                      style={{
                        borderRadius: '3px',
                        background:   'var(--accent)',
                        opacity:      intensity === 0 ? 0.07 : 0.14 + intensity * 0.86,
                        outline:      isActive ? '1.5px solid color-mix(in srgb, var(--accent) 60%, transparent)' : 'none',
                        transform:    isActive ? 'scale(1.2)' : 'scale(1)',
                        transition:   'transform 100ms ease-out',
                      }}
                      onMouseEnter={(e) => handleCell(dIdx, hIdx, e.currentTarget)}
                      onClick={(e) => handleCell(dIdx, hIdx, e.currentTarget)}
                      onFocus={() => setFocusedCell({ dIdx, hIdx })}
                      onKeyDown={(e) => handleKeyDown(e, dIdx, hIdx)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {max === 0 && (
          <div className="flex items-center gap-2 py-2 mt-3" style={{ color: 'var(--text-tertiary)' }}>
            <Clock size={14} strokeWidth={1.6} />
            <span className="text-[12px]">Немає даних за 30 днів</span>
          </div>
        )}
      </div>
    </div>
  );
}
