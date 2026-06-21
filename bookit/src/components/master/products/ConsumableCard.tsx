'use client';

// humanized
import { motion } from 'framer-motion';
import { Package2, Droplets, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Product } from '@/types/database';

const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };
const UNIT_ICON = { pcs: Package2, ml: Droplets, g: FlaskConical } as const;

interface ConsumableCardProps {
  product: Product;
  index?: number;
  onEdit: (p: Product) => void;
  onRestock: (p: Product) => void;
}

export function ConsumableCard({ product, index = 0, onEdit, onRestock }: ConsumableCardProps) {
  const unit = (product.unit ?? 'pcs') as 'pcs' | 'ml' | 'g';
  const Icon = UNIT_ICON[unit];
  const threshold = product.stock_alert_threshold;
  const isCritical = threshold != null && product.stock_qty <= threshold;

  const maxForBar = threshold ? threshold * 2 : Math.max(product.stock_qty, 1);
  const pct = threshold
    ? Math.min(100, Math.round((product.stock_qty / maxForBar) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.2), type: 'spring' as const, stiffness: 340, damping: 26 }}
      className="bento-card p-3.5 md:p-4 flex flex-col gap-2.5"
    >
      {/* Top row: icon + name + buttons */}
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-xl bg-[var(--accent-light)] flex items-center justify-center shrink-0">
          <Icon size={18} className="text-[var(--text-secondary)]" />
        </div>

        <p className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate">
          {product.name}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label="Поповнити запас"
            onClick={() => onRestock(product)}
            className="px-3 py-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-on)] text-xs font-semibold active:scale-[0.95] transition-transform duration-100"
          >
            Поповнити
          </button>
          <button
            type="button"
            aria-label="Редагувати розхідник"
            onClick={() => onEdit(product)}
            className="px-3 py-1.5 rounded-full border border-[var(--border-strong)] text-[var(--text-secondary)] bg-transparent text-xs font-semibold active:scale-[0.95] transition-transform duration-100 hover:bg-[var(--accent-light)]"
          >
            Редагувати
          </button>
        </div>
      </div>

      {/* Bottom row: stock + progress bar + threshold */}
      <div className="flex items-center gap-2.5 pl-14">
        <span className={cn(
          'text-xs font-bold tabular-nums shrink-0',
          isCritical ? 'text-destructive' : 'text-[var(--text-secondary)]'
        )}>
          {product.stock_qty} {UNIT_LABEL[unit]}
        </span>

        <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isCritical ? 'bg-destructive/70' : 'bg-[var(--accent)]/30'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        {threshold != null && (
          <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 tabular-nums">
            мін: {threshold} {UNIT_LABEL[unit]}
          </span>
        )}
      </div>
    </motion.div>
  );
}
