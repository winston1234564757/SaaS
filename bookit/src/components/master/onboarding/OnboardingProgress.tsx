'use client';

import { motion } from 'framer-motion';
import type { Step } from './steps/types';

const STEPS: { key: Step; label: string }[] = [
  { key: 'PROFILE',  label: 'Профіль' },
  { key: 'SERVICES', label: 'Послуги' },
  { key: 'SCHEDULE', label: 'Розклад' },
  { key: 'PREVIEW',  label: 'Сторінка' },
  { key: 'SUCCESS',  label: 'Готово' },
];

const STEP_INDEX: Record<Step, number> = {
  PROFILE: 0, SERVICES: 1, SCHEDULE: 2, PREVIEW: 3, SUCCESS: 4,
};

interface OnboardingProgressProps {
  step: Step;
}

export function OnboardingProgress({ step }: OnboardingProgressProps) {
  const current = STEP_INDEX[step];

  return (
    <div
      className="flex items-center mb-8"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemax={5}
      aria-label={`Крок ${current + 1} з 5: ${STEPS[current].label}`}
    >
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1 last:flex-none">
          {/* Dot + label */}
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{
                scale: i === current ? 1.25 : 1,
                backgroundColor:
                  i < current
                    ? 'var(--accent)'
                    : i === current
                    ? 'var(--accent)'
                    : 'color-mix(in srgb, var(--accent) 18%, transparent)',
              }}
              transition={{ type: 'spring' as const, stiffness: 320, damping: 26 }}
              className="w-2 h-2 rounded-full"
            />
            {i === current && (
              <motion.span
                key={s.key}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="absolute top-[14px] text-[10px] font-medium whitespace-nowrap text-text-secondary"
                style={{ color: 'var(--text-secondary)' }}
              >
                {s.label}
              </motion.span>
            )}
          </div>

          {/* Connector line */}
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-px mx-2 relative overflow-hidden rounded-full bg-border">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                animate={{ width: i < current ? '100%' : '0%' }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                style={{ background: 'var(--accent)' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
