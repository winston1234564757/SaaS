'use client';

import React, { useMemo, useState, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';

export interface CohortPoint {
  cohort_month: string; // YYYY-MM-DD
  cohort_size: number;
  month_diff: number; // 0 - 12
  retention_pct: number;
}

interface CohortHeatmapProps {
  data: CohortPoint[];
}

export function CohortHeatmap({ data }: CohortHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    monthName: string;
    size: number;
    diff: number;
    pct: number;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Групуємо унікальні місяці когорт та визначаємо кількість місяців повернення (зазвичай показуємо до 6 місяців для компактності)
  const { cohorts, maxDiff } = useMemo(() => {
    const monthsSet = new Set<string>();
    let maxD = 0;

    data.forEach((d) => {
      monthsSet.add(d.cohort_month);
      if (d.month_diff > maxD) maxD = d.month_diff;
    });

    const sortedMonths = Array.from(monthsSet).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    ); // Сортуємо від нових до старих

    return {
      cohorts: sortedMonths,
      maxDiff: Math.min(maxD, 6), // Обмежуємо 6-ма місяцями для читабельності на екрані
    };
  }, [data]);

  // 2. Створюємо мапу значень для швидкого пошуку
  const matrix = useMemo(() => {
    const map = new Map<string, { size: number; pct: number }>();
    data.forEach((d) => {
      map.set(`${d.cohort_month}-${d.month_diff}`, {
        size: d.cohort_size,
        pct: d.retention_pct,
      });
    });
    return map;
  }, [data]);

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    monthStr: string,
    size: number,
    diff: number,
    pct: number
  ) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();

    const formattedMonth = format(new Date(monthStr), 'LLLL yyyy', { locale: uk });
    const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

    setHoveredCell({
      monthName: capitalizedMonth,
      size,
      diff,
      pct,
      x: cellRect.left - containerRect.left + cellRect.width / 2,
      y: cellRect.top - containerRect.top,
    });
  };

  return (
    <div ref={containerRef} className="w-full relative flex flex-col gap-3">
      <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
        <div className="min-w-[560px] flex flex-col gap-2">
          {/* Заголовки стовпців */}
          <div className="flex text-[9px] font-bold text-text-sub uppercase tracking-wider select-none h-6 items-center">
            <div className="w-24 text-left">Місяць</div>
            <div className="w-16 text-center">Розмір</div>
            <div className="flex-1 grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: maxDiff + 1 }).map((_, i) => (
                <div key={i}>М{i}</div>
              ))}
            </div>
          </div>

          {/* Рядки когорт */}
          <div className="flex flex-col gap-1.5">
            {cohorts.map((month) => {
              const baseData = matrix.get(`${month}-0`);
              const size = baseData?.size ?? 0;
              
              const formattedDate = format(new Date(month), 'LLL yyyy', { locale: uk });
              const rowLabel = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

              return (
                <div key={month} className="flex items-center text-xs h-8">
                  {/* Назва когорти */}
                  <div className="w-24 font-medium text-foreground truncate select-none">
                    {rowLabel}
                  </div>

                  {/* Розмір когорти */}
                  <div className="w-16 text-center text-text-sub font-semibold select-none">
                    {size}
                  </div>

                  {/* Матриця повернення клієнтів */}
                  <div className="flex-1 grid grid-cols-7 gap-1 h-full">
                    {Array.from({ length: maxDiff + 1 }).map((_, i) => {
                      const cellData = matrix.get(`${month}-${i}`);
                      
                      // Якщо для когорти цього місяця ще не пройшов час, малюємо пусту комірку
                      if (!cellData && i > 0) {
                        return <div key={i} className="bg-secondary/10 rounded-md border border-dashed border-border/10" />;
                      }

                      const pct = cellData?.pct ?? (i === 0 ? 100 : 0);

                      // Підбираємо колір за насиченістю
                      let colorClass = 'bg-secondary/40 text-text-sub';
                      if (pct > 0 && pct <= 15) colorClass = 'bg-primary/10 text-primary-foreground/70';
                      if (pct > 15 && pct <= 30) colorClass = 'bg-primary/25 text-primary-foreground';
                      if (pct > 30 && pct <= 60) colorClass = 'bg-primary/55 text-primary-foreground font-bold';
                      if (pct > 60) colorClass = 'bg-primary text-accent-on font-bold';

                      return (
                        <div
                          key={i}
                          className={cn(
                            'rounded-md flex items-center justify-center text-[10px] cursor-pointer transition-all duration-150 active:scale-95 border border-border/5',
                            colorClass
                          )}
                          onMouseEnter={(e) => handleMouseEnter(e, month, size, i, pct)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onTouchStart={(e) => handleMouseEnter(e, month, size, i, pct)}
                        >
                          {pct}%
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Тултіп (Tooltip) */}
      <AnimatePresence>
        {hoveredCell && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: -8, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute bg-secondary border border-border rounded-xl p-2.5 shadow-lg text-[11px] leading-tight pointer-events-none z-25"
            style={{
              left: hoveredCell.x,
              top: hoveredCell.y,
              transform: 'translateX(-50%) translateY(-100%)',
            }}
          >
            <p className="font-semibold text-foreground">
              Когорта: {hoveredCell.monthName}
            </p>
            <p className="text-text-sub mt-0.5">
              Нових клієнтів: {hoveredCell.size}
            </p>
            <p className="text-primary font-bold mt-1">
              {hoveredCell.diff === 0 
                ? 'Перший візит (100%)' 
                : `Місяць ${hoveredCell.diff}: повернення ${hoveredCell.pct}%`
              }
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
