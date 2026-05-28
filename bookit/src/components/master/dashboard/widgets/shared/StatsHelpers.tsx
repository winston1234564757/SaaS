'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k ₴';
  return n.toLocaleString('uk-UA') + ' ₴';
}

export function AnimatedNumber({
  value,
  format: formatter,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const motionVal = useMotionValue(0);
  const display   = useTransform(motionVal, (v) => formatter(Math.round(v)));

  useEffect(() => {
    const controls = animate(motionVal, value, {
      type: 'spring' as const,
      duration: 1.8,
      bounce: 0,
    });
    return controls.stop;
  }, [value, motionVal]);

  return <motion.span>{display}</motion.span>;
}

export function TrendChip({
  value,
  positive,
}: {
  value: string;
  positive: boolean | null;
}) {
  if (positive === null || value === '—') {
    return (
      <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[var(--border)] text-[var(--text-tertiary)]">
        <Minus size={9} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-[3px] rounded-full text-[10px] font-bold tracking-[0.04em] ${
        positive
          ? 'bg-[var(--success)]/15 text-[var(--success)]'
          : 'bg-[var(--error)]/15 text-[var(--error)]'
      }`}
    >
      {positive ? (
        <ArrowUp size={8} strokeWidth={2.5} />
      ) : (
        <ArrowDown size={8} strokeWidth={2.5} />
      )}
      {value}
    </span>
  );
}
