'use client';

import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
  type CSSProperties, type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ScrollStrip — unified horizontal scroll container (G-PWA-02).
 *
 * Drop-in replacement for `<div className="flex gap-x overflow-x-auto scrollbar-hide …">`.
 * Enhances (never hijacks) native scroll with three affordances — on EVERY
 * viewport, mobile included — that appear only while the track overflows:
 *
 *   1. Edge fade-mask — content fades out on whichever side can still scroll.
 *   2. Arrow controls — advance by exactly ONE item (reveal + centre the next
 *      hidden item), not a fixed fraction of the viewport.
 *   3. Dot indicator — one pill-dot per item (counted from the track's direct
 *      children). The active dot follows the SELECTED item when the children
 *      expose aria-pressed / aria-selected / aria-current; otherwise it follows
 *      the item nearest the viewport centre. Selecting an item also smooth-
 *      scrolls it into view.
 *
 * Native swipe always works; arrows/dots are additive. Respects
 * prefers-reduced-motion. Guarded setState keeps the measure loop jank-free.
 *
 * IMPORTANT: pass the scroll items as DIRECT children (no inner flex wrapper) —
 * the dot count and selection read `track.children`.
 *
 * `className`/`style` apply to the scrollable track. A forwarded ref points at it.
 */
interface ScrollStripProps {
  children: ReactNode;
  /** Classes for the scrollable track (flex, gap, padding, -mx/px bleed, etc.). */
  className?: string;
  /** Classes for the outer relative wrapper (margins, width, flex-1). */
  wrapperClassName?: string;
  style?: CSSProperties;
  /** Arrow controls (default true). */
  arrows?: boolean;
  /** Per-item dot indicator (default true). */
  dots?: boolean;
  /** Enable CSS scroll-snap on the track. */
  snap?: boolean;
  /** Edge fade width in px (default 28). */
  fade?: number;
  role?: string;
  'aria-label'?: string;
}

const EDGE = 4; // px slack so sub-pixel scrollWidth never traps an affordance on

interface State { left: boolean; right: boolean; over: boolean; count: number; active: number; }
const INIT: State = { left: false, right: false, over: false, count: 0, active: 0 };

function selectedIndexOf(el: HTMLElement): number {
  const kids = el.children;
  for (let i = 0; i < kids.length; i++) {
    const k = kids[i];
    const pressed = k.getAttribute('aria-pressed');
    const selected = k.getAttribute('aria-selected');
    const current = k.getAttribute('aria-current');
    if (pressed === 'true' || selected === 'true' || (current && current !== 'false')) return i;
  }
  return -1;
}

