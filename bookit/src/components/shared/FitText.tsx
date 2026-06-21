'use client';

import { useEffect, useRef, useState } from 'react';

interface FitTextProps {
  text: string;
  /** Number of lines to fill. Budget = containerWidth × maxLines. */
  maxLines?: 1 | 2;
  minSize?: number;
  maxSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Scales text to fill its container width using ResizeObserver + canvas.measureText().
 * Binary-searches for the largest font size where text fits within budget.
 *
 * Usage: <FitText text="Доброго ранку, Анна" minSize={16} maxSize={28} className="font-semibold" />
 */
export function FitText({ text, maxLines = 1, minSize = 12, maxSize = 64, className, style }: FitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxSize);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const measure = () => {
      const width = el.offsetWidth;
      if (!width) return;
      const { fontFamily, fontWeight, fontStyle } = getComputedStyle(el);
      const budget = width * maxLines;

      let lo = minSize;
      let hi = maxSize;
      while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        ctx.font = `${fontStyle} ${fontWeight} ${mid}px ${fontFamily}`;
        if (ctx.measureText(text).width <= budget) lo = mid;
        else hi = mid;
      }
      setFontSize(Math.floor(lo));
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [text, minSize, maxSize, maxLines]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        fontSize,
        lineHeight: maxLines === 2 ? 1.15 : 1,
        overflow: 'hidden',
        ...(maxLines === 2 && {
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
        }),
        ...style,
      }}
    >
      {text}
    </div>
  );
}
