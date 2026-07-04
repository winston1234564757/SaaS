'use client';

import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { STEPS, STEP_INDEX } from './storySteps';
import type { StepId } from './storyTypes';

interface StepNavProps {
  currentStep: StepId;
  completion: Record<StepId, boolean>;
  onBack(): void;
  onNext(): void;
  onJump(id: StepId): void;
  isFirst: boolean;
  isLast: boolean;
  /** на останньому кроці замість "Далі" рендериться цей слот (кнопка експорту) */
  lastStepAction?: React.ReactNode;
}

export function StepNav({ currentStep, completion, onBack, onNext, onJump, isFirst, isLast, lastStepAction }: StepNavProps) {
  const currentIndex = STEP_INDEX[currentStep];

  return (
    <div className="space-y-3">
      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => {
          const active = s.id === currentStep;
          const done = completion[s.id] && !active;
          return (
            <button
              key={s.id}
              type="button"
              aria-label={`Крок: ${s.label}`}
              aria-current={active ? 'step' : undefined}
              aria-pressed={active}
              onClick={() => onJump(s.id)}
              className="group flex-1 flex flex-col items-center gap-1.5 py-2 cursor-pointer"
            >
              <span className="relative w-full h-1 rounded-full overflow-hidden bg-secondary/60">
                <span
                  className={cn('absolute inset-0 rounded-full transition-colors duration-200',
                    active || i < currentIndex ? 'bg-accent' : 'bg-transparent')}
                />
              </span>
              <span className={cn('flex items-center gap-1 text-[10px] font-semibold transition-colors duration-150',
                active ? 'text-foreground' : 'text-text-sub')}>
                {done && <Check size={10} strokeWidth={3} className="text-accent" />}
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Back / Next */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-2xl text-sm font-semibold text-text-secondary bg-secondary/70 border border-border transition-colors duration-150 cursor-pointer active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} /> Назад
        </button>

        <div className="flex-1">
          {isLast ? (
            lastStepAction
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="w-full flex items-center justify-center gap-1 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-[background-color,box-shadow] duration-200 cursor-pointer active:scale-[0.98]"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--accent-on)', boxShadow: '0 6px 20px color-mix(in srgb, var(--accent) 22%, transparent)' }}
            >
              Далі <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
