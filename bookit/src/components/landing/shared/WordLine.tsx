'use client';

import { motion } from 'framer-motion';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function WordLine({
  words,
  lineIndex,
  style,
  inView,
}: {
  words: string[];
  lineIndex: number;
  style?: React.CSSProperties;
  inView: boolean;
}) {
  return (
    <span style={{ display: 'block', ...style }}>
      {words.map((word, wi) => {
        const delay = (lineIndex * 200 + wi * 70) / 1000;
        return (
          <span
            key={wi}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'bottom',
              lineHeight: 'inherit',
              marginRight: wi < words.length - 1 ? '0.28em' : 0,
            }}
          >
            <motion.span
              style={{ display: 'inline-block' }}
              initial={{ y: '110%' }}
              animate={inView ? { y: 0 } : {}}
              transition={{ duration: 0.9, ease: easeOut, delay }}
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
