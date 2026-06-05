'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Preset } from '@/lib/supabase/hooks/useDateRange';

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'day', label: 'День' },
  { key: 'week', label: 'Тиждень' },
  { key: 'month', label: 'Місяць' },
  { key: 'year', label: 'Рік' },
  { key: 'all', label: 'Весь час' },
];

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
    <div className="flex flex-col gap-3 w-full">
      {/* Пресети */}
      <div className="bg-secondary/60 p-1 rounded-2xl flex gap-0.5 overflow-x-auto scrollbar-hide">
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`flex-1 flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold active:scale-[0.95] duration-100 transition-all whitespace-nowrap cursor-pointer select-none ${
              preset === p.key
                ? 'bg-secondary shadow-[0_2px_10px_rgb(0,0,0,0.05)] text-foreground'
                : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/30'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Навігація по датах */}
      <div className="flex items-center gap-2 select-none">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Попередній період"
          className="size-11 rounded-full bg-secondary/60 border border-border-strong flex items-center justify-center text-muted-foreground hover:bg-secondary active:scale-[0.95] duration-100 transition-all flex-shrink-0 shadow-sm cursor-pointer"
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
          className="size-11 rounded-full bg-secondary/60 border border-border-strong flex items-center justify-center text-muted-foreground hover:bg-secondary active:scale-[0.95] duration-100 transition-all flex-shrink-0 shadow-sm disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
