'use client';

import { useEffect, useRef } from 'react';

interface GlassSafeAreaProps {
  /** Scroll source. Defaults to window. Pass a ref to an overflow container if the shell scrolls internally. */
  scrollTarget?: React.RefObject<HTMLElement | null>;
  /** Max blur in px at full ramp. */
  maxBlur?: number;
  /** Max tint opacity at full ramp. Kept low so blur carries the glass. */
  maxOpacity?: number;
  /** Scroll distance (px) over which the effect ramps 0 -> max. */
  rampDistance?: number;
  /** Stacking order. Above content, below nav chrome (z-50) and modals. */
  zIndex?: number;
}

/**
 * GlassSafeArea — iOS "scroll edge" effect for the top safe-area strip.
 *
 * A fixed band sized to `env(safe-area-inset-top)`. As the page scrolls,
 * its frosted glass (backdrop-filter blur + translucent Frost fill) ramps in,
 * so content no longer shows raw behind the notch / Dynamic Island.
 *
 * Compositor-only (backdrop-filter + opacity). Styles are written directly to
 * the node ref behind an rAF gate — no React re-render per scroll frame.
 * On devices with no inset (desktop, no-notch), the band has zero height and
 * renders nothing.
 */
export function GlassSafeArea({
  scrollTarget,
  maxBlur = 14,
  maxOpacity = 0.3,
  rampDistance = 52,
  zIndex = 40,
}: GlassSafeAreaProps) {
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;

    const target: HTMLElement | Window = scrollTarget?.current ?? window;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let frame = 0;
    let lastP = -1;

    const getScrollY = () =>
      target === window ? window.scrollY : (target as HTMLElement).scrollTop;

    const apply = () => {
      frame = 0;
      const y = getScrollY();
      // Reduced motion: skip the ramp, snap the band on/off.
      let p = prefersReduced
        ? y > 4 ? 1 : 0
        : Math.min(Math.max(y / rampDistance, 0), 1);
      // ease-out (quad) for a softer settle.
      if (!prefersReduced) p = p * (2 - p);

      if (Math.abs(p - lastP) < 0.005) return;
      lastP = p;

      if (p < 0.01) {
        // Fully transparent at the top: drop the compositing layer entirely.
        band.style.setProperty('backdrop-filter', 'none');
        band.style.setProperty('-webkit-backdrop-filter', 'none');
        band.style.setProperty('background', 'transparent');
      } else {
        // Liquid glass: blur + saturation carry the effect. The tint is a thin
        // vertical gradient — denser at the notch edge, fading into the content
        // below — so it reads as translucent material, not a flat colour wash.
        const filter = `blur(${(maxBlur * p).toFixed(2)}px) saturate(200%)`;
        band.style.setProperty('backdrop-filter', filter);
        band.style.setProperty('-webkit-backdrop-filter', filter);
        const top = (maxOpacity * p).toFixed(3);
        const bottom = (maxOpacity * p * 0.4).toFixed(3);
        band.style.setProperty(
          'background',
          `linear-gradient(to bottom, rgba(239, 242, 255, ${top}), rgba(239, 242, 255, ${bottom}))`,
        );
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    };

    apply(); // initialise for restored scroll positions
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scrollTarget, maxBlur, maxOpacity, rampDistance]);

  return (
    <div
      ref={bandRef}
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 pointer-events-none"
      style={{
        height: 'calc(env(safe-area-inset-top, 0px) * 0.8)',
        zIndex,
        willChange: 'backdrop-filter',
      }}
    />
  );
}
