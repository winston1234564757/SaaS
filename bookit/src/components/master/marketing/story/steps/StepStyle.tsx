'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { STYLE_PRESETS } from '../storyConstants';
import type { StoryEditorState, StorySetters, TextSize } from '../storyTypes';

interface StepStyleProps {
  state: StoryEditorState;
  set: StorySetters;
}

const TOGGLE_SPRING = { type: 'spring', stiffness: 500, damping: 30 } as const;
const SIZES: { id: TextSize; label: string }[] = [
  { id: 'S', label: 'Малий' },
  { id: 'M', label: 'Середній' },
  { id: 'L', label: 'Великий' },
];

export function StepStyle({ state, set }: StepStyleProps) {
  const { styleId, textSize, showAvatar, showLinkZone } = state;

  return (
    <div className="space-y-5">
      {/* Образи */}
      <div>
        <p className="text-xs font-semibold text-text-sub mb-2">Образ</p>
        <div className="grid grid-cols-2 gap-2.5">
          {STYLE_PRESETS.map(p => {
            const active = p.id === styleId;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => set.setStyleId(p.id)}
                className={cn(
                  'relative flex flex-col items-start justify-between h-20 px-3.5 py-3 rounded-2xl text-left transition-colors duration-150 cursor-pointer active:scale-[0.97] overflow-hidden',
                  active
                    ? 'bg-[var(--btn-primary-bg)] shadow-[0_4px_12px_color-mix(in_srgb,var(--accent)_25%,transparent)]'
                    : 'bg-secondary/70 border border-border',
                )}
              >
                <span
                  className="text-lg leading-tight"
                  style={{
                    fontFamily: p.headingFont,
                    fontWeight: p.headingWeight,
                    letterSpacing: p.letterSpacing,
                    textTransform: p.uppercase ? 'uppercase' : 'none',
                    color: active ? 'var(--accent-on)' : 'var(--text-primary)',
                  }}
                >
                  Аа
                </span>
                <span className={cn('text-xs font-semibold', active ? 'text-accent-on' : 'text-text-secondary')}>
                  {p.label}
                </span>
                {active && (
                  <span className="absolute top-2 right-2">
                    <Check size={14} strokeWidth={3} style={{ color: 'var(--accent-on)' }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Розмір тексту */}
      <div>
        <p className="text-xs font-semibold text-text-sub mb-2">Розмір тексту</p>
        <div className="flex bg-secondary/40 rounded-xl p-0.5 border border-border">
          {SIZES.map(sz => (
            <button key={sz.id} type="button" aria-pressed={textSize === sz.id} onClick={() => set.setTextSize(sz.id)}
              className={cn('flex-1 py-2 text-xs font-bold rounded-lg transition-colors duration-150 active:scale-[0.95] cursor-pointer',
                textSize === sz.id ? 'bg-surface shadow-sm text-foreground' : 'text-text-sub hover:text-text-sub')}>
              {sz.label}
            </button>
          ))}
        </div>
      </div>

      {/* Елементи кадру */}
      <div>
        <p className="text-xs font-semibold text-text-sub mb-2">Елементи кадру</p>
        <div className="space-y-2.5">
          <button type="button" role="switch" aria-checked={showAvatar}
            onClick={() => set.setShowAvatar(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-secondary/70 border border-border cursor-pointer active:scale-[0.99] transition-colors duration-150">
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-foreground">Аватар та ім&apos;я</p>
              <p className="text-[11px] text-text-sub">Фото й назва зверху сторіс</p>
            </div>
            <span className={`relative ml-2 w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${showAvatar ? 'bg-accent' : 'bg-secondary'}`}>
              <motion.div animate={{ x: showAvatar ? 26 : 2 }} transition={TOGGLE_SPRING} className="absolute top-1 size-4 rounded-full bg-white shadow-sm" />
            </span>
          </button>

          <button type="button" role="switch" aria-checked={showLinkZone}
            onClick={() => set.setShowLinkZone(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-secondary/70 border border-border cursor-pointer active:scale-[0.99] transition-colors duration-150">
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-foreground">Місце для посилання</p>
              <p className="text-[11px] text-text-sub">Постав туди кнопку запису просто в Instagram</p>
            </div>
            <span className={`relative ml-2 w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${showLinkZone ? 'bg-accent' : 'bg-secondary'}`}>
              <motion.div animate={{ x: showLinkZone ? 26 : 2 }} transition={TOGGLE_SPRING} className="absolute top-1 size-4 rounded-full bg-white shadow-sm" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
