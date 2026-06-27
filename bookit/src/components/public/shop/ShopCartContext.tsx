'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { Product } from '@/types/database';

export interface CartItem { product: Product; qty: number }

interface ShopCartValue {
  items: CartItem[];
  count: number;
  total: number;
  addToCart: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  getQty: (productId: string) => number;
  clear: () => void;
  hydrated: boolean;
}

const ShopCartContext = createContext<ShopCartValue | null>(null);

/**
 * Cart state shared across the shop catalog and product pages.
 * Persisted to localStorage per master slug so it survives both client-side
 * navigation (catalog <-> product page) and a full reload.
 */
export function ShopCartProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const storageKey = `bookit_cart_${slug}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted cart only after mount — avoids hydration mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch { /* corrupt / private mode — start empty */ }
    setHydrated(true);
  }, [storageKey]);

  // Sync to localStorage on every change (only after the initial read).
  // Also track the last active master slug so the global (zone-less) cart
  // button can surface this cart from anywhere (e.g. the /my client area).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
      if (items.length > 0) localStorage.setItem('bookit_cart_last', slug);
      else if (localStorage.getItem('bookit_cart_last') === slug) localStorage.removeItem('bookit_cart_last');
    } catch { /* quota / private mode */ }
  }, [items, hydrated, storageKey, slug]);

  const addToCart = useCallback((product: Product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product, qty }];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems(prev => qty <= 0
      ? prev.filter(i => i.product.id !== productId)
      : prev.map(i => i.product.id === productId ? { ...i, qty } : i));
  }, []);

  const getQty = useCallback((productId: string) => {
    return items.find(i => i.product.id === productId)?.qty ?? 0;
  }, [items]);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<ShopCartValue>(() => ({
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    total: items.reduce((s, i) => s + i.product.price_kopecks * i.qty, 0),
    addToCart, setQty, getQty, clear, hydrated,
  }), [items, addToCart, setQty, getQty, clear, hydrated]);

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>;
}

export function useShopCart() {
  const ctx = useContext(ShopCartContext);
  if (!ctx) throw new Error('useShopCart must be used within ShopCartProvider');
  return ctx;
}
