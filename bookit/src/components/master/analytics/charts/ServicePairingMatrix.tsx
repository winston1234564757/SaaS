'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export interface ServicePair {
  service_a: string;
  service_b: string;
  pair_count: number;
}

interface ServicePairingMatrixProps {
  pairs: ServicePair[];
}

export function ServicePairingMatrix({ pairs }: ServicePairingMatrixProps) {
  const points = useMemo(() => {
    const maxCount = Math.max(...pairs.map((p) => p.pair_count), 1);
    return pairs.map((p) => ({
      ...p,
      fillPct: Math.round((p.pair_count / maxCount) * 100),
    }));
  }, [pairs]);

  if (points.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground/60">
        Недостатньо даних про спільні бронювання послуг
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3 py-1">
      {points.map((p, idx) => (
        <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-secondary/30 border border-border/10">
          {/* Назви послуг та їх з'єднання */}
          <div className="flex items-center justify-between text-xs w-full">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-semibold text-foreground truncate max-w-[120px] md:max-w-[150px]">
                {p.service_a}
              </span>
              <span className="text-primary flex-shrink-0">
                <Plus size={10} />
              </span>
              <span className="font-semibold text-foreground truncate max-w-[120px] md:max-w-[150px]">
                {p.service_b}
              </span>
            </div>
            
            <span className="font-bold text-primary ml-2 flex-shrink-0">
              {p.pair_count} спільн.
            </span>
          </div>

          {/* Смужка прогресу */}
          <div className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${p.fillPct}%` }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 20,
                delay: idx * 0.05,
              }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
