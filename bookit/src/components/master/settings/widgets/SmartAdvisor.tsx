'use client';
// humanized

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertCircle, HelpCircle, X, ChevronRight } from 'lucide-react';
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
  target?: string; // id секції на сторінці налаштувань
}

const TIP_ICON = {
  warning: <AlertCircle size={15} className="text-warning shrink-0" />,
  success: <CheckCircle2 size={15} className="text-success shrink-0" />,
  info:    <Sparkles size={15} className="text-accent shrink-0" />,
};

// Скрол до розділу, який виправляє пораду + коротка підсвітка
function jumpToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('advisor-highlight');
  // reflow, щоб анімація перезапустилась при повторному кліку
  void el.offsetWidth;
  el.classList.add('advisor-highlight');
  window.setTimeout(() => el.classList.remove('advisor-highlight'), 1700);
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
        description: 'Профілі з фото отримують значно більше записів від нових клієнтів.',
        target: 'hero',
      });
    }

    if (data.bio.length < 20) {
      t.push({
        id: 'bio',
        type: 'warning',
        title: 'Короткий опис',
        description: 'Розкажіть про свій досвід та техніки — клієнти обирають за описом.',
        target: 'identity',
      });
    }

    if (!data.instagram) {
      t.push({
        id: 'social',
        type: 'info',
        title: 'Підключіть Instagram',
        description: 'Майстри з підключеним Instagram отримують більше довіри.',
        target: 'technical',
      });
    }

    if (data.categories.length === 0) {
      t.push({
        id: 'cats',
        type: 'warning',
        title: 'Оберіть спеціалізацію',
        description: 'Допоможе клієнтам знайти вас у каталозі за фільтром.',
        target: 'categories',
      });
    }

    if (t.length === 0) {
      t.push({
        id: 'perfect',
        type: 'success',
        title: 'Профіль повністю заповнений',
        description: 'Усі рекомендації виконано. Ви готові до нових записів.',
      });
    }

    return t;
  }, [data]);

  const hero = tips[0];
  const rest = tips.slice(1);
  const issueCount = tips.filter(t => t.type !== 'success').length;
  const doneCount = 4 - issueCount;
  const progress = Math.round((doneCount / 4) * 100);
  const allDone = hero.type === 'success';

  const heroTint =
    hero.type === 'warning' ? 'bg-warning/[0.11] border-warning/25' :
    hero.type === 'success' ? 'bg-success/[0.10] border-success/25' :
    'bg-accent/[0.09] border-accent/20';

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
            <p className="text-[10px] font-bold text-accent">Ваш помічник</p>
          </div>
        </div>
        <button type="button"
          onClick={() => setShowExplanation(true)}
          aria-label="Як це працює?"
          className="size-9 rounded-2xl bg-secondary border border-border/80 flex items-center justify-center text-text-sub hover:text-accent active:scale-[0.88] cursor-pointer transition-all shadow-sm"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Progress — honest, demoted (no vanity hero-metric) */}
      <div className="flex flex-col gap-2 px-0.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold text-text-sub">Заповненість профілю</span>
          <span className="text-sm font-bold text-text-primary">
            <span className="metric-value">{doneCount}</span>
            <span className="text-text-sub"> / 4</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Заповненість профілю"
          className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden"
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring' as const, damping: 20 }}
            className={cn('h-full rounded-full', progress === 100 ? 'bg-success' : 'bg-accent')}
          />
        </div>
      </div>

      {/* HERO — the one next action (or done state) */}
      {allDone ? (
        <div className={cn('flex-1 flex flex-col items-center justify-center text-center gap-3 rounded-2xl border p-6', heroTint)}>
          <CheckCircle2 size={38} strokeWidth={1.4} className="text-success" />
          <div>
            <p className="text-sm font-bold text-text-primary">{hero.title}</p>
            <p className="text-xs text-text-sub leading-relaxed mt-1">{hero.description}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 flex-1">
          <AnimatePresence mode="popLayout">
            <motion.button
              type="button"
              key={hero.id}
              onClick={() => hero.target && jumpToSection(hero.target)}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className={cn(
                'group text-left w-full p-4 rounded-2xl border flex flex-col gap-2.5 cursor-pointer',
                'hover:brightness-[0.99] active:scale-[0.99] transition-all',
                heroTint
              )}
            >
              <div className="flex items-center gap-2">
                {TIP_ICON[hero.type]}
                <span className="text-[10px] font-bold text-text-sub">Наступний крок</span>
              </div>
              <span className="text-base font-bold text-text-primary leading-snug">{hero.title}</span>
              <p className="text-xs text-text-sub leading-relaxed">{hero.description}</p>
              <span className="flex items-center gap-1 text-xs font-bold text-accent mt-0.5">
                Перейти до розділу
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </motion.button>
          </AnimatePresence>

          {/* Remaining steps — compact, clickable */}
          {rest.map((tip) => (
            <button
              type="button"
              key={tip.id}
              onClick={() => tip.target && jumpToSection(tip.target)}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border text-left w-full hover:border-accent/30 active:scale-[0.99] cursor-pointer transition-all"
            >
              {TIP_ICON[tip.type]}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">{tip.title}</p>
                <p className="text-[11px] text-text-sub truncate">{tip.description}</p>
              </div>
              <ChevronRight size={15} className="text-text-sub shrink-0 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      )}

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
            <div className="space-y-4 overflow-y-auto text-xs text-text-sub leading-relaxed flex-1">
              <p><strong className="text-text-primary">Персональний помічник BookIT</strong> — аналізує ваш профіль і підказує, що заповнити далі. Тапніть крок — і опинитесь одразу в потрібному розділі.</p>
              <p><strong className="text-text-primary">Заповненість профілю</strong> — скільки ключового вже готово: фото, опис, соцмережі, спеціалізації.</p>
              <p><strong className="text-text-primary">Навіщо це</strong> — заповнений профіль викликає більше довіри, тож клієнти частіше доводять запис до кінця. А позиція в каталозі росте від реальних відгуків і записів.</p>
            </div>
            <button type="button"
              onClick={() => setShowExplanation(false)}
              className="mt-5 py-3.5 rounded-2xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] font-bold text-xs active:scale-[0.95] cursor-pointer transition-all"
            >
              Зрозуміло
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
