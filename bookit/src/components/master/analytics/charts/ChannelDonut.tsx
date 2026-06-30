'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import type { SourceAttributionPoint } from '@/lib/supabase/hooks/useSourceAttribution';

interface ChannelDonutProps {
  data: SourceAttributionPoint[];
}

// Frost-семантична палітра (графічний поріг 3:1 на surface):
// slate-лідер → indigo → emerald → amber → muted slate
const COLORS = [
  'var(--accent)',          // #0F172A slate — лідер
  'rgba(99, 102, 241, 0.9)', // indigo (аврора)
  'rgba(78, 152, 112, 0.95)', // emerald
  'rgba(180, 83, 9, 0.9)',   // amber-700 (a11y-safe)
  'rgba(100, 116, 139, 0.8)', // slate-500 muted
];

export function ChannelDonut({ data }: ChannelDonutProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const center = 50;

  const segments = useMemo(() => {
    let accumulatedPct = 0;
    return data.map((item, idx) => {
      const pct = item.pct;
      const strokeLength = (pct / 100) * circumference;
      const strokeOffset = circumference - ((accumulatedPct / 100) * circumference);
      accumulatedPct += pct;
      return {
        ...item,
        strokeLength,
        strokeOffset,
        color: COLORS[idx % COLORS.length],
        index: idx,
      };
    });
  }, [data, circumference]);

  if (data.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-text-sub">
        Немає даних про джерела записів
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-between gap-5 py-1">
      {/* SVG Donut */}
      <div className="relative size-32 flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform -rotate-90 overflow-visible"
          role="img"
          aria-label="Канали залучення клієнтів за часткою записів"
        >
          {segments.map((s, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={s.color}
                strokeWidth={isHovered ? 12 : 9}
                strokeDasharray={`${s.strokeLength} ${circumference}`}
                strokeDashoffset={s.strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onTouchStart={() => setHoveredIdx(idx)}
              />
            );
          })}
        </svg>

        {/* Центральний текст */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
          <AnimatePresence mode="popLayout">
            {hoveredIdx !== null && segments[hoveredIdx] ? (
              <motion.div
                key={`hover-${hoveredIdx}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <span className="metric-value text-lg font-semibold text-foreground leading-none">
                  {segments[hoveredIdx].pct}%
                </span>
                <span className="text-[9px] text-text-sub mt-0.5 truncate max-w-[64px]">
                  {segments[hoveredIdx].source}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <span className="metric-value text-base font-semibold text-foreground leading-none">
                  {data.reduce((sum, d) => sum + d.count, 0)}
                </span>
                <span className="text-[9px] text-text-sub mt-0.5">
                  записів
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Легенда */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {segments.map((s, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              className={cn(
                'flex items-center justify-between text-[11px] py-1 px-1.5 rounded-lg transition-colors duration-150',
                isHovered && 'bg-secondary'
              )}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="size-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="font-medium text-foreground truncate min-w-0">
                  {s.source}
                </span>
              </div>
              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                <span className="metric-value font-semibold text-foreground">{s.pct}%</span>
                <span className="text-text-sub tabular-nums">({s.count})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
