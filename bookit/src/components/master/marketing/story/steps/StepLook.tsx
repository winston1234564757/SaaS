'use client';

import { X, Plus, Check } from 'lucide-react';
import { PALETTES, STOCK_PHOTOS } from '../storyConstants';
import type { PortfolioItemFull } from '@/types/database';

interface StepLookProps {
  palIdx: number;
  onPalette(i: number): void;
  selectedBgPhotoId: string | null;
  customBgPhoto: string | null;
  selectedStockId: string | null;
  portfolioItems: PortfolioItemFull[];
  onPickPortfolio(id: string): void;
  onPickStock(id: string): void;
  onClearBg(): void;
  onUploadClick(): void;
}

export function StepLook({
  palIdx, onPalette, selectedBgPhotoId, customBgPhoto, selectedStockId,
  portfolioItems, onPickPortfolio, onPickStock, onClearBg, onUploadClick,
}: StepLookProps) {
  const noBg = !selectedBgPhotoId && !customBgPhoto && !selectedStockId;

  return (
    <div className="space-y-5">
      {/* Палітра */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Палітра</p>
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
        <p className="text-[10px] text-muted-foreground/60 mt-1.5">{PALETTES[palIdx].label}</p>
      </div>

      {/* Стокові фото — лише якщо є ассети */}
      {STOCK_PHOTOS.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Стокові фото</p>
          <div className="flex gap-2 flex-wrap">
            {STOCK_PHOTOS.map(s => {
              const active = selectedStockId === s.id;
              return (
                <button key={s.id} type="button" aria-label={s.label} aria-pressed={active}
                  onClick={() => onPickStock(s.id)}
                  className={`relative size-11 rounded-xl overflow-hidden border-2 transition-colors duration-150 cursor-pointer active:scale-[0.92] ${active ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}>
                  <img src={s.url} className="w-full h-full object-cover" alt="" />
                  {active && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Check size={12} className="text-white" strokeWidth={3} /></div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Фон (фото) */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold text-muted-foreground">Фон (фото)</p>
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
      </div>
    </div>
  );
}
