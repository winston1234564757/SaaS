'use client';

import { useMemo, useState, useCallback } from 'react';
import { subDays, format } from 'date-fns';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';

const DAYS  = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function toISO(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

interface TooltipState {
  day: string;
  hour: number;
  count: number;
  x: number;
  y: number;
}

export function PeakHoursWidget() {
  const now  = getNow();
  const from = toISO(subDays(now, 30));
  const to   = toISO(now);

  const { bookings, isLoading } = useBookings(from, to);
  const [tooltip, setTooltip]   = useState<TooltipState | null>(null);

  const { grid, max } = useMemo<{ grid: number[][]; max: number }>(() => {
    const g: number[][] = Array.from({ length: 7 }, () => Array(HOURS.length).fill(0));
    if (!bookings) return { grid: g, max: 0 };

    bookings.forEach(b => {
      if (!['confirmed', 'completed'].includes(b.status)) return;
      const d   = new Date(b.date + 'T00:00:00');
      let   dow = d.getDay() - 1;
      if (dow < 0) dow = 6;
      const hour = parseInt(b.start_time.split(':')[0], 10);
      const hIdx = HOURS.indexOf(hour);
      if (hIdx !== -1) g[dow][hIdx]++;
    });

    const m = Math.max(...g.flat());
    return { grid: g, max: m };
  }, [bookings]);

  const handleEnter = useCallback(
    (e: React.MouseEvent, dIdx: number, hIdx: number) => {
      setTooltip({
        day:   DAYS[dIdx],
        hour:  HOURS[hIdx],
        count: grid[dIdx][hIdx],
        x:     e.clientX,
        y:     e.clientY,
      });
    },
    [grid],
  );

  const handleMove = useCallback((e: React.MouseEvent) => {
    setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
  }, []);

  const handleLeave = useCallback(() => setTooltip(null), []);

  if (isLoading) {
    return (
      <div className="widget-card p-5">
        <div className="skeleton-shimmer h-4 w-32 rounded-full mb-4" />
        <div className="skeleton-shimmer rounded-xl" style={{ height: 220 }} />
      </div>
    );
  }

  return (
    <>
      {/* Custom tooltip — fixed, flips left when near right edge */}
      {tooltip && (() => {
        const TW   = 196;
        const safeX = tooltip.x + 12 + TW > window.innerWidth
          ? tooltip.x - 12 - TW
          : tooltip.x + 12;
        return (
        <div
          className="pointer-events-none fixed z-[9000]"
          style={{ left: safeX, top: tooltip.y - 48 }}
        >
          <div
            className="px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap shadow-lg"
            style={{
              background:  'var(--hero-card-bg)',
              color:       'var(--accent-on)',
              boxShadow:   'var(--hero-card-shadow)',
            }}
          >
            <span style={{ opacity: 0.55 }}>{tooltip.day} · {tooltip.hour}:00</span>
            <span className="mx-1.5" style={{ opacity: 0.3 }}>·</span>
            <span>
              {tooltip.count === 0
                ? 'немає записів'
                : `${tooltip.count} ${pluralUk(tooltip.count, 'запис', 'записи', 'записів')}`}
            </span>
          </div>
        </div>
        );
      })()}

      <div className="widget-card p-5">
        <p className="widget-heading mb-4">Пікові години</p>

        <div className="flex gap-1.5" onMouseLeave={handleLeave} onMouseMove={handleMove}>
          {/* Hour axis */}
          <div className="flex flex-col gap-[4px] pt-5 pr-1 shrink-0">
            {HOURS.map(h => (
              <div key={h} className="h-[16px] flex items-center">
                <span className="text-[9px] font-mono text-[var(--text-tertiary)] opacity-55 w-5 text-right leading-none">
                  {h}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex gap-[4px] flex-1">
            {DAYS.map((day, dIdx) => (
              <div key={day} className="flex flex-col gap-[4px] flex-1 min-w-0">
                <div className="text-[10px] font-bold text-[var(--text-tertiary)] text-center leading-none mb-[2px] opacity-70">
                  {day}
                </div>
                {HOURS.map((_, hIdx) => {
                  const count     = grid[dIdx][hIdx];
                  const intensity = max > 0 ? count / max : 0;
                  return (
                    <div
                      key={hIdx}
                      className="h-[16px] rounded-[4px] cursor-default"
                      style={{
                        background: 'var(--accent)',
                        opacity: intensity === 0 ? 0.07 : 0.12 + intensity * 0.88,
                      }}
                      onMouseEnter={e => handleEnter(e, dIdx, hIdx)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {max === 0 && (
          <p className="text-center text-[11px] text-[var(--text-tertiary)] mt-3 opacity-50">
            Немає даних за 30 днів
          </p>
        )}
      </div>
    </>
  );
}
