'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import type { StoryItem } from './HeroStory';
import type { OverviewDetail } from './OverviewDetailSheet';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BriefingMetric {
  label: string;
  value: string;
  delta?: number | null;
  /** Деталі по кліку (розширений огляд / пояснення) — будує parent */
  detail?: OverviewDetail;
}

interface OverviewBriefingProps {
  /** Період-«випуск», напр. «Червень 2026» */
  periodLabel: string;
  /** Виручка у гривнях (період) */
  revenue: number;
  /** Δ виручки до минулого періоду (%), Pro-only */
  revenueDelta?: number | null;
  /** Вторинні метрики для «by the numbers» стрічки */
  secondary: BriefingMetric[];
  /** Інсайти-історії з дією (вже відфільтровані) */
  stories: StoryItem[];
  isPro: boolean;
  /** Клік по метриці → деталі */
  onOpenDetail?: (d: OverviewDetail) => void;
  /** Деталі виручки (розбивка по категоріях) — будує parent */
  revenueDetail?: OverviewDetail;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 120, damping: 22 };
const STORY_DURATION = 7000;

const TYPE_LABEL: Record<StoryItem['type'], string> = {
  growth: 'Зростання',
  anomaly: 'Сигнал',
  pricing: 'Розумна ціна',
  general: 'Підсумок',
};

/** Δ-чіп на темному slate-блоці (світлі тінти для контрасту на #0F172A) */
function DeltaChip({ delta, tone = 'dark' }: { delta: number; tone?: 'dark' | 'light' }) {
  const up = delta > 0;
  const flat = delta === 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold leading-none tabular-nums',
        tone === 'dark'
          ? cn(up && 'text-emerald-300', !up && !flat && 'text-rose-300', flat && 'text-white/55')
          : cn(up && 'text-success', !up && !flat && 'text-error', flat && 'text-text-tertiary'),
      )}
    >
      {!flat && <Icon size={13} strokeWidth={2.5} />}
      {up ? '+' : ''}{delta}%
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * «Випуск» — редакційна обкладинка зведення аналітики (M-ANL-01).
 * Темний slate hero-блок: masthead період → виручка serif-домінанта + Δ →
 * провідний інсайт-з-дією → «by the numbers» стрічка вторинних метрик.
 * Замінює пласкі 4 KPI + порожній HeroStory одним щільним editorial-блоком.
 */
