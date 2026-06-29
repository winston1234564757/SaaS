'use client';

import { cn } from '@/lib/utils/cn';
import { MODES } from '../storyConstants';
import type { Mode } from '../storyTypes';

interface StepTypeProps {
  mode: Mode;
  onSelect(m: Mode): void;
}

export function StepType({ mode, onSelect }: StepTypeProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {MODES.map(m => {
        const active = m.id === mode;
        const Icon = m.Icon;
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(m.id)}
            className={cn(
              'relative flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-sm font-semibold text-left transition-colors duration-150 cursor-pointer active:scale-[0.97]',
              active
                ? 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] shadow-[0_4px_12px_color-mix(in_srgb,var(--accent)_25%,transparent)]'
                : 'bg-secondary/70 text-text-secondary border border-border',
            )}
          >
            <Icon size={16} strokeWidth={2.5} />
            <span className="flex-1 min-w-0 truncate">{m.label}</span>
            {m.premium && (
              <span className={cn('shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md',
                active ? 'bg-accent-on/25 text-accent-on' : 'bg-warning/15 text-warning')}>PRO</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
