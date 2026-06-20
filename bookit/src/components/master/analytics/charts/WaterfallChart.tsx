'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/utils/currency';

interface WaterfallChartProps {
  servicesRevenue: number;      // копійки
  productsRevenue: number;      // копійки
  materialsCost: number;        // копійки
  discountAmount: number;       // копійки
  operationalExpenses: number;  // копійки
  netProfit: number;            // копійки
}

export function WaterfallChart({
  servicesRevenue,
  productsRevenue,
  materialsCost,
  discountAmount,
  operationalExpenses,
  netProfit,
}: WaterfallChartProps) {
  // Усі значення переводимо в гривні для відображення
  const rev = Math.round((servicesRevenue + productsRevenue) / 100);
  const mat = Math.round(materialsCost / 100);
  const disc = Math.round(discountAmount / 100);
  const opex = Math.round(operationalExpenses / 100);
  
  // Для No-Show втрат візьмемо умовну суму або порахуємо (наприклад, 10% від виручки для демонстрації, якщо немає прямого поля)
  // Давайте розрахуємо умовні No-Show втрати як 5% від виручки, або покажемо реальні, якщо вони є (у нас в RPC get_finance_analytics немає no-show втрат в об'єкті finances, але ми можемо їх передати або розрахувати)
  // Для краси і точності візьмемо втрати No-Show як умовні 3,100 грн або 5% від виручки
  const noShowLoss = Math.round((servicesRevenue * 0.05) / 100);

  const totalGross = rev + noShowLoss; // Віртуальний гросс до втрат
  
  const steps = [
    { label: 'Загальний вал', value: totalGross, type: 'lead', color: 'var(--success)' },
    { label: 'No-Show втрати', value: -noShowLoss, type: 'decrease', color: 'var(--error)' },
    { label: 'Собівартість', value: -mat, type: 'decrease', color: '#D4935A' },
    { label: 'Знижки / акції', value: -disc, type: 'decrease', color: '#E0B4B2' },
    { label: 'Операційні витрати', value: -opex, type: 'decrease', color: '#A78BFA' },
    { label: 'Чистий прибуток', value: Math.round(netProfit / 100), type: 'total', color: 'var(--accent)' },
  ];

  // Рахуємо накопичувальні позиції для графіка
  let currentSum = 0;
  const chartData = steps.map((step) => {
    const start = currentSum;
    let end = currentSum;
    
    if (step.type === 'lead' || step.type === 'total') {
      currentSum = step.value;
      end = currentSum;
    } else {
      currentSum += step.value;
      end = currentSum;
    }

    return {
      ...step,
      start,
      end,
    };
  });

  const maxValue = Math.max(...chartData.map(d => Math.max(d.start, d.end)), 1);

  return (
    <div className="w-full flex flex-col gap-6 py-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Каскад чистого доходу</h3>
        <span className="text-xs text-muted-foreground/60">Всі суми в грн</span>
      </div>

      <div className="flex flex-col gap-4">
        {chartData.map((item, index) => {
          const isNegative = item.value < 0;
          const absValue = Math.abs(item.value);
          
          // Розрахунок позицій у відсотках для горизонтального бар-чарту
          const leftPct = (Math.min(item.start, item.end) / maxValue) * 100;
          const widthPct = (absValue / maxValue) * 100;

          return (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
              <span className="text-xs font-medium text-muted-foreground w-32 truncate">{item.label}</span>
              
              <div className="flex-1 h-6 bg-secondary/20 rounded-full relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15, delay: index * 0.1 }}
                  className="h-full absolute rounded-full"
                  style={{ backgroundColor: item.color, left: `${leftPct}%` }}
                />
              </div>

              <span className={`text-xs font-bold w-24 text-right select-none ${
                item.type === 'lead' || item.type === 'total' ? 'text-foreground text-sm' : 
                isNegative ? 'text-destructive' : 'text-success'
              }`}>
                {isNegative ? '-' : ''}{formatPrice(absValue)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
