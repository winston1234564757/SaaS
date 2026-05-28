'use client';

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

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(x => x !== id));
    } else {
      if (validCount >= 4) return;
      onChange([...selected, id]);
    }
  };

    return (
      <div className="widget-card p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
            <Sparkles size={18} />
          </div>
          <h3 className="font-bold text-[11px] uppercase tracking-widest text-text-mute">Спеціалізації</h3>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggle(cat.id)}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-2 border",
                  isSelected 
                    ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-105" 
                    : "bg-secondary border-border text-text-sub hover:border-accent/30 hover:bg-muted/5"
                )}
              >
                {isSelected && <Check size={14} strokeWidth={3} />}
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className="text-text-mute">Вибрано</span>
            <span className={cn(validCount === 4 ? "text-accent" : "text-text-mute")}>
              {validCount} / 4
            </span>
          </div>
          <div className="w-full h-1 bg-muted/40 rounded-full mt-2 overflow-hidden">
            <motion.div
              animate={{ width: `${(validCount / 4) * 100}%` }}
              className="h-full bg-accent rounded-full"
            />
          </div>
        </div>
    </div>
  );
}
