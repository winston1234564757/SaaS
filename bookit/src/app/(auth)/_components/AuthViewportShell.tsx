'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Keyboard-aware shell for the auth screen.
 *
 * iOS Safari does NOT shrink dvh/vh when the on-screen keyboard opens —
 * interactive-widget defaults to `resizes-visual` and iOS can't override it,
 * so a pure-CSS 100dvh container stays full-height behind the keyboard while
 * iOS pans the visual viewport, leaving a dead zone below the form.
 *
 * Fix: pin the shell with position:fixed (escapes the root min-h-screen
 * parent so the document body is no longer pannable) and drive its height
 * from window.visualViewport — the only API that reflects the keyboard.
 * translateY(offsetTop) compensates any residual iOS body-pan so the shell
 * stays glued to the visible region.
 *
 * Falls back to plain h-[100dvh] when visualViewport is unavailable.
 */
export function AuthViewportShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const vv = window.visualViewport;
    if (!el || !vv) return;

    // Glue the shell to the visible region above the keyboard.
    const sync = () => {
      el.style.height = `${vv.height}px`;
      el.style.transform = `translateY(${vv.offsetTop}px)`;
      // Keyboard open ⇒ tag the shell so the brand strip can grow taller.
      // innerHeight stays at layout-viewport height on iOS; vv.height shrinks.
      el.classList.toggle('kb-open', window.innerHeight - vv.height > 120);
    };

    // On keyboard open/close the height change resets iOS auto-scroll, so the
    // focused field can end up behind the keyboard. Re-reveal it after relayout.
    const onResize = () => {
      sync();
      requestAnimationFrame(() => {
        const active = document.activeElement as HTMLElement | null;
        if (active && el.contains(active) && /^(INPUT|TEXTAREA)$/.test(active.tagName)) {
          active.scrollIntoView({ block: 'center', behavior: 'auto' });
        }
      });
    };

    sync();
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', sync);
    };
  }, []);

  return (
    // data-theme="frost" — все всередині резолвить Frost CSS vars
    <div
      ref={ref}
      data-theme="frost"
      className="fixed inset-x-0 top-0 h-[100dvh] flex overflow-hidden"
    >
      {children}
    </div>
  );
}
