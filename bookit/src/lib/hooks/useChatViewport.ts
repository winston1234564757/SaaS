'use client';

import { useEffect, useState } from 'react';

/**
 * Telegram-grade keyboard handling for full-screen chat surfaces.
 *
 * iOS Safari does NOT shrink the layout viewport (nor `100dvh`/`h-dvh`) when
 * the on-screen keyboard opens — it just scrolls the page, which leaves a dead
 * gap between a bottom-anchored input bar and the keyboard. Instead we drive
 * the chat root height from `window.visualViewport.height`, so the container
 * collapses to exactly the area above the keyboard and the input bar stays
 * glued to its top (the way Telegram / WhatsApp web behave).
 *
 * While mounted, document scroll is locked and reset to 0 to kill the iOS
 * layout-viewport shift that would otherwise float the whole chat upward.
 *
 * Returns a px height once measured, or `null` before hydration — callers
 * fall back to `100dvh` via CSS so SSR / first paint is correct.
 */
export function useChatViewport(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;

    // Fallback for browsers without visualViewport: track innerHeight.
    if (!vv) {
      const update = () => setHeight(window.innerHeight);
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const update = () => {
      setHeight(vv.height);
      // Counter the iOS layout-viewport scroll shift; without this the input
      // ends up floating with a gap under it instead of hugging the keyboard.
      window.scrollTo(0, 0);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    // Lock the document so the page behind the chat can't scroll / rubber-band.
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevOverscroll = body.style.overscrollBehavior;
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      body.style.overflow = prevOverflow;
      body.style.overscrollBehavior = prevOverscroll;
    };
  }, []);

  return height;
}
