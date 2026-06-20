'use client';
// humanized

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertCircle, HelpCircle, X } from 'lucide-react';
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

const TIP_ICON = {
  warning: <AlertCircle size={14} className="text-warning shrink-0" />,
  success: <CheckCircle2 size={14} className="text-success shrink-0" />,
  info:    <Sparkles size={14} className="text-accent shrink-0" />,
};

export function SmartAdvisor({ data }: SmartAdvisorProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const tips = useMemo(() => {
    const t: Tip[] = [];

    if (!data.avatarUrl) {
      t.push({
        id: 'avatar',
        type: 'warning',
        title: 'Додайте фото профілю',
        description: 'Профілі з фото отримують значно більше записів від нових клієнтів.'
      });
    }

    if (data.bio.length < 20) {
      t.push({
        id: 'bio',
        type: 'warning',
        title: 'Короткий опис',
        description: 'Розкажіть про свій досвід та техніки — клієнти обирають за описом.'
      });
    }

    if (!data.instagram) {
      t.push({
        id: 'social',
        type: 'info',
        title: 'Підключіть Instagram',
        description: 'Майстри з підключеним Instagram отримують більше довіри.'
      });
    }

    if (data.categories.length === 0) {
      t.push({
        id: 'cats',
        type: 'warning',
        title: 'Оберіть спеціалізацію',
        description: 'Допоможе клієнтам знайти вас у каталозі за фільтром.'
      });
    }

    if (t.length === 0) {
      t.push({
        id: 'perfect',
        type: 'success',
        title: 'Профіль повністю заповнений',
        description: 'Всі рекомендації виконано. Ви готові до нових записів.'
      });
    }

    return t;
  }, [data]);

  const issueCount = tips.filter(t => t.type !== 'success').length;
  const progress = Math.round(((4 - issueCount) / 4) * 100);

  const scoreColor = progress === 100 ? 'text-success' : progress >= 50 ? 'text-warning' : 'text-destructive';
  const scoreBg = progress === 100 ? 'bg-success' : progress >= 50 ? 'bg-warning' : 'bg-destructive';

  return (
    <div className="widget-card p-6 h-full flex flex-col gap-5 relative overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-accent text-[var(--accent-on)] flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-text-primary leading-none mb-1">BookIT Assistant</h3>
            <p className="text-[10px] font-bold text-accent uppercase tracking-tighter">Ваш помічник</p>
          </div>
        </div>
        <button type="button"
          onClick={() => setShowExplanation(true)}
          aria-label="Як це працює?"
          className="size-9 rounded-2xl bg-secondary border border-border/80 flex items-center justify-center text-text-mute hover:text-accent active:scale-[0.88] cursor-pointer transition-all shadow-sm"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Hero Score */}
      <div className="flex flex-col gap-2 px-1">
        <div className="flex items-end gap-2">
          <span className={cn('text-7xl font-bold tabular-nums leading-none tracking-tighter', scoreColor)}>
            {progress}
          </span>
          <div className="flex flex-col mb-2 gap-0.5">
            <span className="text-2xl font-bold text-text-mute/40 leading-none">%</span>
            <span className="text-[10px] font-bold text-text-mute uppercase tracking-widest leading-none">здоров&apos;я</span>
          </div>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Здоров'я профілю"
          className="w-full h-2 bg-muted/30 rounded-full overflow-hidden"
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring' as const, damping: 20 }}
            className={cn('h-full rounded-full', scoreBg)}
          />
        </div>
      </div>

      {/* Tips list — fills remaining height */}
      <div className="flex flex-col gap-2.5 flex-1">

        {/* First tip: prominent */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={tips[0].id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className={cn(
              'p-4 rounded-2xl border flex flex-col gap-2',
              tips[0].type === 'warning' ? 'bg-warning/5 border-warning/10' :
              tips[0].type === 'success' ? 'bg-success/5 border-success/10' :
              'bg-accent/5 border-accent/10'
            )}
          >
            <div className="flex items-center gap-2">
              {TIP_ICON[tips[0].type]}
              <span className="text-sm font-bold text-text-primary">{tips[0].title}</span>
            </div>
            <p className="text-xs text-text-mute leading-relaxed">{tips[0].description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Remaining tips: compact rows */}
        {tips.slice(1).map((tip) => (
          <div
            key={tip.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border"
          >
            {TIP_ICON[tip.type]}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">{tip.title}</p>
              <p className="text-[11px] text-text-mute truncate">{tip.description}</p>
            </div>
          </div>
        ))}

        {/* All done state */}
        {tips.length === 1 && tips[0].type === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 opacity-50">
            <CheckCircle2 size={36} strokeWidth={1.2} className="text-success" />
            <p className="text-xs font-bold uppercase tracking-widest text-text-mute text-center">
              Всі рекомендації виконані
            </p>
          </div>
        )}
      </div>

      {/* Explanation overlay */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-background/96 backdrop-blur-md p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-bold text-sm text-accent">Як це працює?</h4>
              <button type="button" onClick={() => setShowExplanation(false)} aria-label="Закрити"
                className="size-8 rounded-xl hover:bg-muted flex items-center justify-center active:scale-[0.88] cursor-pointer transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto text-xs text-text-mute leading-relaxed flex-1">
              <p><strong className="text-text-primary">Персональний помічник BookIT</strong> — аналізує ваш профіль та дає поради для росту записів.</p>
              <p><strong className="text-text-primary">Здоров'я профілю</strong> — розраховується на основі заповненості: фото, опис, соцмережі, спеціалізації.</p>
              <p><strong className="text-text-primary">Видимість у каталозі</strong> — чим вищий відсоток, тим вища позиція у загальному каталозі майстрів.</p>
            </div>
            <button type="button"
              onClick={() => setShowExplanation(false)}
              className="mt-5 py-3.5 rounded-2xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] font-bold text-xs uppercase tracking-widest active:scale-[0.95] cursor-pointer transition-all"
            >
              Зрозуміло
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
