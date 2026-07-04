'use client';

import React, { useState, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { AnimatePresence, motion } from 'framer-motion';

export interface HeatmapPoint {
  dow: number; // 1 (Пн) - 7 (Нд)
  hour: number; // 0 - 23
  occupancy_pct: number;
}

interface HeatmapGridProps {
  data: HeatmapPoint[];
}

const UA_DOW_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const UA_DOW_FULL = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];

export function HeatmapGrid({ data }: HeatmapGridProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    dow: number;
    hour: number;
    pct: number;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Визначаємо активні години (наприклад, з 8 до 20, або динамічно на основі даних)
  const hoursRange = useMemo(() => {
    const activeHours = data.filter((d) => d.occupancy_pct > 0).map((d) => d.hour);
    const minHour = Math.max(0, Math.min(...activeHours, 8));
    const maxHour = Math.min(23, Math.max(...activeHours, 20));
    
    const hours: number[] = [];
    for (let h = minHour; h <= maxHour; h++) {
      hours.push(h);
    }
    return hours;
  }, [data]);

  // 2. Створюємо матрицю для швидкого пошуку
  const matrix = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      map.set(`${d.dow}-${d.hour}`, d.occupancy_pct);
    });
    return map;
  }, [data]);

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    dow: number,
    hour: number,
    pct: number
  ) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();

    setHoveredCell({
      dow,
      hour,
      pct,
      x: cellRect.left - containerRect.left + cellRect.width / 2,
      y: cellRect.top - containerRect.top,
    });
  };

  return (
    <div ref={containerRef} className="w-full relative flex flex-col gap-3">
      <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
        <div className="min-w-[480px] flex flex-col gap-2">
          {/* Сітка теплової карти */}
          <div className="flex gap-2">
            {/* Дні тижня (ліва колонка) */}
            <div className="flex flex-col justify-between py-1 text-[11px] font-semibold text-text-sub w-6 select-none">
              {UA_DOW_SHORT.map((day) => (
                <div key={day} className="h-6 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Комірки (основна сітка) */}
            <div className="flex-1 grid grid-cols-7 gap-1">
              {/* По днях тижня і по годинах */}
              {hoursRange.map((hour) => (
                <div key={hour} className="flex flex-col gap-1">
                  {/* Година зверху (тільки парні для чистоти дизайну) */}
                  <span className="text-[9px] font-bold text-text-sub text-center h-4 flex items-center justify-center select-none">
                    {hour % 2 === 0 ? `${hour}:00` : ''}
                  </span>

                  {/* Комірки для кожного дня тижня */}
                  {Array.from({ length: 7 }).map((_, dIdx) => {
                    const dow = dIdx + 1; // 1-7
                    const pct = matrix.get(`${dow}-${hour}`) ?? 0;

                    // Підбираємо колірну насиченість
                    let opacityClass = 'bg-secondary/40'; // 0%
                    if (pct > 0 && pct <= 20) opacityClass = 'bg-primary/20';
                    if (pct > 20 && pct <= 50) opacityClass = 'bg-primary/45';
                    if (pct > 50 && pct <= 80) opacityClass = 'bg-primary/70';
                    if (pct > 80) opacityClass = 'bg-primary';

                    return (
                      <div
                        key={dow}
                        className={cn(
                          'h-6 rounded-md transition-all duration-150 cursor-pointer active:scale-90 border border-border/10',
                          opacityClass
                        )}
                        onMouseEnter={(e) => handleMouseEnter(e, dow, hour, pct)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onTouchStart={(e) => handleMouseEnter(e, dow, hour, pct)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
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
              {UA_DOW_FULL[hoveredCell.dow - 1]}
            </p>
            <p className="text-text-sub mt-0.5">
              Час: {hoveredCell.hour}:00
            </p>
            <p className="text-primary font-bold mt-1">
              Зайнятість: {hoveredCell.pct}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
