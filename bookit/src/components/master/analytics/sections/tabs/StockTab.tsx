'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, ShoppingBag, CheckCircle, 
  TrendingDown, Clipboard, Check
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/currency';
import { useAnalyticsExtras, type StockForecastItem } from '@/lib/supabase/hooks/useAnalyticsExtras';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { EmptyCell } from '../../primitives/EmptyCell';

interface StockTabProps {
  start: string;
  end: string;
  isPro: boolean;
}

export function StockTab({ start, end, isPro }: StockTabProps) {
  const [copied, setCopied] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const { data, isLoading } = useAnalyticsExtras({
    start,
    end,
    isPro,
    scope: 'stock',
    enabled: isPro,
  });

  if (!isPro) {
    return (
      <div className="p-6 rounded-2xl bg-secondary/20 border border-border/5 text-center flex flex-col items-center justify-center min-h-[300px]">
        <ShoppingBag className="size-12 text-primary mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Прогнозування складу доступне в Pro</h3>
        <p className="text-sm text-muted-foreground/60 max-w-sm mb-4">
          Підключіть тариф Pro, щоб бачити автоматичні прогнози закінчення розхідників на основі вашого розкладу.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonCell variant="flat" className="h-[300px]" />;
  }

  const items = data?.stock_forecast ?? [];
  const hasData = items.length > 0;

  const displayItems = hasData ? items : [
    { product_id: '1', product_name: 'Фарба для волосся (Блонд)', stock_qty: 3, stock_alert_threshold: 5, cost_kopecks: null, required_qty_14_days: 10, used_qty_past_30_days: 15, predicted_days_left: 2 },
    { product_id: '2', product_name: 'Базове покриття', stock_qty: 12, stock_alert_threshold: 4, cost_kopecks: null, required_qty_14_days: 8, used_qty_past_30_days: 16, predicted_days_left: 6 },
    { product_id: '3', product_name: 'Захисний топ', stock_qty: 24, stock_alert_threshold: 5, cost_kopecks: null, required_qty_14_days: 4, used_qty_past_30_days: 8, predicted_days_left: 45 },
  ];

  // Сортуємо: спочатку ті, що закінчуються швидше
  const sortedItems = [...displayItems].sort((a, b) => a.predicted_days_left - b.predicted_days_left);

  // Формуємо список покупок для товарів, у яких менше 7 днів або запас нижче ліміту
  const lowStockItems = sortedItems.filter(
    item => item.predicted_days_left <= 7 || (item.stock_alert_threshold && item.stock_qty <= item.stock_alert_threshold)
  );

  const handleCopyShoppingList = () => {
    const text = lowStockItems
      .map(item => `- ${item.product_name}: треба купити (залишилось ${item.stock_qty} шт, вистачить на ${item.predicted_days_left} дн.)`)
      .join('\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full">
      <div className={`flex flex-col gap-5 transition-all duration-700 ${!hasData ? 'blur-[8px] opacity-40 pointer-events-none select-none grayscale-[0.2]' : ''}`}>
        {/* Картки швидкого огляду */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bento-card p-5 bg-destructive/10 border border-destructive/20 flex flex-col justify-between">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider">Критичний дефіцит</p>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-destructive">
                {sortedItems.filter(i => i.predicted_days_left <= 3).length}
              </span>
              <span className="text-[11px] text-destructive/70">Вистачить менш ніж на 3 дні</span>
            </div>
          </div>

          <div className="bento-card p-5 bg-warning/10 border border-warning/20 flex flex-col justify-between">
            <p className="text-xs font-semibold text-warning uppercase tracking-wider">Увага (менше 7 днів)</p>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-warning">
                {sortedItems.filter(i => i.predicted_days_left > 3 && i.predicted_days_left <= 7).length}
              </span>
              <span className="text-[11px] text-warning/70">Потребують поповнення</span>
            </div>
          </div>

          <div className="bento-card p-5 bg-success/10 border border-success/20 flex flex-col justify-between">
            <p className="text-xs font-semibold text-success uppercase tracking-wider">Запаси в нормі</p>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-success">
                {sortedItems.filter(i => i.predicted_days_left > 7).length}
              </span>
              <span className="text-[11px] text-success/70">Більше тижня роботи</span>
            </div>
          </div>
        </div>

        {/* Список consumable-матеріалів */}
        <div className="bento-card p-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Світлофор дефіциту розхідників</h3>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">Прогноз закінчення на основі 14 днів записів</p>
            </div>

            {lowStockItems.length > 0 && (
              <button
                type="button"
                onClick={() => setShowShoppingList(!showShoppingList)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold cursor-pointer active:scale-[0.95] transition-all"
              >
                <ShoppingBag size={13} />
                {showShoppingList ? 'Сховати список покупок' : 'Сформувати список покупок'}
              </button>
            )}
          </div>

          {/* Панель списку покупок */}
          <AnimatePresence>
            {showShoppingList && lowStockItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 rounded-2xl bg-secondary/40 border border-border/10 flex flex-col gap-3 overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground uppercase">Список до закупівлі</span>
                  <button
                    type="button"
                    onClick={handleCopyShoppingList}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    {copied ? <Check size={12} /> : <Clipboard size={12} />}
                    {copied ? 'Скопійовано!' : 'Копіювати список'}
                  </button>
                </div>
                <div className="text-xs text-muted-foreground/80 flex flex-col gap-1.5 font-mono">
                  {lowStockItems.map((item, index) => (
                    <div key={index}>
                      - {item.product_name} (залишилось {item.stock_qty} шт, вистачить на {item.predicted_days_left} дн.)
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col divide-y divide-border/10">
            {sortedItems.map((item) => {
              const isCritical = item.predicted_days_left <= 3;
              const isWarning = item.predicted_days_left > 3 && item.predicted_days_left <= 7;
              
              return (
                <div key={item.product_id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`size-8 rounded-full flex items-center justify-center shadow-sm ${
                      isCritical ? 'bg-destructive/10 text-destructive' : 
                      isWarning ? 'bg-warning/10 text-warning' : 
                      'bg-success/10 text-success'
                    }`}>
                      {isCritical && <AlertTriangle size={15} />}
                      {isWarning && <AlertTriangle size={15} />}
                      {!isCritical && !isWarning && <CheckCircle size={15} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.product_name}</p>
                      <p className="text-[11px] text-muted-foreground/60">
                        Поточний запас: {item.stock_qty} шт 
                        {item.stock_alert_threshold && ` (поріг: ${item.stock_alert_threshold})`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold drop-shadow-sm ${
                      isCritical ? 'text-destructive' : 
                      isWarning ? 'text-warning' : 
                      'text-success'
                    }`}>
                      {item.predicted_days_left === 999 ? 'Без ліміту' : `~ ${item.predicted_days_left} днів`}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {item.predicted_days_left <= 7 ? 'Потребує уваги' : 'Запасів достатньо'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Premium Overlay for Empty State */}
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center z-20 px-4 pointer-events-auto">
          <div className="bento-card p-8 flex flex-col items-center justify-center text-center max-w-md bg-surface/80 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgb(0,0,0,0.12)]">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-5 border border-primary/20 shadow-inner">
              <ShoppingBag size={28} />
            </div>
            <h3 className="heading-serif text-2xl font-bold text-foreground mb-2">Склад та прогнози</h3>
            <p className="text-sm text-muted-foreground/80 mb-6 leading-relaxed">
              Коли ви почнете використовувати витратні матеріали, алгоритм BookIT розрахує швидкість їх використання та автоматично нагадає про закупівлю до того, як вони закінчаться.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
