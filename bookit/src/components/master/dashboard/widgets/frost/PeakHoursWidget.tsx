'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { subDays, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';
import Link from 'next/link';
import { Clock, ArrowUpRight } from 'lucide-react';
import { useSmartTooltip } from '@/lib/hooks/useSmartTooltip';
import { Section } from '@/components/ui/Section';

const DAYS      = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const FULL_DAYS = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function toISO(d: Date) { return format(d, 'yyyy-MM-dd'); }

interface Cell { dIdx: number; hIdx: number }
interface TooltipPos { left: number; top: number; flipDown: boolean }
interface Peak { d: number; h: number; count: number }

function findPeak(grid: number[][]): Peak | null {
  let best: Peak | null = null;
  for (let d = 0; d < grid.length; d++) {
    for (let h = 0; h < grid[d].length; h++) {
      if (grid[d][h] > (best?.count ?? 0)) best = { d, h, count: grid[d][h] };
    }
  }
  return best;
}

// Single-hue sequential: opacity = щільність. Порожня — ледь видима, пік — солід + світле кільце.
function cellStyle(count: number, max: number, isPeak: boolean): React.CSSProperties {
  const intensity = max > 0 ? count / max : 0;
  return {
    borderRadius: '3px',
    background: 'var(--accent)',
    // Пік завжди повний акцент; світле кільце + halo відділяють зірку від темних сусідів.
    opacity: isPeak ? 1 : count === 0 ? 0.07 : 0.34 + intensity * 0.66,
    boxShadow: isPeak
      ? '0 0 0 1.5px var(--surface), 0 0 0 3px var(--accent), 0 2px 8px color-mix(in srgb, var(--accent) 45%, transparent)'
      : 'none',
    zIndex: isPeak ? 1 : undefined,
    position: isPeak ? 'relative' : undefined,
  };
}

