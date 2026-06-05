'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, TrendingUp, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface StoryItem {
  id: string;
  type: 'growth' | 'anomaly' | 'pricing' | 'general';
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  icon?: React.ReactNode;
}

interface HeroStoryProps {
  stories: StoryItem[];
}

const SPRING = { type: 'spring' as const, stiffness: 100, damping: 20 };

export function HeroStory({ stories }: HeroStoryProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  const activeStory = useMemo(() => stories[currentIdx] ?? null, [stories, currentIdx]);

  // Ефект авто-перемикання слайдів
  useEffect(() => {
    if (stories.length <= 1 || !isExpanded) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const intervalTime = 80; // оновлення кожні 80ms
    const totalDuration = 8000; // 8s на слайд
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIdx((idx) => (idx + 1) % stories.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [stories, currentIdx, isExpanded]);

  if (stories.length === 0) return null;

  const handleNext = () => {
    setCurrentIdx((idx) => (idx + 1) % stories.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIdx((idx) => (idx - 1 + stories.length) % stories.length);
    setProgress(0);
  };

  return (
    <div className="w-full relative z-30">
      <AnimatePresence mode="popLayout">
        {isExpanded ? (
          <motion.div
            key="expanded-story"
            layoutId="hero-story-container"
            className="bento-card p-6 relative overflow-hidden bg-gradient-to-br from-primary/[0.08] via-secondary/70 to-secondary border border-border-strong select-none flex flex-col justify-between min-h-[220px] md:min-h-[240px]"
            transition={SPRING}
          >
            {/* Декоративні фонові круги */}
            <div className="absolute -top-12 -right-12 size-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 size-28 bg-warning/8 rounded-full blur-2xl pointer-events-none" />

            {/* Прогрес-бары зверху */}
            {stories.length > 1 && (
              <div className="flex gap-1.5 w-full mb-5 relative z-10">
                {stories.map((_, i) => (
                  <div key={i} className="h-1 flex-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-75"
                      style={{
                        width: i === currentIdx ? `${progress}%` : i < currentIdx ? '100%' : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Вміст Stories */}
            <AnimatePresence mode="popLayout">
              {activeStory && (
                <motion.div
                  key={activeStory.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3 relative z-10 flex-1 justify-between"
                >
                  <div className="flex flex-col gap-2">
                    {/* Eyebrow & Icon */}
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        {activeStory.icon ?? <Sparkles size={14} />}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                        {activeStory.type === 'growth' && 'Зростання'}
                        {activeStory.type === 'anomaly' && 'Аномалія'}
                        {activeStory.type === 'pricing' && 'Розумна ціна'}
                        {activeStory.type === 'general' && 'Огляд'}
                      </span>
                    </div>

                    {/* Headline */}
                    <h2 className="heading-serif text-lg md:text-xl font-bold text-foreground leading-snug mt-1 max-w-[90%]">
                      {activeStory.title}
                    </h2>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground max-w-[85%] leading-relaxed">
                      {activeStory.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4">
                    {activeStory.ctaLabel && activeStory.ctaHref ? (
                      <Link
                        href={activeStory.ctaHref}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/90 transition-colors cursor-pointer group"
                      >
                        {activeStory.ctaLabel}
                        <ArrowRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <div />
                    )}

                    {/* Кнопки перемикання (для десктопа) */}
                    {stories.length > 1 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handlePrev}
                          className="size-7 rounded-full bg-secondary/80 hover:bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          className="size-7 rounded-full bg-secondary/80 hover:bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer"
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          // Згорнутий Dynamic Island Chip у верхньому кутку сторінки
          <motion.button
            key="collapsed-chip"
            layoutId="hero-story-container"
            onClick={() => setIsExpanded(true)}
            className="fixed top-16 right-4 h-11 px-4 rounded-full bg-primary text-accent-on shadow-lg flex items-center gap-2 z-40 border border-primary/20 active:scale-95 cursor-pointer font-semibold text-xs transition-transform"
            transition={SPRING}
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>Інсайти</span>
            <span className="bg-accent-on text-primary rounded-full size-4 flex items-center justify-center text-[10px] font-bold">
              {stories.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
