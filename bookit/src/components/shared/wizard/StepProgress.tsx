// src/components/shared/wizard/StepProgress.tsx
import { PROGRESS } from './helpers';
import type { WizardStep } from './types';

export function StepProgress({ step, hasProducts }: { step: WizardStep; hasProducts: boolean }) {
  const visible = hasProducts ? PROGRESS : PROGRESS.filter(s => s !== 'products');
  const idx = visible.indexOf(step);
  if (idx < 0) return null;
  return (
    <div className="flex gap-1.5 mb-5">
      {visible.map((s, i) => (
        <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
          i <= idx ? 'bg-primary' : 'bg-secondary/80'
        }`} />
      ))}
    </div>
  );
}
