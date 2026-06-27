'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight } from 'lucide-react';

interface ActiveCart { slug: string; count: number; total: number }

/**
 * Reads per-master carts (`bookit_cart_${slug}`) from localStorage and surfaces
 * the last active one. Decoupled from ShopCartProvider so it works in zones
 * without the provider (e.g. the client `/my` area). Static read on mount +
 * refresh on storage/visibility changes — these pages don't mutate the cart.
 */
function readActiveCart(preferSlug?: string): ActiveCart | null {
  if (typeof window === 'undefined') return null;
  const carts: Record<string, { count: number; total: number }> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('bookit_cart_') || key === 'bookit_cart_last') continue;
    const slug = key.slice('bookit_cart_'.length);
    try {
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(items) || items.length === 0) continue;
      const count = items.reduce((s: number, it) => s + (it?.qty || 0), 0);
      const total = items.reduce((s: number, it) => s + ((it?.product?.price_kopecks || 0) * (it?.qty || 0)), 0);
      if (count > 0) carts[slug] = { count, total };
    } catch { /* skip corrupt entry */ }
  }

  const slugs = Object.keys(carts);
  if (slugs.length === 0) return null;

  // Prefer the cart of the master whose page we're on; else the last active one.
  const last = localStorage.getItem('bookit_cart_last');
  const slug = (preferSlug && carts[preferSlug]) ? preferSlug
    : (last && carts[last]) ? last
    : slugs[0];
  return { slug, ...carts[slug] };
}

export function GlobalCartButton({ preferSlug }: { preferSlug?: string }) {
  const pathname = usePathname();
  const [cart, setCart] = useState<ActiveCart | null>(null);

  const refresh = useCallback(() => setCart(readActiveCart(preferSlug)), [preferSlug]);

  // Re-read on every client navigation — localStorage.setItem doesn't fire a
  // 'storage' event in the same tab, so the cross-page cart could go stale.
  useEffect(() => { refresh(); }, [pathname, refresh]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('storage', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  // Shop routes render their own ShopCartBar — avoid a duplicate button there.
  const onShopRoute = /\/shop(\/|$)/.test(pathname);

  return (
    <AnimatePresence>
      {cart && !onShopRoute && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
        >
          <Link
            href={`/${cart.slug}/shop`}
            className="pointer-events-auto w-full max-w-lg mx-auto flex items-center justify-between px-5 py-4 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.95] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBag size={20} />
                <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-[9px] font-bold flex items-center justify-center tabular-nums">
                  {cart.count}
                </span>
              </div>
              <span className="text-sm font-semibold">Кошик у магазині</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tabular-nums">{(cart.total / 100).toFixed(0)} ₴</span>
              <ChevronRight size={16} className="opacity-60" />
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
