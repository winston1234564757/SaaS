'use client';

import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';

export function LandingScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });
  const shouldReduce = useReducedMotion();

  if (shouldReduce) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3.5,
        scaleX,
        transformOrigin: '0%',
        background: 'linear-gradient(to right, var(--l-indigo), var(--l-indigo-glow))',
        zIndex: 200,
        pointerEvents: 'none',
      }}
    />
  );
}
