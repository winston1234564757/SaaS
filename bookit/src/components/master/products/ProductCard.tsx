'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Pencil, RefreshCw, Package } from 'lucide-react';
import type { Product, ProductCategory } from '@/types/database';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  hair:  'Волосся',
  nails: 'Нігті',
  skin:  'Шкіра',
  brows: 'Брови',
  body:  'Тіло',
  tools: 'Інструменти',
  other: 'Інше',
};

const STOCK_COLOR = (qty: number) => {
  if (qty === 0) return 'text-destructive bg-destructive/10';
  if (qty <= 3)  return 'text-warning bg-warning/10';
  return 'text-success bg-success/10';
};

interface Props {
  product: Product;
  onEdit:    () => void;
  onRestock: () => void;
  onToggle:  () => void;
}

export function ProductCard({ product: p, onEdit, onRestock, onToggle }: Props) {
  const priceUah   = (p.price_kopecks / 100).toFixed(0);
  const coverPhoto = p.photos[0] ?? null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bento-card p-4 flex gap-3 transition-opacity ${!p.is_active ? 'opacity-55' : ''}`}
    >
      {/* Photo / placeholder */}
      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-secondary shrink-0 flex items-center justify-center">
        {coverPhoto ? (
          <Image src={coverPhoto} alt={p.name} width={64} height={64} className="object-cover w-full h-full" />
        ) : (
          <Package size={24} className="text-muted-foreground/60" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>

          {/* Active toggle */}
          <button
            onClick={onToggle}
            className={`shrink-0 w-9 h-5 rounded-full transition-colors ${p.is_active ? 'bg-primary' : 'bg-[#D4B9B0]'} active:scale-95 transition-all`}
            aria-label={p.is_active ? 'Деактивувати' : 'Активувати'}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${p.is_active ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
              style={{ marginTop: 2 }}
            />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground/60 bg-secondary px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[p.category]}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STOCK_COLOR(p.stock_qty)}`}>
            {p.stock_qty === 0 ? 'Немає' : `${p.stock_qty} шт`}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <p className="text-base font-bold text-foreground">{priceUah} ₴</p>

          <div className="flex gap-1.5">
            <ActionBtn onClick={onRestock} label="Поповнити">
              <RefreshCw size={14} />
            </ActionBtn>
            <ActionBtn onClick={onEdit} label="Редагувати">
              <Pencil size={14} />
            </ActionBtn>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-8 h-8 rounded-xl bg-white/70 border border-white/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white transition-all active:scale-95"
    >
      {children}
    </button>
  );
}
