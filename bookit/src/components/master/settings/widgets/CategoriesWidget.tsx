'use client';
// humanized

import { Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

const ALL_CATEGORIES = [
  { id: 'hair',    label: 'Волосся' },
  { id: 'nails',   label: 'Нігті' },
  { id: 'brows',   label: 'Брови та вії' },
  { id: 'face',    label: 'Обличчя' },
  { id: 'body',    label: 'Тіло' },
  { id: 'makeup',  label: 'Макіяж' },
  { id: 'massage', label: 'Масаж' },
  { id: 'depil',   label: 'Депіляція' },
  { id: 'other',   label: 'Інше' },
];

interface CategoriesWidgetProps {
  selected: string[];
  onChange: (val: string[]) => void;
}

const VALID_IDS = new Set(ALL_CATEGORIES.map(c => c.id));

export function CategoriesWidget({ selected, onChange }: CategoriesWidgetProps) {
  const validCount = selected.filter(id => VALID_IDS.has(id)).length;
  const isMaxed = validCount >= 4;

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(x => x !== id));
    } else {
      if (isMaxed) return;
      onChange([...selected, id]);
    }
  };

  return (
    <div className="widget-card p-6 h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-2xl bg-accent text-[var(--accent-on)] flex items-center justify-center shadow-lg shadow-accent/20 shrink-0 mt-0.5">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="font-bold text-sm text-text-primary">Спеціалізації</h3>
          <p className="text-[11px] text-text-mute mt-0.5">До 4 напрямків — клієнти знаходять вас за фільтром</p>
        </div>
      </div>

      {/* 3-column grid of categories — fills available height */}
      <div className="grid grid-cols-3 gap-2 flex-1">
        {ALL_CATEGORIES.map((cat) => {
          const isSelected = selected.includes(cat.id);
          const isDisabled = !isSelected && isMaxed;
          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => toggle(cat.id)}
              aria-pressed={isSelected}
              disabled={isDisabled}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 rounded-2xl text-[11px] font-bold transition-all border px-2 py-3',
                isSelected
                  ? 'bg-accent text-[var(--accent-on)] border-accent shadow-lg shadow-accent/20'
                  : isDisabled
                  ? 'bg-secondary border-border text-text-sub opacity-40 cursor-not-allowed'
                  : 'bg-secondary border-border text-text-sub hover:border-accent/30 hover:bg-muted/5 active:scale-[0.95] cursor-pointer'
              )}
            >
              {isSelected && <Check size={12} strokeWidth={3} />}
              <span className="text-center leading-tight">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
          <span className="text-text-mute">Вибрано</span>
          <span className={cn(isMaxed ? 'text-accent' : 'text-text-mute')}>{validCount} / 4</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={validCount}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label="Вибрані спеціалізації"
          className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden"
        >
          <motion.div
            animate={{ width: `${(validCount / 4) * 100}%` }}
            className="h-full bg-accent rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
