'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface StatChip {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  color: string;
}

/**
 * Спільний ряд метрик клієнта (M-CLI-06). Один вигляд скрізь:
 * ClientDetailSheet (4 чіпи) і BookingDetailsModal (3 чіпи).
 */
export function ClientStatChips({ chips, className }: { chips: StatChip[]; className?: string }) {
  const gridCols = chips.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3';
  return (
    <div className={cn('grid gap-2.5', gridCols, className)}>
      {chips.map((c) => (
        <div
          key={c.label}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-secondary/50 px-2 py-3 text-center"
        >
          <span style={{ color: c.color }} className="opacity-80">
            <c.icon size={15} strokeWidth={2} />
          </span>
          <p className="text-[15px] font-bold leading-none text-foreground">{c.value}</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