export function OverviewBriefing({
  periodLabel,
  revenue,
  revenueDelta,
  secondary,
  stories,
  isPro,
  onOpenDetail,
  revenueDetail,
}: OverviewBriefingProps) {
  const revenueClickable = !!(onOpenDetail && revenueDetail);
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafStories = stories.length;

  // Серифне число + ₴ окремо (Cormorant не має гліфа ₴)
  const revenueNumber = useMemo(() => Math.round(revenue).toLocaleString('uk-UA'), [revenue]);

  // Авто-ротація інсайтів (пауза при reduced-motion або одному інсайті)
  const idxRef = useRef(idx);
  idxRef.current = idx;
  useEffect(() => {
    if (rafStories <= 1 || reduce) { setProgress(0); return; }
    setProgress(0);
    const tick = 60;
    const stepPct = (tick / STORY_DURATION) * 100;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIdx(i => (i + 1) % rafStories);
          return 0;
        }
        return prev + stepPct;
      });
    }, tick);
    return () => clearInterval(timer);
  }, [rafStories, reduce]);

  const active = stories[idx] ?? null;
  const hasInsight = isPro && active !== null;

  return (
    <section
      className="relative overflow-hidden rounded-[var(--card-radius)] text-[var(--accent-on)]"
      style={{ background: 'var(--hero-card-bg)', boxShadow: 'var(--hero-card-shadow)' }}
      aria-label="Зведення за період"
    >
      {/* Аврора-підсвітка (тонка, не glassmorphism) */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full blur-3xl" style={{ background: 'rgba(99,102,241,0.28)' }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full blur-3xl" style={{ background: 'rgba(139,92,246,0.18)' }} />

      <div className="relative z-10 p-6 md:p-8">
        {/* ── Masthead ── */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/12">
          <h2 className="heading-serif text-lg md:text-xl text-white/90 leading-none">Зведення</h2>
          <span className="text-xs font-medium text-white/55 tabular-nums">{periodLabel}</span>
        </div>

        {/* ── Cover: виручка + інсайт ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 lg:gap-10 pt-6">
          {/* Ліворуч: виручка-домінанта (клік → розбивка) */}
          <button
            type="button"
            onClick={() => revenueClickable && onOpenDetail!(revenueDetail!)}
            disabled={!revenueClickable}
            className="flex flex-col justify-center text-left w-full group cursor-pointer disabled:cursor-default"
          >
            <p className="text-[13px] font-medium text-white/55 mb-1.5 flex items-center gap-1.5">
              Виручка за період
              {revenueClickable && <ArrowRight size={12} className="opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all" />}
            </p>
            <div className="flex items-end gap-2.5 flex-wrap">
              <span className="heading-serif leading-[0.9] text-[clamp(2.75rem,7vw,4.5rem)] text-white tracking-tight">
                {revenueNumber}
              </span>
              <span className="text-2xl md:text-3xl font-medium text-white/70 mb-1.5">₴</span>
              {isPro && revenueDelta !== undefined && revenueDelta !== null && (
                <span className="mb-2.5">
                  <DeltaChip delta={revenueDelta} />
                </span>
              )}
            </div>
            {isPro && revenueDelta !== undefined && revenueDelta !== null && (
              <p className="text-xs text-white/55 mt-1.5">
                {revenueDelta > 0 ? 'Зростання' : revenueDelta < 0 ? 'Спад' : 'Без змін'} до минулого періоду
              </p>
            )}
          </button>

          {/* Праворуч: провідний інсайт-з-дією */}
          {hasInsight ? (
            <div className="flex flex-col justify-center min-h-[120px] lg:border-l lg:border-white/12 lg:pl-10">
              {/* Прогрес-індикатори */}
              {rafStories > 1 && (
                <div className="flex gap-1.5 mb-4">
                  {stories.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setIdx(i); setProgress(0); }}
                      aria-label={`Інсайт ${i + 1}`}
                      className="h-1 flex-1 rounded-full bg-white/15 overflow-hidden cursor-pointer"
                    >
                      <span
                        className="block h-full rounded-full bg-white/85"
                        style={{ width: i === idx ? `${progress}%` : i < idx ? '100%' : '0%' }}
                      />
                    </button>
                  ))}
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active!.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex size-6 items-center justify-center rounded-lg bg-white/12 text-white">
                      {active!.icon}
                    </span>
                    <span className="text-[11px] font-semibold text-white/55">{TYPE_LABEL[active!.type]}</span>
                  </div>
                  <p className="heading-serif text-xl md:text-2xl leading-snug text-white text-balance">
                    {active!.title}
                  </p>
                  <p className="text-[13px] text-white/65 leading-relaxed mt-2 max-w-[46ch]">
                    {active!.description}
                  </p>
                  {active!.ctaLabel && active!.ctaHref && (
                    <Link
                      href={active!.ctaHref}
                      className="group mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white hover:text-white/90 transition-colors"
                    >
                      {active!.ctaLabel}
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            // Starter / без інсайтів: тиха обіцянка, не порожнеча
            <div className="hidden lg:flex flex-col justify-center border-l border-white/12 pl-10">
              <p className="heading-serif text-xl text-white/80 leading-snug max-w-[34ch]">
                {isPro ? 'Більше записів, точніші підказки, що рухають виручку.' : 'Розумні підказки з діями доступні на тарифі Pro.'}
              </p>
            </div>
          )}
        </div>

        {/* ── By the numbers (клік → деталі/пояснення) ── */}
        <div className="mt-7 pt-5 border-t border-white/12 grid grid-cols-3 divide-x divide-white/12">
          {secondary.map((m, i) => {
            const clickable = !!(onOpenDetail && m.detail);
            return (
            <button
              type="button"
              key={m.label}
              onClick={() => clickable && onOpenDetail!(m.detail!)}
              disabled={!clickable}
              className={cn('flex flex-col text-left group cursor-pointer disabled:cursor-default', i === 0 ? 'pr-4' : 'px-4', i === secondary.length - 1 && 'pr-0')}
            >
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="metric-value text-2xl md:text-[28px] text-white leading-none group-hover:text-white/85 transition-colors">{m.value}</span>
                {m.delta !== undefined && m.delta !== null && <DeltaChip delta={m.delta} />}
              </div>
              <span className="text-[11px] md:text-xs font-medium text-white/55 mt-1.5">{m.label}</span>
            </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
