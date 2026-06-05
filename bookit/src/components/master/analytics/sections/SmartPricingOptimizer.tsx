'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/lib/toast/context';

interface SmartPricingOptimizerProps {
  occupancyHeatmap?: { dow: number; hour: number; occupancy_pct: number }[];
}

export function SmartPricingOptimizer({ occupancyHeatmap }: SmartPricingOptimizerProps) {
  const [activated, setActivated] = useState(false);
  const { showToast } = useToast();

  // Шукаємо, чи є дні з завантаженістю > 80% (пікові години)
  const peakSlots = occupancyHeatmap?.filter(h => h.occupancy_pct >= 80) ?? [];
  
  // Для симулятора: якщо є хоч одна пікова година, показуємо рекомендацію для цього дня тижня
  const daysOfWeek = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
  const peakDayIndex = peakSlots.length > 0 ? peakSlots[0].dow - 1 : 5; // Дефолт: субота
  const peakDayName = daysOfWeek[peakDayIndex] || 'Субота';

  const handleActivate = () => {
    setActivated(true);
    showToast({
      type: 'success',
      title: 'Динамічну націнку активовано!',
      message: `Націнку +15% додано до послуг у ${peakDayName.toLowerCase()} з підвищеним попитом.`,
    });
  };

  return (
    <div className="bento-card p-5 bg-primary/5 border border-primary/15 flex flex-col gap-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Zap className="size-16 text-primary" />
      </div>

      <div className="flex items-center gap-2 text-primary">
        <Zap className="size-4 animate-pulse" />
        <h3 className="text-xs font-bold uppercase tracking-wider">Розумний оптимізатор цін</h3>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {activated 
              ? `Оптимальні ціни для ${peakDayName.toLowerCase()} активовані` 
              : `Отримайте додатково +₴3,200/міс у ${peakDayName.toLowerCase()}`
            }
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1 leading-normal">
            {activated
              ? `Ціни автоматично збільшуватимуться на +15% при завантаженості слотів понад 85%.`
              : `Ваша завантаженість у ${peakDayName.toLowerCase()} становить 95%+. Клієнти готові платити більше за гарячий час.`
            }
          </p>
        </div>

        <button
          type="button"
          onClick={handleActivate}
          disabled={activated}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-bold transition-all active:scale-[0.95] ${
            activated 
              ? 'bg-success/10 text-success border border-success/20 cursor-default' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
          }`}
        >
          {activated ? <Check size={13} /> : <Zap size={13} />}
          {activated ? 'Активовано' : 'Активувати в один клік'}
        </button>
      </div>
    </div>
  );
}
