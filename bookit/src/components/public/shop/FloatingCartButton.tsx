'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useShopCart } from './ShopCartContext';

/**
 * Zone-wide cart access point. Shows across the master public zone (profile,
 * portfolio, …) when the cart has items, linking to the shop where the full
 * checkout lives. Hidden on shop routes — those render their own ShopCartBar.
 */
export function FloatingCartButton({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { count, total } = useShopCart();

  const onShop = pathname === `/${slug}/shop` || pathname.startsWith(`/${slug}/shop/`);
  const visible = count > 0 && !onShop;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
        >
          <Link
            href={`/${slug}/shop`}
            className="pointer-events-auto w-full max-w-lg mx-auto flex items-center justify-between px-5 py-4 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.95] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBag size={20} />
                <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-[9px] font-bold flex items-center justify-center tabular-nums">
                  {count}
                </span>
              </div>
              <span className="text-sm font-semibold">Кошик</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tabular-nums">{(total / 100).toFixed(0)} ₴</span>
              <ChevronRight size={16} className="opacity-60" />
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
