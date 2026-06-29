'use client';

import { motion } from 'framer-motion';
import { INPUT_STYLE } from '../storyConstants';
import type { StoryEditorState, StorySetters } from '../storyTypes';

interface StepStyleProps {
  state: StoryEditorState;
  set: StorySetters;
}

const TOGGLE_SPRING = { type: 'spring', stiffness: 500, damping: 30 } as const;

export function StepStyle({ state, set }: StepStyleProps) {
  const { platePos, textAlign, transparency, showAvatar, showSticker, ctaText } = state;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1.5 font-semibold uppercase tracking-wide">Позиція</label>
          <div className="flex bg-secondary/40 rounded-xl p-0.5 border border-border">
            {(['top', 'center', 'bottom'] as const).map(pos => (
              <button key={pos} type="button" aria-pressed={platePos === pos} onClick={() => set.setPlatePos(pos)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-colors duration-150 active:scale-[0.88] cursor-pointer ${platePos === pos ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'}`}>
                {pos === 'top' ? 'Вгору' : pos === 'center' ? 'Центр' : 'Низ'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1.5 font-semibold uppercase tracking-wide">Текст</label>
          <div className="flex bg-secondary/40 rounded-xl p-0.5 border border-border">
            {(['left', 'center', 'right'] as const).map(a => (
              <button key={a} type="button" aria-pressed={textAlign === a} onClick={() => set.setTextAlign(a)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-colors duration-150 active:scale-[0.88] cursor-pointer ${textAlign === a ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'}`}>
                {a === 'left' ? 'Ліво' : a === 'center' ? 'Центр' : 'Право'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Скло</label>
          <span className="text-[10px] font-bold text-primary">{transparency}%</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={transparency}
          onChange={e => set.setTransparency(Number(e.target.value))}
          aria-label="Прозорість скла" className="w-full cursor-pointer h-1.5 bg-secondary/50 rounded-lg appearance-none" style={{ accentColor: 'var(--accent)' }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" role="switch" aria-checked={showAvatar}
          onClick={() => set.setShowAvatar(v => !v)}
          className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondary/70 border border-border cursor-pointer active:scale-[0.97] transition-colors duration-150">
          <div className="min-w-0 text-left">
            <p className="text-xs font-semibold text-foreground">Показувати фото</p>
            <p className="text-[10px] text-muted-foreground/60">Аватар та ім&apos;я</p>
          </div>
          <span className={`relative ml-2 w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${showAvatar ? 'bg-accent' : 'bg-muted-foreground/25'}`}>
            <motion.div animate={{ x: showAvatar ? 26 : 2 }} transition={TOGGLE_SPRING} className="absolute top-1 size-4 rounded-full bg-white shadow-sm" />
          </span>
        </button>
        <button type="button" role="switch" aria-checked={showSticker}
          onClick={() => set.setShowSticker(v => !v)}
          className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondary/70 border border-border cursor-pointer active:scale-[0.97] transition-colors duration-150">
          <div className="min-w-0 text-left">
            <p className="text-xs font-semibold text-foreground">Кнопка запису</p>
            <p className="text-[10px] text-muted-foreground/60">Стікер внизу сторіс</p>
          </div>
          <span className={`relative ml-2 w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${showSticker ? 'bg-accent' : 'bg-muted-foreground/25'}`}>
            <motion.div animate={{ x: showSticker ? 26 : 2 }} transition={TOGGLE_SPRING} className="absolute top-1 size-4 rounded-full bg-white shadow-sm" />
          </span>
        </button>
      </div>

      {showSticker && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Текст кнопки</label>
          <div className="flex gap-2 items-center">
            <input value={ctaText} onChange={e => set.setCtaText(e.target.value.slice(0, 28))} maxLength={28}
              placeholder="Записатися онлайн" className="flex-1 outline-none text-sm" style={INPUT_STYLE} />
            <span className="text-[10px] text-muted-foreground/60 shrink-0">{ctaText.length}/28</span>
          </div>
        </div>
      )}
    </div>
  );
}
