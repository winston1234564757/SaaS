'use client';

import { RefObject, useEffect, useState } from 'react';

function getLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Reads the computed background color of the nearest opaque ancestor
 * and returns the appropriate text color scheme.
 *
 * Returns 'dark'  → use dark text  (light background)
 * Returns 'light' → use light text (dark background)
 *
 * Default: 'dark' (safe for Frost theme's #EFF2FF background).
 */
export function useAdaptiveColor(ref: RefObject<HTMLElement | null>): 'light' | 'dark' {
  const [scheme, setScheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let node: HTMLElement | null = el.parentElement;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (m) {
        const alpha = m[4] !== undefined ? parseFloat(m[4]) : 1;
        if (alpha >= 0.1) {
          const L = getLuminance(+m[1], +m[2], +m[3]);
          setScheme(L > 0.179 ? 'dark' : 'light');
          return;
        }
      }
      node = node.parentElement;
    }
  }, [ref]);

  return scheme;
}
