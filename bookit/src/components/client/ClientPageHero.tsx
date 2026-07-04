'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { EditorialCover } from '@/components/ui/EditorialCover';

/**
 * ClientPageHero — компактний темний editorial-хедер клієнт-зони (C-MAST-01).
 * Одна мова для верхів /my/* сторінок: серіф-заголовок-ідентичність (домінанта) +
 * опційна metric-value-цифра праворуч + тихий підзаголовок. Замінює світлий
 * `bento-card p-5` хедер. On-dark рамп: white / white-60 / white-55 (≥4.5:1 на slate).
 */
export function ClientPageHero({
  title, subtitle, metric, metricLabel, action, glowColor = '#818CF8',
}: {
  title: string;
  subtitle?: string;
  /** Число-домінанта праворуч (напр. к-сть майстрів, нові сповіщення). */
  metric?: number;
  metricLabel?: string;
  action?: ReactNode;
  glowColor?: string;
}) {
  return (
    <EditorialCover glowColor={glowColor} className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="heading-serif text-2xl text-white leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-white/60 text-sm mt-1">{subtitle}</p>}
        </div>

        {metric != null && metric > 0 && (
          <div className="text-right shrink-0">
            <p className="metric-value text-white text-3xl leading-none">{metric}</p>
            {metricLabel && <p className="text-white/55 text-[11px] mt-1">{metricLabel}</p>}
          </div>
        )}

        {action}
      </motion.div>
    </EditorialCover>
  );
}
