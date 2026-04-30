'use client';
// src/components/shared/wizard/ProductCart.tsx
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import { fmt, slide } from './helpers';
import type { WizardProduct, CartItem } from './types';

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
      transition={{ duration: 0.2, ease: 'easeInOut' }}>

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
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                qty > 0 ? 'bg-primary/10 border-primary/40' : 'bg-white/60 border-white/80 hover:bg-white/80 active:scale-[0.98]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(255,210,194,0.4)' }}>
                {p.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                {p.description && <p className="text-xs text-muted-foreground/60 truncate">{p.description}</p>}
                <p className="text-sm font-bold text-primary mt-0.5">
                  {fmt(p.price)}{isLinked && <span className="ml-1.5 text-xs font-normal">✨</span>}
                </p>
              </div>
              {qty === 0 ? (
                <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shrink-0 pointer-events-none">
                  <Plus size={15} />
                </div>
              ) : (
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => onRemove(p.id)}
                    className="w-11 h-11 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:bg-[#EDD9D1] transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold text-foreground w-4 text-center">{qty}</span>
                  <button onClick={() => onAdd(p)}
                    disabled={atMax}
                    className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40">
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

      <div className="sticky bottom-6 mt-8 pt-3 pb-0.5 bg-gradient-to-t from-[rgba(255,248,244,1)] via-[rgba(255,248,244,0.9)] to-transparent z-10 flex gap-3">
        <button onClick={onContinue}
          data-testid="wizard-skip-products-btn"
          className="flex-1 py-4 rounded-2xl border-2 border-primary/20 bg-white/40 text-[11px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 active:scale-95 transition-all">
          {cart.length > 0 ? 'Назад' : 'Пропустити'}
        </button>
        <button onClick={onContinue}
          data-testid="wizard-next-btn"
          className="flex-[2] py-4 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-[#6B8C8B] active:scale-95 transition-all shadow-xl shadow-primary/20">
          {cart.length > 0 ? `Далі · ${fmt(totalProductsPrice)}` : 'Далі'}
        </button>
      </div>
    </motion.div>
  );
}