/* ─── HeatGrid — чиста презентація сітки (пік солід + рамка) ─── */
export function HeatGrid({
  grid, max, peak, activeCell, focusedCell, cellRefs, onCell, onKeyDown, onFocus, onGridPointerLeave,
}: {
  grid: number[][];
  max: number;
  peak: Peak | null;
  activeCell: Cell | null;
  focusedCell: Cell;
  cellRefs?: React.MutableRefObject<(HTMLButtonElement | null)[][]>;
  onCell?: (d: number, h: number, target: HTMLElement) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>, d: number, h: number) => void;
  onFocus?: (d: number, h: number) => void;
  onGridPointerLeave?: (e: React.PointerEvent) => void;
}) {
  return (
    <div className="flex gap-[3px] flex-1" onPointerLeave={onGridPointerLeave}>
      <div className="flex flex-col gap-[3px] pt-[18px] pr-1 shrink-0">
        {HOURS.map(h => (
          <div key={h} className="flex-1 flex items-center min-h-[10px]">
            <span className="font-mono text-[8px] lg:text-[10px] font-bold tabular-nums text-[var(--text-tertiary)] opacity-45 w-5 text-right">{h}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-[3px] flex-1">
        {DAYS.map((day, dIdx) => (
          <div key={day} className="flex flex-col gap-[3px] flex-1 min-w-0">
            <div className="font-mono text-[9px] lg:text-[11px] font-bold text-[var(--text-tertiary)] text-center leading-none mb-[2px] opacity-55">{day}</div>
            {HOURS.map((_, hIdx) => {
              const count    = grid[dIdx][hIdx];
              const isPeak   = peak?.d === dIdx && peak?.h === hIdx;
              const isActive = activeCell?.dIdx === dIdx && activeCell?.hIdx === hIdx;
              const isFocused = focusedCell.dIdx === dIdx && focusedCell.hIdx === hIdx;
              return (
                <button
                  key={hIdx}
                  type="button"
                  ref={(el) => { if (cellRefs) cellRefs.current[dIdx][hIdx] = el; }}
                  tabIndex={isFocused ? 0 : -1}
                  className="flex-1 cursor-pointer min-h-[10px] w-full p-0"
                  aria-label={`${DAYS[dIdx]} ${HOURS[hIdx]}:00${isPeak ? ', пік' : ''}`}
                  aria-pressed={isActive}
                  style={{
                    ...cellStyle(count, max, !!isPeak),
                    outline: isActive ? '1.5px solid color-mix(in srgb, var(--accent) 60%, transparent)' : 'none',
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 100ms ease-out',
                  }}
                  onPointerEnter={(e) => { if (e.pointerType === 'mouse') onCell?.(dIdx, hIdx, e.currentTarget); }}
                  onClick={(e) => onCell?.(dIdx, hIdx, e.currentTarget)}
                  onFocus={() => onFocus?.(dIdx, hIdx)}
                  onKeyDown={(e) => onKeyDown?.(e, dIdx, hIdx)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PeakHeadline — домінанта: день serif + час metric-value + лінк на пік-націнку ─── */
export function PeakHeadline({ peak }: { peak: Peak }) {
  return (
    <div className="mb-4">
      <p className="leading-none">
        <span className="heading-serif text-[24px] text-[var(--text-primary)]">{FULL_DAYS[peak.d]}</span>
        <span className="metric-value text-[20px] ml-2 text-[var(--accent)]">{HOURS[peak.h]}:00</span>
      </p>
      <p className="text-[12px] mt-1 text-[var(--text-sub,var(--text-secondary))]">
        Найзавантаженіший час · {peak.count} {pluralUk(peak.count, 'запис', 'записи', 'записів')}
      </p>
      <Link
        href="/dashboard?drawer=dynamic_pricing"
        className="group inline-flex items-center gap-1 mt-2.5 text-[12px] font-semibold text-[var(--accent)] active:scale-[0.98] transition-transform"
      >
        Підняти ціну в пік
        <ArrowUpRight size={13} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </Link>
    </div>
  );
}

export function PeakHoursWidget() {
  const now  = getNow();
  const from = toISO(subDays(now, 30));
  const to   = toISO(now);
  const { bookings, isLoading } = useBookings(from, to);
  const [activeCell,  setActiveCell]  = useState<Cell | null>(null);
  const [tooltipPos,  setTooltipPos]  = useState<TooltipPos | null>(null);
  const [focusedCell, setFocusedCell] = useState<Cell>({ dIdx: 0, hIdx: 0 });
  const cellRefs = useRef<(HTMLButtonElement | null)[][]>(
    Array.from({ length: 7 }, () => Array(HOURS.length).fill(null))
  );
  const tooltipRef = useRef<HTMLDivElement>(null);
  const clampedLeft = useSmartTooltip(tooltipRef, tooltipPos?.left ?? null);

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
    return { grid: g, max: Math.max(...g.flat()) };
  }, [bookings]);

  const peak = useMemo(() => findPeak(grid), [grid]);

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
    const TOOLTIP_H = 38, GAP = 6, PAD = 8;
    const flipDown = rect.top < TOOLTIP_H + GAP + PAD;
    setActiveCell({ dIdx, hIdx });
    setTooltipPos({ left: rect.left + rect.width / 2, top: flipDown ? rect.bottom + GAP : rect.top - TOOLTIP_H - GAP, flipDown });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, dIdx: number, hIdx: number) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCell(dIdx, hIdx, e.currentTarget); return; }
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
    return { ...tooltipPos, count: grid[activeCell.dIdx][activeCell.hIdx], day: DAYS[activeCell.dIdx], hour: HOURS[activeCell.hIdx] };
  }, [activeCell, tooltipPos, grid]);

  return (
    <div className="flex flex-col flex-1 h-full">
      <AnimatePresence>
        {tooltipInfo && (
          <motion.div
            key="peak-tooltip"
            className="pointer-events-none fixed z-[9000]"
            style={{ left: clampedLeft ?? tooltipInfo.left, top: tooltipInfo.top, transform: 'translateX(-50%)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <motion.div
              initial={{ opacity: 0, y: tooltipInfo.flipDown ? -4 : 4, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring' as const, duration: 0.22, bounce: 0 }}
            >
              <div ref={tooltipRef} className="px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap shadow-lg" style={{ background: 'var(--hero-card-bg)', color: 'var(--accent-on)' }}>
                <span style={{ opacity: 0.55 }}>{tooltipInfo.day} · {tooltipInfo.hour}:00</span>
                <span className="mx-1.5" style={{ opacity: 0.3 }}>·</span>
                <span>{tooltipInfo.count === 0 ? 'немає записів' : `${tooltipInfo.count} ${pluralUk(tooltipInfo.count, 'запис', 'записи', 'записів')}`}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Section title="Пікові години" icon={Clock} className="flex-1 flex flex-col overflow-visible" bodyClassName="flex flex-col flex-1">
        {isLoading ? (
          <div className="skeleton-shimmer rounded-xl flex-1" style={{ minHeight: 160 }} />
        ) : max === 0 ? (
          <div className="flex items-center gap-2 py-2 flex-1" style={{ color: 'var(--text-tertiary)' }}>
            <Clock size={14} strokeWidth={1.6} />
            <span className="text-[12px]">Немає даних за 30 днів</span>
          </div>
        ) : max === 1 ? (
          <div className="flex flex-col justify-center flex-1 py-4">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Замало записів, щоб побачити пік</p>
            <p className="text-[12px] mt-1 text-[var(--text-sub,var(--text-secondary))] max-w-[38ch]">
              Патерн зʼявиться, коли назбираються повтори в той самий час.
            </p>
          </div>
        ) : (
          <>
            {peak && <PeakHeadline peak={peak} />}
            <HeatGrid
              grid={grid} max={max} peak={peak}
              activeCell={activeCell} focusedCell={focusedCell} cellRefs={cellRefs}
              onCell={handleCell} onKeyDown={handleKeyDown} onFocus={(d, h) => setFocusedCell({ dIdx: d, hIdx: h })}
              onGridPointerLeave={(e) => { if (e.pointerType === 'mouse') { setActiveCell(null); setTooltipPos(null); } }}
            />
          </>
        )}
      </Section>
    </div>
  );
}
