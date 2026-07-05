'use client';

import { motion } from 'framer-motion';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function WordLine({
  words,
  lineIndex,
  style,
  inView,
  reducedMotion = false,
}: {
  words: string[];
  lineIndex: number;
  style?: React.CSSProperties;
  inView: boolean;
  reducedMotion?: boolean;
}) {
  // Default-visible: words render at rest; the rise-in only enhances when in view and
  // motion is allowed. No overflow:hidden mask (it clipped Cyrillic descenders).
  const animate = inView && !reducedMotion;
  return (
    <span style={{ display: 'block', ...style }}>
      {words.map((word, wi) => {
        const delay = reducedMotion ? 0 : (lineIndex * 200 + wi * 70) / 1000;
        return (
          <motion.span
            key={wi}
            style={{ display: 'inline-block', marginRight: wi < words.length - 1 ? '0.28em' : 0 }}
            initial={false}
            animate={animate ? { y: [16, 0], opacity: [0, 1] } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease: easeOut, delay }}
          >
            {word}
          </motion.span>
        );
      })}
    </span>
  );
}
