'use client';

import React, { useMemo } from 'react';
import { formatPrice } from '@/components/master/services/types';
import { motion } from 'framer-motion';

interface ForecastBarChartProps {
  currentRevenue: number; // в копійках
  forecastRevenue: number; // в копійках
  targetRevenue?: number | null; // в копійках
}

export function ForecastBarChart({
  currentRevenue,
  forecastRevenue,
  targetRevenue,
}: ForecastBarChartProps) {
  const bars = useMemo(() => {
    const items = [
      { label: 'Цей місяць', value: currentRevenue, color: 'rgba(120, 154, 170, 0.8)' },
      { label: 'Прогноз', value: forecastRevenue, color: 'var(--accent)' },
    ];

    if (targetRevenue !== undefined && targetRevenue !== null && targetRevenue > 0) {
      items.push({ label: 'Ціль', value: targetRevenue, color: 'rgba(78, 152, 112, 0.8)' });
    }

    const maxVal = Math.max(...items.map((x) => x.value), 1000);
    
    return items.map((item) => ({
      ...item,
      fillPct: Math.round((item.value / maxVal) * 100),
    }));
  }, [currentRevenue, forecastRevenue, targetRevenue]);

  return (
    <div className="w-full flex flex-col gap-4 py-1">
      <div className="flex justify-around items-end h-28 px-2 relative">
        {/* Горизонтальні лінії сітки */}
        <div className="absolute inset-x-0 bottom-0 h-full flex flex-col justify-between pointer-events-none z-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full border-b border-border/10 border-dashed" />
          ))}
        </div>

        {/* Стовпчики */}
        {bars.map((bar, idx) => (
          <div key={bar.label} className="flex flex-col items-center gap-2 z-10 w-16">
            {/* Сума зверху */}
            <span className="text-[10px] font-bold text-foreground whitespace-nowrap">
              {formatPrice(Math.round(bar.value / 100))}
            </span>

            {/* Стовпчик */}
            <div className="w-8 bg-secondary/30 rounded-t-lg overflow-hidden h-20 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${bar.fillPct}%` }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 20,
                  delay: idx * 0.05,
                }}
                className="w-full rounded-t-lg"
                style={{ backgroundColor: bar.color }}
              />
            </div>

            {/* Підпис */}
            <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider text-center whitespace-nowrap">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
