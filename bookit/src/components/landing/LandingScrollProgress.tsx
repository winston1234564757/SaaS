'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export function LandingScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        scaleX,
        transformOrigin: '0%',
        background: 'linear-gradient(to right, #4338CA, #7C3AED)',
        zIndex: 200,
        pointerEvents: 'none',
      }}
    />
  );
}
