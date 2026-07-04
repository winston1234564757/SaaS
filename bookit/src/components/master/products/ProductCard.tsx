'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Pencil, RefreshCw, GripVertical, BarChart3, Eye } from 'lucide-react';
import type { Product, ProductCategory } from '@/types/database';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { ProductIcon } from '@/lib/product-icons';
import { cn } from '@/lib/utils/cn';

export type ProductView = 'grid' | 'list';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  hair:  'Волосся',
  nails: 'Нігті',
  skin:  'Шкіра',
  brows: 'Брови',
  body:  'Тіло',
  tools: 'Інструменти',
  other: 'Інше',
};

// Pill colour (full background) — used in list view content row.
const STOCK_PILL = (qty: number) => {
  if (qty === 0) return 'text-destructive bg-destructive/10';
  if (qty <= 3)  return 'text-warning bg-warning/10';
  return 'text-success bg-success/10';
};

// Text colour only — used over the photo badge (own glass background).
const STOCK_TEXT = (qty: number) => {
  if (qty === 0) return 'text-destructive';
  if (qty <= 3)  return 'text-warning';
  return 'text-success';
};

const stockLabel = (qty: number) => (qty === 0 ? 'Немає' : `${qty} шт`);

interface Props {
  product: Product;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onEdit:    () => void;
  onRestock: () => void;
  onToggle:  () => void;
  onOpenStats?: () => void;
  onPreview?: () => void;
  index?: number;
  view?: ProductView;
}

export function ProductCard({ product: p, dragHandleProps, onEdit, onRestock, onToggle, onOpenStats, onPreview, index = 0, view = 'grid' }: Props) {
  const priceUah   = (p.price_kopecks / 100).toFixed(0);
  const coverPhoto = p.photos[0] ?? null;

  const enter = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: Math.min(index * 0.04, 0.2), type: 'spring' as const, stiffness: 340, damping: 26 } as const,
  };

  // Shared management controls — identical markup in both views.
  const actions = (
    <div className="flex items-center gap-1">
      {onPreview && (
        <ActionBtn onClick={onPreview} label="Переглянути як бачить клієнт">
          <Eye size={14} />
        </ActionBtn>
      )}
      {onOpenStats && (
        <ActionBtn onClick={onOpenStats} label="Аналітика продажів">
          <BarChart3 size={14} />
        </ActionBtn>
      )}
      <ActionBtn onClick={onRestock} label="Поповнити склад">
        <RefreshCw size={14} />
      </ActionBtn>
      <ActionBtn onClick={onEdit} label="Редагувати товар">
        <Pencil size={14} />
      </ActionBtn>
    </div>
  );

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={p.is_active}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="py-[12px] px-0.5 -my-[12px] flex items-center shrink-0 active:scale-95"
      aria-label={p.is_active ? 'Деактивувати товар' : 'Активувати товар'}
    >
      <span className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${p.is_active ? 'bg-accent' : 'bg-muted-foreground/25'}`}>
        <motion.div
          animate={{ x: p.is_active ? 26 : 2 }}
          transition={{ type: 'spring' as const, stiffness: 500, damping: 30 } as const}
          className="absolute top-1 size-4 rounded-full bg-white shadow-sm"
        />
      </span>
    </button>
  );

  // ─────────────────────────── LIST VIEW ───────────────────────────
  if (view === 'list') {
    return (
      <motion.div
        {...enter}
        className={cn(
          'bento-card overflow-hidden p-0 flex items-stretch group transition-all duration-300',
          !p.is_active && 'opacity-55'
        )}
      >
        {/* Thumbnail */}
        <div className="relative w-[60px] self-stretch flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary/12 via-accent/8 to-primary/5">
          <button
            type="button"
            {...dragHandleProps}
            aria-label="Перемістити товар"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-0.5 left-0.5 size-5 rounded-md bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
          >
            <GripVertical size={11} className="text-white" />
          </button>
          {coverPhoto ? (
            <Image src={coverPhoto} alt={p.name} fill sizes="60px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/55">
              <ProductIcon name={p.icon_name} size={22} />
            </div>
          )}
        </div>

        {/* Content — clickable → editor. Name gets full width. */}
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Редагувати товар ${p.name}`}
          className="flex-1 min-w-0 text-left px-3 py-2 flex flex-col justify-center gap-1 hover:opacity-80 transition-opacity"
        >
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{p.name}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              {CATEGORY_LABELS[p.category]}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STOCK_PILL(p.stock_qty)}`}>
              {stockLabel(p.stock_qty)}
            </span>
          </div>
        </button>

        {/* Price over actions — right column */}
        <div className="flex flex-col items-end justify-center gap-1.5 pl-1 pr-2 py-2 flex-shrink-0">
          <p className="metric-value text-sm text-foreground whitespace-nowrap">{priceUah} ₴</p>
          <div className="flex items-center gap-0.5">
            {actions}
            {toggle}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────── GRID VIEW ───────────────────────────
  return (
    <motion.div
      {...enter}
      className={cn(
        'bento-card overflow-hidden p-0 flex flex-col group transition-all duration-300',
        !p.is_active && 'opacity-55'
      )}
    >
      {/* Visual zone — full-width photo on top, or tinted icon fallback */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/12 via-accent/8 to-primary/5">
        <button
          type="button"
          {...dragHandleProps}
          aria-label="Перемістити товар"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1.5 left-1.5 size-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        >
          <GripVertical size={13} className="text-white" />
        </button>

        {coverPhoto ? (
          <Image src={coverPhoto} alt={p.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary/55">
            <ProductIcon name={p.icon_name} size={40} />
          </div>
        )}

        {/* Stock badge — glass pill over photo */}
        <span className="absolute top-1.5 right-1.5 flex items-center h-6 px-2 rounded-full bg-background/85 backdrop-blur-sm shadow-sm">
          <span className={`text-[10px] font-semibold ${STOCK_TEXT(p.stock_qty)}`}>{stockLabel(p.stock_qty)}</span>
        </span>
      </div>

      {/* Content — clickable area → editor */}
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Редагувати товар ${p.name}`}
        className="text-left px-3 pt-3 pb-1.5 flex flex-col gap-1 hover:opacity-80 transition-opacity"
      >
        <p className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2">{p.name}</p>

        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
            {CATEGORY_LABELS[p.category]}
          </span>
        </div>

        <p className="metric-value text-lg text-foreground leading-none pt-0.5">{priceUah} ₴</p>
      </button>

      {/* Footer — management actions */}
      <div className="flex items-center justify-between px-3 py-2 mt-auto border-t border-secondary/60">
        {actions}
        {toggle}
      </div>
    </motion.div>
  );
}

function ActionBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={label}
      className="size-11 flex items-center justify-center rounded-full bg-secondary/60 border border-border text-text-sub hover:bg-secondary hover:text-primary transition-colors active:scale-95"
    >
      {children}
    </button>
  );
}
