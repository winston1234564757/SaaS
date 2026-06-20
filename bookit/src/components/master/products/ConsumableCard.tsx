'use client';

// humanized
import { Package2, Droplets, FlaskConical } from 'lucide-react';
import type { Product } from '@/types/database';

const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };
const UNIT_ICON = { pcs: Package2, ml: Droplets, g: FlaskConical } as const;

interface ConsumableCardProps {
  product: Product;
  onEdit: (p: Product) => void;
  onRestock: (p: Product) => void;
}

export function ConsumableCard({ product, onEdit, onRestock }: ConsumableCardProps) {
  const unit = product.unit ?? 'pcs';
  const Icon = UNIT_ICON[unit];
  const isLow = product.stock_qty <= (unit === 'pcs' ? 3 : 10);

  return (
    <div className="bento-card p-4 flex items-center gap-4">
      <div className="size-11 rounded-xl bg-secondary/40 border border-border flex items-center justify-center shrink-0">
        <Icon size={18} className="text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
        <p className={`text-xs mt-0.5 font-medium ${isLow ? 'text-destructive' : 'text-muted-foreground/70'}`}>
          {product.stock_qty} {UNIT_LABEL[unit]}
          {isLow && ' — критично мало'}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label="Поповнити запас"
          onClick={() => onRestock(product)}
          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors active:scale-95"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Редагувати розхідник"
          onClick={() => onEdit(product)}
          className="px-3 py-1.5 rounded-lg bg-secondary/60 text-muted-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors active:scale-95"
        >
          Ред.
        </button>
      </div>
    </div>
  );
}
