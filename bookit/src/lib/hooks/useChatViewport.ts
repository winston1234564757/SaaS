'use client';

import { useEffect, useState } from 'react';

export interface ChatViewport {
  /** px height above the keyboard, or `null` before hydration. */
  height: number | null;
  /** iOS visual-viewport pan offset to compensate via translateY. */
  offsetTop: number;
}

/**
 * Telegram-grade keyboard handling for full-screen chat surfaces.
 *
 * iOS Safari does NOT shrink the layout viewport (nor `100dvh`/`h-dvh`) when
 * the on-screen keyboard opens — it pans the visual viewport instead, which
 * leaves a dead gap and, worse, detaches the text caret: a `position: fixed`
 * frame stays glued to `top: 0` while iOS renders the caret at the panned
 * coordinate, so it floats above the input. We drive the frame height from
 * `window.visualViewport.height` AND compensate the pan with
 * `translateY(offsetTop)` (returned here) so the caret stays inside the input.
 *
 * This is the same recipe proven live on iPhone by the auth shell
 * (`AuthViewportShell`). `window.scrollTo(0, 0)` is NOT enough — iOS doesn't
 * honour it cleanly; only `offsetTop` compensation keeps the caret attached.
 * (The auth shell's `scrollIntoView` is intentionally omitted: the chat input
 * is pinned to the bottom of a `vv.height` frame, so it can never fall behind
 * the keyboard — the extra scroll would only add jitter.)
 *
 * While mounted, document scroll is locked so the page behind can't
 * rubber-band. Returns `height: null` before hydration — callers fall back to
 * `100dvh` via CSS so SSR / first paint is correct.
 */
export function useChatViewport(enabled: boolean = true): ChatViewport {
  const [vp, setVp] = useState<ChatViewport>({ height: null, offsetTop: 0 });

  useEffect(() => {
    // Contained surfaces (desktop 2-pane) opt out: they fill a bounded pane and
    // must NOT lock document scroll or drive height from the visual viewport.
    if (!enabled) return;

    const vv = window.visualViewport;

    // Fallback for browsers without visualViewport: track innerHeight, no pan.
    if (!vv) {
      const update = () => setVp({ height: window.innerHeight, offsetTop: 0 });
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const sync = () => setVp({ height: vv.height, offsetTop: vv.offsetTop });

    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);

    // Lock the document so the page behind the chat can't scroll / rubber-band.
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevOverscroll = body.style.overscrollBehavior;
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      body.style.overflow = prevOverflow;
      body.style.overscrollBehavior = prevOverscroll;
    };
  }, [enabled]);

  return vp;
}
