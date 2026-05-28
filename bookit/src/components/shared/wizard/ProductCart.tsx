'use client';
// src/components/shared/wizard/ProductCart.tsx
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Plus, Minus, Sparkles } from 'lucide-react';
import { fmt, slide } from './helpers';
import type { WizardProduct, CartItem } from './types';
import { ProductIcon } from '@/lib/product-icons';

interface ProductCartProps {
  availableProducts: WizardProduct[];
  suggestedProductIds: Set<string>;
  cart: CartItem[];
  totalProductsPrice: number;
  direction: number;
  onAdd: (p: WizardProduct) => void;
  onRemove: (id: string) => void;
  cartQty: (id: string) => number;
  onContinue: () => void;
}

export function ProductCart({
  availableProducts,
  suggestedProductIds,
  cart,
  totalProductsPrice,
  direction,
  onAdd,
  onRemove,
  cartQty,
  onContinue,
}: ProductCartProps) {
  const sortedProducts = useMemo(() => {
    if (!suggestedProductIds.size) return availableProducts;
    return [
      ...availableProducts.filter(p => suggestedProductIds.has(p.id)),
      ...availableProducts.filter(p => !suggestedProductIds.has(p.id)),
    ];
  }, [availableProducts, suggestedProductIds]);

  return (
    <motion.div key="products" custom={direction} variants={slide}
      initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full min-h-[400px]"
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag size={16} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Додати до візиту?</p>
        </div>
        <p className="text-xs text-muted-foreground/60 mb-5">Додайте товари — вони увійдуть у загальний чек</p>

        <div className="flex flex-col gap-2 mb-5">
          {sortedProducts.map(p => {
            const qty      = cartQty(p.id);
            const isLinked = suggestedProductIds.has(p.id);
            const atMax    = p.stock !== null && p.stock !== undefined && qty >= (p.stock ?? Infinity);
            return (
              <div
                key={p.id}
                onClick={() => { if (qty === 0) onAdd(p); }}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  qty > 0 ? 'bg-primary/10 border-primary/40 shadow-sm' : 'bg-secondary border-border hover:bg-secondary/90 active:scale-[0.95]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 border border-primary/20">
                  <ProductIcon name={p.icon_name} size={18} className="text-primary flex-shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                  {p.description && <p className="text-xs text-muted-foreground/60 truncate">{p.description}</p>}
                  <p className="text-sm font-bold text-primary mt-0.5">
                    {fmt(p.price)}{isLinked && <Sparkles size={12} className="inline text-primary ml-1.5" />}
                  </p>
                </div>
                {qty === 0 ? (
                  <div className="w-11 h-11 rounded-full bg-[var(--btn-primary-bg)] text-[var(--accent-on)] flex items-center justify-center shrink-0 pointer-events-none">
                    <Plus size={15} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onRemove(p.id)}
                      className="w-11 h-11 rounded-full bg-secondary text-muted-foreground flex items-center justify-center border border-border/40 hover:bg-secondary/80 active:scale-[0.88] transition-all cursor-pointer">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold text-foreground w-4 text-center">{qty}</span>
                    <button onClick={() => onAdd(p)}
                      disabled={atMax}
                      className="w-11 h-11 rounded-full bg-[var(--btn-primary-bg)] text-[var(--accent-on)] flex items-center justify-center hover:opacity-90 active:scale-[0.88] transition-all cursor-pointer disabled:opacity-40">
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {cart.length > 0 && (
          <div className="flex items-center justify-between px-1 mb-4">
            <span className="text-xs text-muted-foreground/60">Товари ({cart.reduce((n, ci) => n + ci.quantity, 0)} шт.)</span>
            <span className="text-sm font-bold text-primary">{fmt(totalProductsPrice)}</span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 pb-2 sticky bottom-0 bg-gradient-to-t from-background via-background/90 to-transparent z-10 flex gap-3">
        <button onClick={onContinue}
          data-testid="wizard-skip-products-btn"
          className="flex-1 py-4 rounded-lg border-2 border-primary/20 bg-secondary/40 text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 active:scale-[0.95] transition-all cursor-pointer">
          {cart.length > 0 ? 'Назад' : 'Пропустити'}
        </button>
        <button onClick={onContinue}
          data-testid="wizard-next-btn"
          className="flex-[2] py-4 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-sm font-bold uppercase tracking-widest hover:opacity-90 active:scale-[0.95] transition-all shadow-lg cursor-pointer">
          {cart.length > 0 ? `Далі · ${fmt(totalProductsPrice)}` : 'Далі'}
        </button>
      </div>
    </motion.div>
  );
}
