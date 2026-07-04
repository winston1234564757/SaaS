'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { PROGRESS } from './helpers';
import type { WizardStep } from './types';

const spring = { type: 'spring', stiffness: 400, damping: 30 } as const;

export function StepProgress({ step, hasProducts, onDark = false }: { step: WizardStep; hasProducts: boolean; onDark?: boolean }) {
  const visible = hasProducts ? PROGRESS : PROGRESS.filter(s => s !== 'products');
  const activeIdx = visible.indexOf(step);
  const prefersReduced = useReducedMotion();
  if (activeIdx < 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={activeIdx + 1}
      aria-valuemin={1}
      aria-valuemax={visible.length}
      aria-label="Прогрес запису"
      className={onDark ? 'flex items-center gap-2.5' : 'flex items-center justify-center gap-2.5 py-3.5 flex-shrink-0'}
    >
      {visible.map((s, i) => {
        const isDone   = i < activeIdx;
        const isActive = i === activeIdx;
        const bg = onDark
          ? (isActive ? 'bg-white' : isDone ? 'bg-white/45' : 'bg-white/15')
          : (isActive ? 'bg-[var(--accent)]' : isDone ? 'bg-[var(--accent)]/50' : 'bg-foreground/15');
        return (
          <motion.div
            key={s}
            animate={{ scale: isActive ? 1.3 : 1 }}
            transition={prefersReduced ? { duration: 0 } : spring}
            style={{
              boxShadow: isActive
                ? (onDark
                    ? '0 0 0 4px rgba(255,255,255,0.16)'
                    : '0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent)')
                : 'none',
            }}
            className={`size-2 rounded-full transition-colors duration-300 ${bg}`}
          />
        );
      })}
    </div>
  );
}
