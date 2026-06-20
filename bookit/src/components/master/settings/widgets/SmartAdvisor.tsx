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
  warning: <AlertCircle size={13} className="text-warning shrink-0" />,
  success: <CheckCircle2 size={13} className="text-success shrink-0" />,
  info:    <Sparkles size={13} className="text-accent shrink-0" />,
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
        description: 'Профілі з фото отримують більше звернень від клієнтів.'
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
        title: 'Профіль заповнений',
        description: 'Ви виконали всі рекомендації. Профіль готовий на 100%.'
      });
    }

    return t;
  }, [data]);

  const issueCount = tips.filter(t => t.type !== 'success').length;
  const progress = Math.round(((4 - issueCount) / 4) * 100);

  return (
    <div className="widget-card p-6 h-full flex flex-col gap-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-accent text-[var(--accent-on)] flex items-center justify-center shadow-lg shadow-accent/20">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-widest text-text-mute leading-none mb-1">BookIT Assistant</h3>
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

      {/* Score + Progress */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary border border-border">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-text-mute uppercase tracking-widest">{`Здоров'я профілю`}</span>
            <span className={cn(
              'text-sm font-bold',
              progress === 100 ? 'text-success' : progress >= 50 ? 'text-warning' : 'text-destructive'
            )}>
              {progress}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Здоров'я профілю"
            className="w-full h-2 bg-muted/40 rounded-full overflow-hidden"
          >
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring' as const, damping: 20 }}
              className={cn(
                'h-full rounded-full',
                progress === 100 ? 'bg-success' : progress >= 50 ? 'bg-warning' : 'bg-destructive'
              )}
            />
          </div>
        </div>
        <div className={cn(
          'text-3xl font-bold tabular-nums leading-none',
          progress === 100 ? 'text-success' : progress >= 50 ? 'text-warning' : 'text-destructive'
        )}>
          {progress}
        </div>
      </div>

      {/* Tips list — fills remaining height */}
      <div className="flex flex-col gap-2 flex-1">
        {/* First tip: prominent card */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={tips[0].id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
              "p-4 rounded-2xl border flex flex-col gap-2",
              tips[0].type === 'warning' ? "bg-warning/5 border-warning/10" :
              tips[0].type === 'success' ? "bg-success/5 border-success/10" :
              "bg-accent/5 border-accent/10"
            )}
          >
            <div className="flex items-center gap-2">
              {TIP_ICON[tips[0].type]}
              <span className="text-xs font-bold text-text-primary">{tips[0].title}</span>
            </div>
            <p className="text-[11px] text-text-mute leading-relaxed">{tips[0].description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Remaining tips: compact rows */}
        {tips.slice(1).map((tip) => (
          <div
            key={tip.id}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-secondary border border-border"
          >
            {TIP_ICON[tip.type]}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-text-primary truncate">{tip.title}</p>
              <p className="text-[10px] text-text-mute truncate">{tip.description}</p>
            </div>
          </div>
        ))}

        {/* If all done: success state fills bottom */}
        {tips.length === 1 && tips[0].type === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4 opacity-60">
            <CheckCircle2 size={32} strokeWidth={1.2} className="text-success" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-mute text-center">
              Всі рекомендації виконані
            </p>
          </div>
        )}
      </div>

      {/* Logic Explanation Dialog */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-background/95 backdrop-blur-md p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm uppercase tracking-widest text-accent">Як це працює?</h4>
              <button type="button" onClick={() => setShowExplanation(false)} aria-label="Закрити" className="p-1 hover:bg-muted active:scale-[0.88] cursor-pointer rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide text-[11px] font-medium text-text-mute leading-relaxed flex-1">
              <p><strong className="text-text-primary">Персональний помічник BookIT:</strong> Алгоритм аналізує ваш профіль за ключовими параметрами: заповненість біо, наявність фото, активність у соцмережах.</p>
              <p><strong className="text-text-primary">Поради профілю:</strong> Ми порівнюємо ваш профіль з успішними майстрами та даємо поради, що саме покращити для росту записів.</p>
              <p><strong className="text-text-primary">Видимість у каталозі:</strong> Чим вищий відсоток заповненості, тим більше шансів потрапити вище у загальному каталозі.</p>
            </div>
            <button type="button"
              onClick={() => setShowExplanation(false)}
              className="mt-4 py-3 rounded-2xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] font-bold text-[10px] uppercase tracking-widest active:scale-[0.95] cursor-pointer transition-all"
            >
              Зрозуміло
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
