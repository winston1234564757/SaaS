'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from 'framer-motion';

export const LANDING_SPRING = { type: 'spring' as const, stiffness: 240, damping: 26 };

export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: '-60px' });
  const shouldReduce = useReducedMotion();
  const mv = useMotionValue(0);
  const sv = useSpring(mv, { stiffness: 70, damping: 15 });
  const [text, setText] = useState(`0${suffix}`);

  useMotionValueEvent(sv, 'change', (v) => {
    setText(`${Math.round(v)}${suffix}`);
  });

  useEffect(() => {
    if (!inView) return;
    if (shouldReduce) {
      setText(`${to}${suffix}`);
    } else {
      mv.set(to);
    }
  }, [inView, mv, to, suffix, shouldReduce]);

  return (
    <motion.span
      ref={nodeRef}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={shouldReduce ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }}
    >
      {text}
    </motion.span>
  );
}
