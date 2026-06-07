'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/components/master/services/types';
import { motion, AnimatePresence } from 'framer-motion';

export interface SourceAttributionPoint {
  source: string;
  count: number;
  revenue: number; // в копійках
  pct: number;
}

interface ChannelDonutProps {
  data: SourceAttributionPoint[];
}

const COLORS = [
  'var(--accent)',         // amber
  'rgba(120, 154, 170, 0.8)', // slate blue
  'rgba(78, 152, 112, 0.8)',  // green
  'rgba(200, 120, 64, 0.8)',  // orange
  'rgba(100, 90, 76, 0.5)',   // muted gray
];

export function ChannelDonut({ data }: ChannelDonutProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.2
  const center = 50;

  // Розраховуємо сегменти кола
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
      <div className="text-center py-6 text-xs text-muted-foreground/60">
        Немає даних про джерела записів
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-between gap-5 py-1">
      {/* SVG Donut Chart */}
      <div className="relative size-32 flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform -rotate-90 overflow-visible"
          role="img"
          aria-label="Канали залучення клієнтів"
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

        {/* Центральний текст всередині Donut */}
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
                <span className="text-base font-bold text-foreground leading-none">
                  {segments[hoveredIdx].pct}%
                </span>
                <span className="text-[8px] text-muted-foreground/80 mt-0.5 truncate max-w-[60px]">
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
                <span className="text-sm font-bold text-foreground leading-none">
                  {data.reduce((sum, d) => sum + d.count, 0)}
                </span>
                <span className="text-[8px] text-muted-foreground/60 mt-0.5">
                  Записів
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Легенда (права сторона) */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {segments.map((s, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              className={cn(
                'flex items-center justify-between text-[11px] py-0.5 px-1.5 rounded-lg transition-all duration-150',
                isHovered && 'bg-secondary'
              )}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="size-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="font-medium text-foreground truncate min-w-0">
                  {s.source}
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0 text-muted-foreground/80">
                <span className="font-semibold text-foreground">{s.pct}%</span>
                <span>({s.count})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
