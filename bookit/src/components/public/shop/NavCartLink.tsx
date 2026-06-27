'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { useActiveCart } from './useActiveCart';

/**
 * Desktop navbar cart entry (PublicNavbar). Always-available cart affordance —
 * appears whenever a cart has items, on any client-facing page. Hidden on shop
 * routes, which render their own ShopCartBar.
 */
export function NavCartLink() {
  const pathname = usePathname();
  const cart = useActiveCart();

  if (!cart || /\/shop(\/|$)/.test(pathname)) return null;

  return (
    <Link
      href={`/${cart.slug}/shop`}
      aria-label={`Кошик: ${cart.count} товарів на ${(cart.total / 100).toFixed(0)} гривень`}
      className="flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 active:scale-[0.95] transition-all shadow-sm cursor-pointer"
    >
      <span className="relative flex items-center justify-center">
        <ShoppingBag size={15} strokeWidth={2.2} />
        <span className="absolute -top-2 -right-2 min-w-[15px] h-[15px] rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center px-0.5 leading-none tabular-nums">
          {cart.count > 9 ? '9+' : cart.count}
        </span>
      </span>
      <span className="tabular-nums">{(cart.total / 100).toFixed(0)} ₴</span>
    </Link>
  );
}
