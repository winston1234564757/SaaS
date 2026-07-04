'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Clipboard, Check, AlertTriangle, PackageCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useAnalyticsExtras, type StockForecastItem } from '@/lib/supabase/hooks/useAnalyticsExtras';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { BentoCell } from '../../primitives/BentoCell';
import { SectionHeading } from '../OverviewTab';
import type { OverviewDetail } from '../OverviewDetailSheet';

interface StockTabProps {
  start: string;
  end: string;
  isPro: boolean;
  onOpenDetail: (d: OverviewDetail) => void;
}

type Severity = 'critical' | 'warning' | 'normal';

function severityOf(daysLeft: number): Severity {
  if (daysLeft <= 3) return 'critical';
  if (daysLeft <= 7) return 'warning';
  return 'normal';
}

// Тон-кольори: дрібний текст a11y-safe (≥4.5 на periwinkle), точки = графіка (3:1)
const TONE: Record<Severity, { dot: string; eyebrow: string; daysBig: string; label: string }> = {
  critical: { dot: 'bg-destructive', eyebrow: 'text-destructive', daysBig: 'text-destructive', label: 'Терміново поповнити' },
  warning: { dot: 'bg-warning', eyebrow: 'text-[#92400E]', daysBig: 'text-warning', label: 'Скоро закінчиться' },
  normal: { dot: 'bg-success', eyebrow: 'text-[#0D6B2F]', daysBig: 'text-foreground', label: 'Склад під контролем' },
};

function daysText(daysLeft: number): string {
  return daysLeft >= 999 ? 'Без ліміту' : `${daysLeft} ${pluralUk(daysLeft, 'день', 'дні', 'днів')}`;
}

function itemDetail(item: StockForecastItem): OverviewDetail {
  const cost = item.cost_kopecks != null ? formatPrice(Math.round(item.cost_kopecks / 100)) : '—';
  return {
    title: item.product_name,
    eyebrow: 'Розхідник',
    hero: { label: 'Вистачить на', value: daysText(item.predicted_days_left) },
    rows: [
      { label: 'Поточний запас', value: `${item.stock_qty} шт` },
      { label: 'Витрата за 30 днів', value: `${item.used_qty_past_30_days} шт` },
      { label: 'Потрібно на 14 днів', value: `${item.required_qty_14_days} шт`, tone: 'primary' },
      { label: 'Собівартість', value: cost },
    ],
    note: 'Прогноз рахується за темпом витрати за останні 14 днів записів.',
    cta: { label: 'Поповнити запас', href: `/dashboard/products?tab=consumables&restockId=${item.product_id}` },
  };
}

