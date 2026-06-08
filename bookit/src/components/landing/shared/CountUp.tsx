'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useMotionValueEvent, useSpring } from 'framer-motion';

export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: '-60px' });
  const mv = useMotionValue(0);
  const sv = useSpring(mv, { stiffness: 70, damping: 15 });
  const [text, setText] = useState(`0${suffix}`);

  useMotionValueEvent(sv, 'change', (v) => {
    setText(`${Math.round(v)}${suffix}`);
  });

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);

  return (
    <motion.span
      ref={nodeRef}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {text}
    </motion.span>
  );
}