export const ScrollStrip = forwardRef<HTMLDivElement, ScrollStripProps>(function ScrollStrip(
  {
    children, className, wrapperClassName, style,
    arrows = true, dots = true, snap = false, fade = 28, role, 'aria-label': ariaLabel,
  },
  forwardedRef,
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const prevSelRef = useRef(-1);
  const mountedRef = useRef(false);
  useImperativeHandle(forwardedRef, () => trackRef.current as HTMLDivElement, []);

  const [st, setSt] = useState<State>(INIT);

  const behavior = (): ScrollBehavior =>
    (typeof window !== 'undefined' &&
     window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'auto' : 'smooth';

  const scrollToItem = useCallback((i: number) => {
    const el = trackRef.current;
    const k = el?.children[i] as HTMLElement | undefined;
    if (!el || !k) return;
    const max = el.scrollWidth - el.clientWidth;
    const target = k.offsetLeft - (el.clientWidth - k.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, Math.min(target, max)), behavior: behavior() });
  }, []);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const over = max > EDGE;
    const left = el.scrollLeft > EDGE;
    const right = el.scrollLeft < max - EDGE;
    const count = el.children.length;

    // Item nearest the viewport centre (scroll-position fallback).
    let centerIdx = 0;
    if (over && count) {
      const vc = el.scrollLeft + el.clientWidth / 2;
      let best = Infinity;
      for (let i = 0; i < count; i++) {
        const k = el.children[i] as HTMLElement;
        const c = k.offsetLeft + k.offsetWidth / 2;
        const d = Math.abs(c - vc);
        if (d < best) { best = d; centerIdx = i; }
      }
    }

    const selIdx = selectedIndexOf(el);
    const active = selIdx >= 0 ? selIdx : centerIdx;

    setSt(prev =>
      (prev.left === left && prev.right === right && prev.over === over &&
       prev.count === count && prev.active === active)
        ? prev
        : { left, right, over, count, active });

    // On a NEW selection (not the initial render), bring it into view.
    if (mountedRef.current && selIdx >= 0 && selIdx !== prevSelRef.current) {
      scrollToItem(selIdx);
    }
    prevSelRef.current = selIdx;
    mountedRef.current = true;
  }, [scrollToItem]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', measure); ro.disconnect(); };
  }, [measure]);

  // Re-measure after content/selection changes (item count or aria state shift,
  // which a ResizeObserver on the track alone does not catch). Guarded setState
  // above keeps this loop-free.
  useEffect(() => { measure(); });

  // Arrow = advance one item: reveal + centre the next item hidden on that side.
  const step = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft: sl, clientWidth: cw, children: kids } = el;
    let target = -1;
    if (dir === 1) {
      for (let i = 0; i < kids.length; i++) {
        const k = kids[i] as HTMLElement;
        if (k.offsetLeft + k.offsetWidth > sl + cw + 1) { target = i; break; }
      }
      if (target === -1) target = kids.length - 1;
    } else {
      for (let i = kids.length - 1; i >= 0; i--) {
        const k = kids[i] as HTMLElement;
        if (k.offsetLeft < sl - 1) { target = i; break; }
      }
      if (target === -1) target = 0;
    }
    scrollToItem(target);
  };

  const stops: string[] = [st.left ? 'transparent 0' : 'black 0'];
  if (st.left) stops.push(`black ${fade}px`);
  if (st.right) stops.push(`black calc(100% - ${fade}px)`);
  stops.push(st.right ? 'transparent 100%' : 'black 100%');
  const mask = (st.left || st.right)
    ? `linear-gradient(to right, ${stops.join(', ')})`
    : undefined;

  const arrowStyle: CSSProperties = {
    background: 'var(--surface, #ffffff)',
    color: 'var(--text-secondary, #64748b)',
  };
  const arrowCls =
    'flex absolute top-1/2 -translate-y-1/2 z-10 size-7 items-center justify-center rounded-full shadow-md ring-1 ring-black/5 active:scale-90 transition-transform';

  return (
    <div className={`relative ${wrapperClassName ?? ''}`}>
      <div
        ref={trackRef}
        role={role}
        aria-label={ariaLabel}
        className={`overflow-x-auto scrollbar-hide ${snap ? 'snap-x snap-mandatory' : ''} ${className ?? ''}`}
        style={{ ...style, WebkitMaskImage: mask, maskImage: mask, WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>

      {arrows && st.left && (
        <button
          type="button" aria-label="Попередній" onClick={() => step(-1)}
          style={arrowStyle} className={`${arrowCls} left-0`}
        >
          <ChevronLeft size={16} strokeWidth={2.2} />
        </button>
      )}
      {arrows && st.right && (
        <button
          type="button" aria-label="Наступний" onClick={() => step(1)}
          style={arrowStyle} className={`${arrowCls} right-0`}
        >
          <ChevronRight size={16} strokeWidth={2.2} />
        </button>
      )}

      {dots && st.over && st.count > 1 && (
        <div className="flex items-center justify-center gap-1 mt-2" aria-hidden="true">
          {Array.from({ length: st.count }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-200"
              style={{
                width: i === st.active ? '1rem' : '0.375rem',
                background: i === st.active
                  ? 'var(--accent, #6366f1)'
                  : 'var(--border-strong, rgba(100,116,139,0.28))',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});