export function StockTab({ start, end, isPro, onOpenDetail }: StockTabProps) {
  const { data, isLoading } = useAnalyticsExtras({ start, end, isPro, scope: 'stock', enabled: isPro });

  if (!isPro) {
    return (
      <div className="p-8 rounded-[var(--card-radius)] bg-secondary/20 border border-border/10 text-center flex flex-col items-center justify-center min-h-[300px]">
        <ShoppingBag className="size-12 text-primary mb-4" />
        <h3 className="heading-serif text-2xl text-foreground mb-2">Прогнози складу — у Pro</h3>
        <p className="text-sm text-text-sub max-w-sm">
          Підключіть Pro, щоб бачити автоматичні прогнози закінчення розхідників на основі вашого розкладу.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonCell variant="flat" className="h-[300px]" />;
  }

  const items = data?.stock_forecast ?? [];

  // Empty-стан БЕЗ фейк-чисел: skeleton-силует + чесний teaser
  if (items.length === 0) {
    return (
      <div className="relative w-full">
        <div aria-hidden className="grid grid-cols-1 lg:grid-cols-12 gap-4 opacity-50">
          <div className="lg:col-span-7"><div className="h-[180px] rounded-[var(--card-radius)] bg-secondary/50" /></div>
          <div className="lg:col-span-5"><div className="h-[180px] rounded-[var(--card-radius)] bg-secondary/50" /></div>
          <div className="lg:col-span-12 flex flex-col gap-2.5 mt-1">
            {[0, 1, 2].map(i => <div key={i} className="h-12 rounded-2xl bg-secondary/40" />)}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="bento-card p-8 flex flex-col items-center justify-center text-center max-w-md">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-5 border border-primary/15">
              <ShoppingBag size={28} />
            </div>
            <h3 className="heading-serif text-2xl text-foreground mb-2">Склад та прогнози</h3>
            <p className="text-sm text-text-sub leading-relaxed">
              Коли ви почнете списувати витратні матеріали, BookIT порахує темп витрати й нагадає про закупівлю заздалегідь.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <StockTabView items={items} onOpenDetail={onOpenDetail} />;
}

/** Чиста презентація (без fetch) — для прев'ю/тестів і верифікації власними очима */
export function StockTabView({
  items,
  onOpenDetail,
}: {
  items: StockForecastItem[];
  onOpenDetail: (d: OverviewDetail) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showList, setShowList] = useState(false);

  const sorted = [...items].sort((a, b) => a.predicted_days_left - b.predicted_days_left);
  const hero = sorted[0];
  const heroSev = severityOf(hero.predicted_days_left);
  const heroTone = TONE[heroSev];

  const criticalN = sorted.filter(i => i.predicted_days_left <= 3).length;
  const warningN = sorted.filter(i => i.predicted_days_left > 3 && i.predicted_days_left <= 7).length;
  const normalN = sorted.filter(i => i.predicted_days_left > 7).length;

  const lowStock = sorted.filter(
    i => i.predicted_days_left <= 7 || (i.stock_alert_threshold != null && i.stock_qty <= i.stock_alert_threshold),
  );

  const handleCopy = () => {
    const text = lowStock
      .map(i => `- ${i.product_name}: залишилось ${i.stock_qty} шт, вистачить на ${daysText(i.predicted_days_left)}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
      {/* ── Світлий герой: найтерміновіший дефіцит ── */}
      <div className="lg:col-span-7 min-w-0">
        <BentoCell className="h-full p-5">
          <button
            type="button"
            onClick={() => onOpenDetail(itemDetail(hero))}
            className="text-left w-full cursor-pointer group"
          >
            <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold mb-3', heroTone.eyebrow)}>
              <span className={cn('size-1.5 rounded-full', heroTone.dot)} />
              {heroTone.label}
            </span>

            <h4 className="heading-serif text-[26px] leading-tight text-foreground truncate group-hover:text-primary transition-colors">
              {hero.product_name}
            </h4>
            <div className="flex items-baseline gap-2.5 mt-2">
              <span className={cn('metric-value font-semibold leading-[0.9] text-[clamp(2.5rem,6vw,3.75rem)] tracking-tight', heroTone.daysBig)}>
                {hero.predicted_days_left >= 999 ? '∞' : hero.predicted_days_left}
              </span>
              <span className="text-sm font-medium text-text-sub mb-1.5">
                {hero.predicted_days_left >= 999 ? 'без ліміту' : `${pluralUk(hero.predicted_days_left, 'день', 'дні', 'днів')} · вистачить запасу`}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 divide-x divide-border-strong/40 rounded-2xl bg-primary/[0.05] border border-primary/10">
              {[
                { label: 'Запас', value: `${hero.stock_qty} шт` },
                { label: 'Витрата за місяць', value: `${hero.used_qty_past_30_days} шт` },
                { label: 'Прогноз', value: daysText(hero.predicted_days_left) },
              ].map((m, i) => (
                <div key={m.label} className={i === 0 ? 'pr-3 pl-3.5 py-2.5' : 'px-3 py-2.5'}>
                  <p className="text-[10px] text-text-sub mb-0.5">{m.label}</p>
                  <p className="metric-value text-[15px] font-semibold text-foreground">{m.value}</p>
                </div>
              ))}
            </div>

            <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary group-hover:gap-2.5 transition-all">
              Поповнити запас
              <ArrowRight size={14} />
            </span>
          </button>
        </BentoCell>
      </div>

      {/* ── Світлофор + список покупок ── */}
      <div className="lg:col-span-5 min-w-0">
        <BentoCell className="h-full p-5 flex flex-col">
          {/* Світлофор */}
          <div className="grid grid-cols-3 divide-x divide-border-strong/40 pb-4 border-b border-border-strong/45">
            {[
              { label: 'Критичні', value: criticalN, dot: 'bg-destructive' },
              { label: 'Увага', value: warningN, dot: 'bg-warning' },
              { label: 'У нормі', value: normalN, dot: 'bg-success' },
            ].map((s, i) => (
              <div key={s.label} className={cn('flex flex-col', i === 0 ? 'pr-3' : 'px-3', i === 2 && 'pr-0')}>
                <span className="metric-value text-2xl font-semibold text-foreground leading-none">{s.value}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-text-sub mt-1.5">
                  <span className={cn('size-1.5 rounded-full', s.dot)} />
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Список покупок */}
          <div className="pt-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Список покупок</p>
                <p className="text-[11px] text-text-sub mt-0.5">
                  {lowStock.length} {pluralUk(lowStock.length, 'товар', 'товари', 'товарів')} до закупівлі
                </p>
              </div>
              {lowStock.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowList(v => !v)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-xs font-semibold cursor-pointer active:scale-[0.95] transition-transform flex-shrink-0"
                >
                  <ShoppingBag size={13} />
                  {showList ? 'Сховати' : 'Сформувати список'}
                </button>
              )}
            </div>

            <AnimatePresence>
              {showList && lowStock.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-2xl bg-secondary/40 border border-border/15 flex flex-col gap-3 overflow-hidden"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-foreground">До закупівлі</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[11px] text-primary font-semibold cursor-pointer hover:underline"
                    >
                      {copied ? <Check size={12} /> : <Clipboard size={12} />}
                      {copied ? 'Скопійовано' : 'Копіювати'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-text-sub">
                    {lowStock.map((i, idx) => (
                      <div key={idx}>{i.product_name} — {i.stock_qty} шт ({daysText(i.predicted_days_left)})</div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {lowStock.length === 0 && (
              <div className="mt-4 flex items-center gap-2 text-[13px] text-[#0D6B2F]">
                <PackageCheck size={16} />
                Усе в нормі, закуповувати поки нічого.
              </div>
            )}
          </div>
        </BentoCell>
      </div>

      {/* ── Усі розхідники: ранг за терміновістю ── */}
      <div className="lg:col-span-12 min-w-0">
        <BentoCell className="p-5">
          <SectionHeading title="Усі розхідники" subtitle="За терміновістю поповнення" />
          <div className="flex flex-col">
            {sorted.map((item) => {
              const sev = severityOf(item.predicted_days_left);
              const tone = TONE[sev];
              return (
                <button
                  type="button"
                  key={item.product_id}
                  onClick={() => onOpenDetail(itemDetail(item))}
                  className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0 text-left w-full cursor-pointer group"
                >
                  <span className={cn('size-2 rounded-full flex-shrink-0', tone.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{item.product_name}</span>
                      <span className="metric-value text-sm font-semibold text-foreground flex-shrink-0 tabular-nums">{daysText(item.predicted_days_left)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-[11px] text-text-sub">Запас {item.stock_qty} шт</span>
                      {sev !== 'normal' && (
                        <span className={cn('text-[11px] font-medium', tone.eyebrow)}>{sev === 'critical' ? 'Терміново' : 'Скоро'}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </BentoCell>
      </div>
    </div>
  );
}
