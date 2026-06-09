'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Preset } from '@/lib/supabase/hooks/useDateRange';

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'day', label: 'День' },
  { key: 'week', label: 'Тиждень' },
  { key: 'month', label: 'Місяць' },
  { key: 'year', label: 'Рік' },
  { key: 'all', label: 'Весь час' },
];

const spring = { type: 'spring', stiffness: 380, damping: 30 } as const;

interface PeriodControlsProps {
  preset: Preset;
  canGoNext: boolean;
  label: string;
  setPreset: (p: Preset) => void;
  goPrev: () => void;
  goNext: () => void;
}

export function PeriodControls({
  preset,
  canGoNext,
  label,
  setPreset,
  goPrev,
  goNext,
}: PeriodControlsProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Presets strip */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-border/40">
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p.key}
            onClick={() => setPreset(p.key)}
            aria-pressed={preset === p.key}
            className="relative flex-shrink-0 px-4 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer select-none active:scale-[0.95] whitespace-nowrap"
          >
            <span className={
              preset === p.key
                ? 'text-foreground'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
            }>
              {p.label}
            </span>
            {preset === p.key && (
              <motion.div
                layoutId="period-underline"
                transition={spring}
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-2 select-none py-1">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Попередній період"
          className="size-9 rounded-full bg-secondary/60 border border-border-strong flex items-center justify-center text-muted-foreground hover:bg-secondary active:scale-[0.90] transition-all duration-100 flex-shrink-0 cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>

        <p className="flex-1 text-center text-sm font-semibold text-foreground tracking-tight">
          {label}
        </p>

        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Наступний період"
          className="size-9 rounded-full bg-secondary/60 border border-border-strong flex items-center justify-center text-muted-foreground hover:bg-secondary active:scale-[0.90] transition-all duration-100 flex-shrink-0 disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
