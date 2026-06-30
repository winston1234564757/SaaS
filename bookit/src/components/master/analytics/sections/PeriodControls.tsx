'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Preset } from '@/lib/supabase/hooks/useDateRange';
import { cn } from '@/lib/utils/cn';

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'day', label: 'День' },
  { key: 'week', label: 'Тиждень' },
  { key: 'month', label: 'Місяць' },
  { key: 'year', label: 'Рік' },
  { key: 'all', label: 'Весь час' },
];

const spring = { type: 'spring', stiffness: 380, damping: 32 } as const;

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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
      {/* Segmented presets — активна пігулка = slate (ДНК обкладинки) */}
      <div className="inline-flex items-center gap-0.5 p-1 rounded-full bg-secondary/70 border border-border self-start max-w-full overflow-x-auto scrollbar-hide">
        {PRESETS.map((p) => {
          const active = preset === p.key;
          return (
            <button
              type="button"
              key={p.key}
              onClick={() => setPreset(p.key)}
              aria-pressed={active}
              className="relative flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-150 cursor-pointer select-none whitespace-nowrap"
            >
              {active && (
                <motion.div
                  layoutId="period-pill"
                  transition={spring}
                  className="absolute inset-0 rounded-full bg-primary shadow-sm"
                />
              )}
              <span className={cn('relative z-10', active ? 'text-primary-foreground' : 'text-text-sub hover:text-foreground')}>
                {p.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Навігація періоду — у той самий рядок */}
      <div className="flex items-center gap-2 select-none flex-shrink-0">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Попередній період"
          className="size-9 rounded-full bg-secondary/60 border border-border flex items-center justify-center text-text-sub hover:bg-secondary hover:text-foreground active:scale-[0.90] transition-all duration-100 flex-shrink-0 cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>

        <p className="min-w-[124px] text-center text-sm font-semibold text-foreground tabular-nums tracking-tight">
          {label}
        </p>

        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Наступний період"
          className="size-9 rounded-full bg-secondary/60 border border-border flex items-center justify-center text-text-sub hover:bg-secondary hover:text-foreground active:scale-[0.90] transition-all duration-100 flex-shrink-0 disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
