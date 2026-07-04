'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Minus, Plus, Check } from 'lucide-react';
import type { Product } from '@/types/database';
import { ProductDetailView } from '@/components/public/shop/ProductDetailView';
import { ShopCartBar } from '@/components/public/shop/ShopCartBar';
import { useShopCart } from '@/components/public/shop/ShopCartContext';

interface Props {
  product:         Product;
  masterId:        string;
  masterSlug:      string;
  masterName:      string;
  shipsNovaPoshta: boolean;
  isAuth:          boolean;
  schedule?:       { day_of_week: string; is_working: boolean; start_time: string; end_time: string }[];
}

export function ProductPage({ product: p, masterId, masterSlug, masterName, shipsNovaPoshta, isAuth, schedule }: Props) {
  const { addToCart, setQty, getQty } = useShopCart();
  const [localQty, setLocalQty] = useState(1);
  const qty    = getQty(p.id);
  const inCart = qty > 0;

  const cartActions = p.stock_qty > 0 ? (
    <div className="flex flex-col gap-3">
      {!inCart ? (
        <>
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold text-text-sub">Кількість</p>
            <div className="flex items-center rounded-md overflow-hidden border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <button
                type="button"
                aria-label="Зменшити кількість"
                onClick={() => setLocalQty(q => Math.max(1, q - 1))}
                className="size-10 flex items-center justify-center text-text-sub active:bg-secondary/80 transition-all cursor-pointer active:scale-[0.95]"
              >
                <Minus size={15} />
              </button>
              <span className="w-8 text-center font-bold text-foreground tabular-nums">{localQty}</span>
              <button
                type="button"
                aria-label="Збільшити кількість"
                onClick={() => setLocalQty(q => Math.min(p.stock_qty, q + 1))}
                disabled={localQty >= p.stock_qty}
                className="size-10 flex items-center justify-center text-foreground active:bg-secondary/80 transition-all cursor-pointer active:scale-[0.95] disabled:opacity-30"
              >
                <Plus size={15} />
              </button>
            </div>
            <p className="text-xs text-text-sub ml-auto tabular-nums">{((p.price_kopecks * localQty) / 100).toFixed(0)} ₴</p>
          </div>
          <motion.button
            type="button"
            onClick={() => { addToCart(p, localQty); setLocalQty(1); }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer active:scale-[0.95]"
          >
            <ShoppingBag size={18} /> В кошик · {((p.price_kopecks * localQty) / 100).toFixed(0)} ₴
          </motion.button>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold text-success flex items-center gap-1.5">
            <Check size={14} /> У кошику: {qty} шт
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md overflow-hidden border flex-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <button
                type="button"
                aria-label="Зменшити кількість"
                onClick={() => setQty(p.id, qty - 1)}
                className="size-10 flex items-center justify-center text-text-sub active:bg-secondary/80 transition-all cursor-pointer active:scale-[0.95]"
              >
                <Minus size={15} />
              </button>
              <span className="flex-1 text-center font-bold text-foreground tabular-nums">{qty}</span>
              <button
                type="button"
                aria-label="Збільшити кількість"
                onClick={() => qty < p.stock_qty ? setQty(p.id, qty + 1) : undefined}
                disabled={qty >= p.stock_qty}
                className="size-10 flex items-center justify-center text-foreground active:bg-secondary/80 transition-all cursor-pointer active:scale-[0.95] disabled:opacity-30"
              >
                <Plus size={15} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setQty(p.id, 0)}
              className="px-4 py-3 rounded-lg border border-foreground/20 text-foreground text-sm font-semibold active:scale-[0.95] cursor-pointer transition-all"
            >
              Видалити
            </button>
          </div>
        </>
      )}
    </div>
  ) : null;

  return (
    <div className="max-w-lg mx-auto pb-32 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Link
          href={`/${masterSlug}/shop`}
          aria-label="Назад до магазину"
          className="size-9 rounded-lg bg-secondary/70 border border-border flex items-center justify-center text-text-sub hover:bg-secondary active:scale-[0.95] transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-sub truncate">Магазин · {masterName}</p>
        </div>
      </div>

      <ProductDetailView product={p} mode="client" actions={cartActions} />

      <ShopCartBar
        masterId={masterId}
        masterSlug={masterSlug}
        masterName={masterName}
        shipsNovaPoshta={shipsNovaPoshta}
        isAuth={isAuth}
        schedule={schedule}
      />
    </div>
  );
}
