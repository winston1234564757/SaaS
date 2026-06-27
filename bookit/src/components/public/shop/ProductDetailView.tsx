'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, PencilLine, Star } from 'lucide-react';
import type { Product, ProductCategory } from '@/types/database';
import { ProductIcon } from '@/lib/product-icons';

const GALLERY_SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 } as const;

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  hair:  'Волосся', nails: 'Нігті',  skin:  'Шкіра',
  brows: 'Брови',   body:  'Тіло',   tools: 'Інструменти', other: 'Інше',
};

const CATEGORY_COLORS: Record<string, string> = {
  hair: 'var(--cat-hair)', nails: 'var(--cat-nails)', skin: 'var(--cat-skin)',
  brows: 'var(--cat-brows)', body: 'var(--cat-body)', tools: 'var(--cat-tools)', other: 'var(--cat-other)',
};

interface Props {
  product: Product;
  mode?: 'client' | 'master';
  /** Cart controls (qty stepper + add) rendered after the description. Client only. */
  actions?: ReactNode;
}

/**
 * Presentational product detail — gallery + info + reviews. Pure (no cart state).
 * Shared by the public product page and the master read-only preview Sheet.
 */
export function ProductDetailView({ product: p, mode = 'client', actions }: Props) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos   = p.photos ?? [];
  const catColor = CATEGORY_COLORS[p.category] ?? 'var(--cat-other)';
  const price    = (p.price_kopecks / 100).toFixed(0);

  return (
    <div className="flex flex-col">
      {/* Photo gallery */}
      <div className="relative w-full aspect-square bg-secondary overflow-hidden group">
        {photos.length > 0 ? (
          <motion.div
            className="flex h-full"
            animate={{ x: `-${photoIdx * 100}%` }}
            transition={GALLERY_SPRING}
            drag="x"
            dragConstraints={{ left: -(photos.length - 1) * 100, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, { offset }) => {
              const threshold = 50;
              if (offset.x < -threshold && photoIdx < photos.length - 1) setPhotoIdx(i => i + 1);
              else if (offset.x > threshold && photoIdx > 0) setPhotoIdx(i => i - 1);
            }}
          >
            {photos.map((ph, i) => (
              <div key={i} className="relative w-full h-full shrink-0">
                <Image
                  src={ph}
                  alt={p.name}
                  fill
                  className="object-cover pointer-events-none"
                  sizes="(max-width:640px) 100vw,512px"
                  priority={i === 0}
                />
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ProductIcon name={p.icon_name} size={56} className="text-muted-foreground" />
          </div>
        )}

        {/* Desktop arrows */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Попереднє фото"
              onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-secondary/90 shadow-lg flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-[0.95] cursor-pointer z-20 hidden md:flex"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              aria-label="Наступне фото"
              onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-secondary/90 shadow-lg flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-[0.95] cursor-pointer z-20 hidden md:flex"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Category badge */}
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold text-white z-20" style={{ background: `color-mix(in srgb, ${catColor} 93%, transparent)`, backdropFilter: 'blur(6px)' }}>
          {CATEGORY_LABELS[p.category]}
        </div>

        {/* Dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
            {photos.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setPhotoIdx(i)}
                aria-label={`Фото ${i + 1}`}
                aria-pressed={i === photoIdx}
                className="p-3 -m-3"
              >
                <span className="block size-2 rounded-full transition-all" style={{ background: i === photoIdx ? 'var(--accent)' : 'var(--text-tertiary)' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail row */}
      {photos.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto scrollbar-hide">
          {photos.map((ph, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setPhotoIdx(i)}
              aria-label={`Фото ${i + 1}`}
              aria-pressed={i === photoIdx}
              className="relative shrink-0 size-16 rounded-md overflow-hidden border-2 transition-all active:scale-[0.95] cursor-pointer"
              style={{ borderColor: i === photoIdx ? 'var(--accent)' : 'transparent' }}
            >
              <Image src={ph} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="px-5 pt-4 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">{p.name}</h1>
          <p className="text-2xl font-bold text-foreground mt-2">{price} ₴</p>
          {p.stock_qty > 0 && p.stock_qty <= 10 && (
            <p className="text-xs text-warning font-semibold mt-1">Залишилось {p.stock_qty} шт</p>
          )}
          {p.stock_qty <= 0 && (
            <p className="text-xs text-destructive font-semibold mt-1">Немає в наявності</p>
          )}
        </div>

        {/* Description — or master nudge when empty */}
        {p.description?.trim() ? (
          <div>
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Про товар</p>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{p.description}</p>
          </div>
        ) : mode === 'master' ? (
          <div className="flex items-start gap-2.5 rounded-2xl bg-primary/8 border border-primary/15 px-4 py-3.5">
            <PencilLine size={16} className="text-primary mt-0.5 shrink-0" />
            <p className="text-[13px] text-muted-foreground leading-snug">Додайте опис, щоб клієнтам було легше обрати</p>
          </div>
        ) : null}

        {/* Cart controls (client page) */}
        {actions}

        {/* Reviews — wired up in M-SHOP-03b */}
        <div className="flex flex-col gap-2 border-t border-border pt-5 mt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-[0.14em] m-0">Відгуки</h2>
            <Star size={14} className="text-muted-foreground/25" />
          </div>
          <p className="text-sm text-muted-foreground/60 py-1.5">Відгуків поки немає</p>
        </div>
      </div>
    </div>
  );
}
