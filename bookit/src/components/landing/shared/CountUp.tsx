'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from 'framer-motion';

export const LANDING_SPRING = { type: 'spring' as const, stiffness: 240, damping: 26 };

export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: '-60px' });
  const shouldReduce = useReducedMotion();
  const mv = useMotionValue(0);
  const sv = useSpring(mv, { stiffness: 70, damping: 15 });
  const startedRef = useRef(false);
  // Default-visible: the final value renders immediately (SSR, headless, reduced-motion,
  // and slow/absent IntersectionObserver all show the real number, never 0 or blank).
  const [text, setText] = useState(`${to}${suffix}`);

  useMotionValueEvent(sv, 'change', (v) => {
    if (!startedRef.current) return;
    setText(`${Math.round(v)}${suffix}`);
  });

  useEffect(() => {
    if (shouldReduce || !inView || startedRef.current) return;
    // The 0 -> to roll-up is a pure enhancement over the already-visible value.
    startedRef.current = true;
    mv.set(to);
  }, [inView, mv, to, shouldReduce]);

  return <span ref={nodeRef}>{text}</span>;
}
