'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

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
  const shouldReduce = useReducedMotion();
  // Default-visible: words render at rest. The reveal only enhances when the section
  // enters view AND motion is allowed. Headless / hidden tab / reduced-motion / slow IO
  // all keep the heading fully visible — it can never ship blank. No overflow:hidden mask
  // (that clipped Cyrillic descenders у/д/ц/щ/ї against the tight display line-height).
  const animate = inView && !shouldReduce;

  const lines = text.split('\n');
  let wordIdx = 0;

  return (
    <Tag ref={ref as React.RefObject<HTMLHeadingElement>} className={className} style={style}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: 'block' }}>
          {line.split(' ').map((word, wi, arr) => {
            const delay = (delayBase + li * lineDelay + wordIdx++ * stagger) / 1000;
            return (
              <motion.span
                key={wi}
                style={{
                  display: 'inline-block',
                  marginRight: wi < arr.length - 1 ? '0.28em' : 0,
                }}
                initial={false}
                animate={animate ? { y: [16, 0], opacity: [0, 1] } : { y: 0, opacity: 1 }}
                transition={{ duration: 0.85, ease: easeOut, delay }}
              >
                {word}
              </motion.span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
