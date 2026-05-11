'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, TrendingUp, Users, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { format, subMonths, addMonths } from 'date-fns';
import { uk } from 'date-fns/locale';

interface ServiceStat {
  name: string;
  count: number;
  percentage: number;
}

interface ProductMixWidgetProps {
  services: ServiceStat[];
  onMonthChange?: (date: Date) => void;
}

export function ProductMixWidget({ services, onMonthChange }: ProductMixWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrev = () => {
    const next = subMonths(currentDate, 1);
    setCurrentDate(next);
    onMonthChange?.(next);
  };

  const handleNext = () => {
    const next = addMonths(currentDate, 1);
    setCurrentDate(next);
    onMonthChange?.(next);
  };

  return (
    <div className="widget-card p-6 h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
            <Award size={18} />
          </div>
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-widest text-text-mute leading-none mb-1">Популярні послуги</h3>
            <p className="text-[10px] font-bold text-accent uppercase tracking-tighter">ТОП запитів</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-white/60">
          <button onClick={handlePrev} className="p-1 hover:bg-white rounded-lg transition-colors">
            <ChevronLeft size={14} className="text-text-mute" />
          </button>
          <div className="px-2 flex items-center gap-1.5 min-w-[120px] justify-center whitespace-nowrap">
            <Calendar size={12} className="text-accent shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-text-primary">
              {format(currentDate, 'LLLL yyyy', { locale: uk })}
            </span>
          </div>
          <button onClick={handleNext} className="p-1 hover:bg-white rounded-lg transition-colors">
            <ChevronRight size={14} className="text-text-mute" />
          </button>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-5 flex-1 py-2">
        {services.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center opacity-40 py-10">
              <Award size={40} strokeWidth={1} className="mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Немає даних за цей період</p>
           </div>
        ) : (
          services.map((service, index) => (
            <div key={service.name} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-text-primary truncate max-w-[70%]">{service.name}</span>
                <span className="text-[10px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded-lg border border-accent/10">{service.count}</span>
              </div>
              <div className="relative w-full h-2 bg-muted/40 rounded-full overflow-hidden shadow-inner-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${service.percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.1, type: 'spring', damping: 20 }}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full shadow-sm",
                    index === 0 ? "bg-accent" : index === 1 ? "bg-accent/70" : "bg-accent/40"
                  )}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legend / Trend */}
      <div className="pt-4 border-t border-white/40 flex items-center justify-between text-[10px] font-bold text-text-mute/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-success/10 text-success flex items-center justify-center">
            <TrendingUp size={12} />
          </div>
          <span>Тред місяця — це послуга з найбільшим ростом популярності</span>
        </div>
      </div>
    </div>
  );
}
