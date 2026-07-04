'use client';

import { X, Plus, Check, Sparkles } from 'lucide-react';
import { PALETTES } from '../storyConstants';
import type { PortfolioItemFull } from '@/types/database';

interface StepLookProps {
  palIdx: number;
  onPalette(i: number): void;
  selectedBgPhotoId: string | null;
  customBgPhoto: string | null;
  portfolioItems: PortfolioItemFull[];
  onPickPortfolio(id: string): void;
  onClearBg(): void;
  onUploadClick(): void;
}

export function StepLook({
  palIdx, onPalette, selectedBgPhotoId, customBgPhoto,
  portfolioItems, onPickPortfolio, onClearBg, onUploadClick,
}: StepLookProps) {
  const noBg = !selectedBgPhotoId && !customBgPhoto;

  return (
    <div className="space-y-5">
      {/* Палітра */}
      <div>
        <p className="text-xs font-semibold text-text-sub mb-2">Палітра</p>
        <div className="flex gap-2 flex-wrap">
          {PALETTES.map((p, i) => (
            <button key={p.id} type="button" aria-label={p.label} aria-pressed={i === palIdx}
              onClick={() => onPalette(i)}
              className="relative size-7 rounded-full transition-colors duration-150 cursor-pointer"
              style={{
                background: p.bg,
                border: i === palIdx ? '2.5px solid var(--accent)' : `2px solid ${p.muted}`,
                boxShadow: i === palIdx ? '0 0 0 2px color-mix(in srgb, var(--accent) 28%, transparent)' : undefined,
              }}>
              {i === palIdx && <span className="absolute inset-0 flex items-center justify-center"><Check size={10} style={{ color: p.text }} strokeWidth={3} /></span>}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-text-sub mt-1.5">{PALETTES[palIdx].label}</p>
      </div>

      {/* Фон (фото) */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold text-text-sub">Фон (фото)</p>
          <button type="button" onClick={onUploadClick} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer">
            <Plus size={11} /> Завантажити
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={onClearBg} aria-label="Без фону" aria-pressed={noBg}
            className={`relative size-11 rounded-xl flex items-center justify-center border-2 transition-colors duration-150 active:scale-[0.92] cursor-pointer ${noBg ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/40 text-text-secondary'}`}>
            <X size={16} />
          </button>
          {customBgPhoto && (
            <span className="relative size-11 rounded-xl overflow-hidden border-2 border-primary ring-2 ring-primary/20 inline-block">
              <img src={customBgPhoto} className="w-full h-full object-cover" alt="" />
              <span className="absolute inset-0 bg-black/20 flex items-center justify-center"><Check size={12} className="text-white" strokeWidth={3} /></span>
            </span>
          )}
          {portfolioItems.map(item => (
            <button key={item.id} type="button" onClick={() => onPickPortfolio(item.id)}
              aria-label={item.title ?? 'Фото з портфоліо'} aria-pressed={selectedBgPhotoId === item.id}
              className={`relative size-11 rounded-xl overflow-hidden border-2 transition-colors duration-150 active:scale-[0.92] cursor-pointer ${selectedBgPhotoId === item.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}>
              <img src={item.photos[0]?.url} className="w-full h-full object-cover" alt="" />
              {selectedBgPhotoId === item.id && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Check size={12} className="text-white" strokeWidth={3} /></div>}
            </button>
          ))}
        </div>

        {/* Нудж: власні фото робіт */}
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl px-3.5 py-3"
          style={{ background: 'var(--accent-soft)', border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)' }}>
          <Sparkles size={15} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] leading-snug text-foreground/80">
            Додайте свої найкращі роботи. Саме ваші фото роблять сторіс унікальною.
          </p>
        </div>
      </div>
    </div>
  );
}
