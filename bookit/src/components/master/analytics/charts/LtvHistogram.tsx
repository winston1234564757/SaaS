'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { motion } from 'framer-motion';

interface LtvHistogramProps {
  distribution: Record<string, number>;
}

const BUCKET_LABELS: Record<string, string> = {
  under_1k: 'До 1 000 ₴',
  '1k_3k': '1 000 ₴ – 3 000 ₴',
  '3k_7k': '3 000 ₴ – 7 000 ₴',
  above_7k: 'Більше 7 000 ₴',
};

const BUCKET_ORDER = ['under_1k', '1k_3k', '3k_7k', 'above_7k'];

export function LtvHistogram({ distribution }: LtvHistogramProps) {
  const points = useMemo(() => {
    const total = BUCKET_ORDER.reduce((sum, key) => sum + (distribution[key] ?? 0), 0);
    const maxVal = Math.max(...BUCKET_ORDER.map((key) => distribution[key] ?? 0), 1);

    return BUCKET_ORDER.map((key) => {
      const count = distribution[key] ?? 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const fillPct = Math.round((count / maxVal) * 100);

      return {
        key,
        label: BUCKET_LABELS[key] ?? key,
        count,
        pct,
        fillPct,
      };
    });
  }, [distribution]);

  return (
    <div className="w-full flex flex-col gap-3.5 py-1">
      {points.map((pt, idx) => (
        <div key={pt.key} className="flex flex-col gap-1">
          {/* Текст та показники */}
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-foreground">{pt.label}</span>
            <span className="font-semibold text-muted-foreground">
              {pt.count} клієнт. <span className="text-[10px] text-muted-foreground/50">({pt.pct}%)</span>
            </span>
          </div>

          {/* Смуга прогресу */}
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pt.fillPct}%` }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 20,
                delay: idx * 0.05,
              }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
