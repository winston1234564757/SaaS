'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export interface ActiveCart { slug: string; count: number; total: number }

/** Read per-master carts (`bookit_cart_${slug}`) from localStorage; surface the
 *  preferred (current master's) cart, else the last active one. */
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

  const last = localStorage.getItem('bookit_cart_last');
  const slug = (preferSlug && carts[preferSlug]) ? preferSlug
    : (last && carts[last]) ? last
    : slugs[0];
  return { slug, ...carts[slug] };
}

/**
 * Reactive active-cart reader for nav surfaces. Works without ShopCartProvider
 * (reads localStorage directly), and refreshes on: client navigation, the
 * in-tab `bookit-cart` event (dispatched by ShopCartContext on mutation),
 * cross-tab `storage`, and tab focus.
 */
export function useActiveCart(preferSlug?: string): ActiveCart | null {
  const pathname = usePathname();
  const [cart, setCart] = useState<ActiveCart | null>(null);

  const refresh = useCallback(() => setCart(readActiveCart(preferSlug)), [preferSlug]);

  useEffect(() => { refresh(); }, [pathname, refresh]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('storage', refresh);
    window.addEventListener('bookit-cart', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('bookit-cart', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  return cart;
}
