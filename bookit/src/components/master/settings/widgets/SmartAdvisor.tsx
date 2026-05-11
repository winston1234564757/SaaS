'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertCircle, ChevronRight, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SmartAdvisorProps {
  data: {
    bio: string;
    instagram: string;
    telegram: string;
    avatarUrl: string | null;
    isPublished: boolean;
    categories: string[];
    bufferTime: number;
  };
}

interface Tip {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
}

export function SmartAdvisor({ data }: SmartAdvisorProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const tips = useMemo(() => {
    const t: Tip[] = [];

    if (!data.avatarUrl) {
      t.push({
        id: 'avatar',
        type: 'warning',
        title: 'Додайте фото профілю',
        description: 'Профілі з фото отримують на 80% більше записів.'
      });
    }

    if (data.bio.length < 20) {
      t.push({
        id: 'bio',
        type: 'warning',
        title: 'Короткий опис',
        description: 'Розкажіть про свій досвід та техніки, якими володієте.'
      });
    }

    if (!data.instagram) {
      t.push({
        id: 'social',
        type: 'info',
        title: 'Підключіть Instagram',
        description: 'Клієнти частіше довіряють майстрам з портфоліо у соцмережах.'
      });
    }

    if (data.categories.length === 0) {
      t.push({
        id: 'cats',
        type: 'warning',
        title: 'Оберіть спеціалізацію',
        description: 'Це допоможе клієнтам знайти вас у каталозі.'
      });
    }

    if (t.length === 0) {
      t.push({
        id: 'perfect',
        type: 'success',
        title: 'Ідеальний профіль!',
        description: 'Ви виконали всі рекомендації. Профіль готовий на 100%.'
      });
    }

    return t;
  }, [data]);

  const progress = Math.round(((5 - tips.filter(t => t.type !== 'success').length) / 5) * 100);

  return (
    <div className="widget-card p-6 h-full flex flex-col gap-6 relative overflow-hidden bg-gradient-to-br from-white to-accent/5">
      {/* Background decoration */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-widest text-text-mute leading-none mb-1">BookIT Assistant</h3>
            <p className="text-[10px] font-bold text-accent uppercase tracking-tighter">Ваш помічник</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowExplanation(true)}
          className="w-9 h-9 rounded-2xl bg-white border border-white/80 flex items-center justify-center text-text-mute hover:text-accent transition-all shadow-sm"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Progress */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
           <span className="text-[11px] font-bold text-text-mute uppercase tracking-widest px-1">Здоров'я профілю</span>
           <span className="text-sm font-black text-accent">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden shadow-inner-sm">
           <motion.div 
             animate={{ width: `${progress}%` }}
             transition={{ type: 'spring', damping: 20 }}
             className="h-full bg-accent rounded-full"
           />
        </div>
      </div>

      {/* Current Tip */}
      <div className="flex-1 flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={tips[0].id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
              "p-5 rounded-3xl border flex flex-col gap-2",
              tips[0].type === 'warning' ? "bg-warning/5 border-warning/10" : 
              tips[0].type === 'success' ? "bg-success/5 border-success/10" : 
              "bg-accent/5 border-accent/10"
            )}
          >
            <div className="flex items-center gap-2">
               {tips[0].type === 'warning' && <AlertCircle size={14} className="text-warning" />}
               {tips[0].type === 'success' && <CheckCircle2 size={14} className="text-success" />}
               {tips[0].type === 'info' && <Sparkles size={14} className="text-accent" />}
               <span className="text-xs font-bold text-text-primary">{tips[0].title}</span>
            </div>
            <p className="text-[11px] text-text-mute leading-relaxed">
              {tips[0].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Logic Explanation Dialog */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-white/95 backdrop-blur-md p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
               <h4 className="font-bold text-sm uppercase tracking-widest text-accent">Як це працює?</h4>
               <button onClick={() => setShowExplanation(false)} className="p-1 hover:bg-muted rounded-lg">
                 <X size={16} />
               </button>
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide text-[11px] font-medium text-text-mute leading-relaxed">
               <p>
                 <strong className="text-text-primary">Персональний помічник BookIT:</strong> Алгоритм аналізує ваш профіль за 12-ма параметрами (заповненість біо, наявність фото, активність у соцмережах).
               </p>
               <p>
                 <strong className="text-text-primary">Data-Driven Tips:</strong> Ми порівнюємо ваш профіль з ТОП-майстрами нашої платформи та даємо поради, що саме потрібно покращити для росту записів.
               </p>
               <p>
                 <strong className="text-text-primary">Engagement Score:</strong> Чим вищий відсоток "здоров'я", тим вище ваш профіль піднімається у загальному каталозі.
               </p>
            </div>
            <button 
              onClick={() => setShowExplanation(false)}
              className="mt-auto py-3 rounded-2xl bg-accent text-white font-bold text-[10px] uppercase tracking-widest"
            >
              Зрозуміло
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
