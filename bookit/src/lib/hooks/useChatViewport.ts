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

    const update = () => setHeight(vv.height);

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    // Lock the page with a FIXED body — not just `overflow: hidden`. On iOS,
    // `overflow: hidden` does NOT stop the browser from scrolling the layout
    // viewport when an input inside a `position: fixed` element gains focus.
    // That focus-scroll (then snapped back to 0) is exactly what paints the
    // caret in the wrong place until the next keystroke, and what leaves a gap
    // under the input. A fixed body has nothing to scroll, so the caret stays
    // aligned with the input and the frame hugs the keyboard.
    const { body } = document;
    const html = document.documentElement;
    const scrollY = window.scrollY;
    const prev = {
      htmlOverflow: html.style.overflow,
      overflow: body.style.overflow,
      overscroll: body.style.overscrollBehavior,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.overflow;
      body.style.overscrollBehavior = prev.overscroll;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return height;
}
