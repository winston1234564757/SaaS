'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface Props {
  text: string; // '\n' separates lines
  className?: string;
  style?: React.CSSProperties;
  delayBase?: number; // ms — base delay before first word
  stagger?: number;   // ms per word
  lineDelay?: number; // ms added per line
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function LandingSplitHeading({
  text,
  className = '',
  style,
  delayBase = 0,
  stagger = 70,
  lineDelay = 200,
  as: Tag = 'h2',
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const lines = text.split('\n');
  let wordIdx = 0;

  return (
    <Tag ref={ref as React.RefObject<HTMLHeadingElement>} className={className} style={style}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: 'block' }}>
          {line.split(' ').map((word, wi, arr) => {
            const delay = (delayBase + li * lineDelay + wordIdx++ * stagger) / 1000;
            return (
              <span
                key={wi}
                style={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  verticalAlign: 'bottom',
                  lineHeight: 'inherit',
                  marginRight: wi < arr.length - 1 ? '0.28em' : 0,
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
      ))}
    </Tag>
  );
}
