'use client';
// src/components/shared/wizard/ProductCart.tsx
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { fmt, slide } from './helpers';
import type { WizardProduct, CartItem } from './types';
import { ProductIcon } from '@/lib/product-icons';
import { Button } from '@/components/ui/Button';
import { pluralUk } from '@/lib/utils/pluralUk';

interface ProductCartProps {
  availableProducts: WizardProduct[];
  suggestedProductIds: Set<string>;
  cart: CartItem[];
  totalProductsPrice: number;
  direction: number;
  onAdd: (p: WizardProduct) => void;
  onRemove: (id: string) => void;
  cartQty: (id: string) => number;
  onBack: () => void;
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
  onBack,
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
      transition={{ type: 'spring' as const, duration: 0.28, bounce: 0 }}
      className="flex flex-col min-h-[400px]"
    >
      <div>
        <p className="text-sm text-text-sub mb-5">Товари увійдуть у загальний чек — за бажанням</p>

        <div className="flex flex-col gap-2 mb-5">
          {sortedProducts.map(p => {
            const qty      = cartQty(p.id);
            const isLinked = suggestedProductIds.has(p.id);
            const atMax    = p.stock !== null && p.stock !== undefined && qty >= (p.stock ?? Infinity);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  qty > 0
                    ? 'bg-primary/10 border-primary/40 shadow-sm'
                    : isLinked
                    ? 'bg-secondary ring-1 ring-primary/25 border-primary/25'
                    : 'bg-secondary border-border'
                }`}
              >
                <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${isLinked ? 'bg-primary/12 border-primary/30' : 'bg-primary/10 border-primary/20'}`}>
                  <ProductIcon name={p.icon_name} size={18} className="text-primary flex-shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                    {p.name}
                    {isLinked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                        <Sparkles size={9} /> Радимо
                      </span>
                    )}
                  </p>
                  {p.description && <p className="text-xs text-text-sub truncate">{p.description}</p>}
                  <p className="metric-value text-sm text-primary mt-0.5">{fmt(p.price)}</p>
                </div>
                {qty === 0 ? (
                  <button
                    type="button"
                    aria-label={`Додати ${p.name}`}
                    onClick={() => onAdd(p)}
                    className="size-11 rounded-full bg-[var(--btn-primary-bg)] text-[var(--accent-on)] flex items-center justify-center shrink-0 hover:opacity-90 active:scale-[0.88] transition-all cursor-pointer"
                  >
                    <Plus size={15} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Прибрати ${p.name}`}
                      onClick={() => onRemove(p.id)}
                      className="size-11 rounded-full bg-secondary text-text-sub flex items-center justify-center border border-border/40 hover:bg-secondary/80 active:scale-[0.88] transition-all cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold text-foreground w-4 text-center">{qty}</span>
                    <button
                      type="button"
                      aria-label={`Додати ще ${p.name}`}
                      onClick={() => onAdd(p)}
                      disabled={atMax}
                      className="size-11 rounded-full bg-[var(--btn-primary-bg)] text-[var(--accent-on)] flex items-center justify-center hover:opacity-90 active:scale-[0.88] transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {cart.length > 0 && (
          <div className="flex items-baseline justify-between px-1 mb-4 pt-3 border-t border-border">
            <span className="text-xs text-text-sub">
              {(() => { const n = cart.reduce((a, ci) => a + ci.quantity, 0); return `${n} ${pluralUk(n, 'товар', 'товари', 'товарів')}`; })()}
            </span>
            <span className="metric-value text-base text-primary">{fmt(totalProductsPrice)}</span>
          </div>
        )}
      </div>

      <div className="pt-6 pb-2 sticky bottom-0 bg-gradient-to-t from-secondary via-secondary/90 to-transparent z-10 flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          onClick={cart.length > 0 ? onBack : onContinue}
          data-testid="wizard-skip-products-btn"
          className="flex-1"
        >
          {cart.length > 0 ? 'Назад' : 'Пропустити'}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onContinue}
          data-testid="wizard-next-btn"
          className="flex-[2] shadow-lg"
        >
          {cart.length > 0 ? `Далі · ${fmt(totalProductsPrice)}` : 'Далі'}
        </Button>
      </div>
    </motion.div>
  );
}
