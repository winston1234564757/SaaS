'use client';

import React from 'react';
import { ArrowRight, Zap, Users, Flame, Send, UserPlus, Award, Layers, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';
import type { WinbackCandidate, CohortPoint } from '@/lib/supabase/hooks/useAnalyticsExtras';
import type { ServicePair } from '../../charts/ServicePairingMatrix';
import { BentoCell } from '../../primitives/BentoCell';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { EmptyCell } from '../../primitives/EmptyCell';
import { CohortHeatmap } from '../../charts/CohortHeatmap';
import { SectionHeading } from '../OverviewTab';
import type { OverviewDetail } from '../OverviewDetailSheet';

export interface GrowthData {
  rangeLabel: string;
  upliftKopecks: number;
  ruleCounts: Record<string, number>;
  savedSlots: number;
  concentrationPct: number;
  ltvDistribution: Record<string, number>;
  winbackCandidates: WinbackCandidate[];
  servicePairs: ServicePair[];
  cohortMatrix: CohortPoint[];
  flash: { total: number; claimed: number };
  broadcast: { sent: number; opened: number; converted: number };
  loyalty: { activeMembers: number; totalVisits: number };
  referral: { totalSent: number; signedUp: number; activated: number };
}

interface GrowthTabProps extends GrowthData {
  isPro: boolean;
  isLoading: boolean;
  hasData: boolean;
  onOpenClient: (name: string, phone: string) => void;
  onOpenDetail: (d: OverviewDetail) => void;
}

const RULE_LABELS: Record<string, string> = {
  peak: 'Пікові години',
  quiet: 'Тихі години',
  early_bird: 'Раннє бронювання',
  last_minute: 'Остання хвилина',
};

const LTV_LABELS: Record<string, string> = {
  under_1k: 'До 1 000 ₴',
  '1k_3k': '1 000 – 3 000 ₴',
  '3k_7k': '3 000 – 7 000 ₴',
  above_7k: 'Понад 7 000 ₴',
};
const LTV_ORDER = ['under_1k', '1k_3k', '3k_7k', 'above_7k'];

const grn = (kopecks: number) => Math.round(kopecks / 100);

export function GrowthTab(props: GrowthTabProps) {
  const { isPro, isLoading, hasData } = props;

  if (!isPro) {
    return (
      <div className="p-8 rounded-[var(--card-radius)] bg-secondary/20 border border-border/10 text-center flex flex-col items-center justify-center min-h-[300px]">
        <TrendingUp className="size-12 text-primary mb-4" />
        <h3 className="heading-serif text-2xl text-foreground mb-2">Двигуни росту — у Pro</h3>
        <p className="text-sm text-text-sub max-w-sm">
          Підключіть Pro, щоб бачити, що рухає виручку: розумні ціни, найцінніші клієнти, канали залучення та повернення.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonCell variant="flat" className="h-[400px]" />;
  }

  if (!hasData) {
    return (
      <EmptyCell
        title="Записів ще немає"
        description="Тут зʼявляться двигуни вашого росту: розумні ціни, найцінніші клієнти, канали залучення та когорти повернення."
        icon={<TrendingUp size={20} />}
      />
    );
  }

  return <GrowthTabView {...props} />;
}

// ── View ──────────────────────────────────────────────────────────────────────

/** Δ-чіп / тінт на темному slate-герої */
export function GrowthTabView({
  rangeLabel,
  upliftKopecks,
  ruleCounts,
  savedSlots,
  concentrationPct,
  ltvDistribution,
  winbackCandidates,
  servicePairs,
  cohortMatrix,
  flash,
  broadcast,
  loyalty,
  referral,
  onOpenClient,
  onOpenDetail,
}: GrowthData & {
  onOpenClient: (name: string, phone: string) => void;
  onOpenDetail: (d: OverviewDetail) => void;
}) {
  const rulesList = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]);
  const totalRuleHits = rulesList.reduce((s, [, c]) => s + c, 0);
  const hasUplift = upliftKopecks > 0;

  // ── Hero detail (розбивка надбавки) ──
  const upliftDetail: OverviewDetail = {
    title: 'Додатковий дохід від розумних цін',
    eyebrow: rangeLabel,
    hero: { label: 'Надбавка за період', value: `+${formatPrice(grn(upliftKopecks))}` },
    rows: [
      ...rulesList.map(([rule, count]) => ({ label: RULE_LABELS[rule] ?? rule, value: `${count} ×` })),
      ...(savedSlots > 0 ? [{ label: 'Врятовані слоти', value: String(savedSlots), tone: 'success' as const }] : []),
    ],
    note: 'Надбавка — це різниця між базовою та динамічною ціною на спрацьованих правилах. Гроші, які ви заробили без додаткових дій.',
    cta: { label: 'Налаштувати ціни', href: '/dashboard/revenue' },
  };

  const ltvDetail: OverviewDetail = {
    title: 'Концентрація виручки',
    eyebrow: 'Парето',
    hero: { label: 'Топ-20% клієнтів дають', value: `${concentrationPct}%` },
    note: 'Що вища концентрація, то сильніше виручка залежить від кількох клієнтів. Повертайте найцінніших, поки вони не охолонули.',
  };

  // ── LTV bars (static) ──
  const ltvTotal = LTV_ORDER.reduce((s, k) => s + (ltvDistribution[k] ?? 0), 0);
  const ltvMax = Math.max(...LTV_ORDER.map((k) => ltvDistribution[k] ?? 0), 1);

  // ── Канали залучення (диференційовані рядки) ──
  const flashConv = flash.total > 0 ? Math.round((flash.claimed / flash.total) * 100) : 0;
  const bcastConv = broadcast.sent > 0 ? Math.round((broadcast.converted / broadcast.sent) * 100) : 0;
  const channels = [
    { icon: Flame, name: 'Флеш-акції', value: String(flash.claimed), sub: flash.total > 0 ? `${flash.claimed}/${flash.total} заброньовано · ${flashConv}%` : 'Ще не запускали' },
    { icon: Send, name: 'Розсилки', value: String(broadcast.converted), sub: broadcast.sent > 0 ? `${broadcast.converted} записів з ${broadcast.sent} · ${bcastConv}%` : 'Ще не робили' },
    { icon: UserPlus, name: 'Реферали', value: String(referral.activated), sub: referral.totalSent > 0 ? `${referral.activated} активовано з ${referral.totalSent}` : 'Ще немає запрошень' },
    { icon: Award, name: 'Постійні клієнти', value: String(loyalty.activeMembers), sub: `${loyalty.totalVisits} ${pluralUk(loyalty.totalVisits, 'візит', 'візити', 'візитів')} сумарно` },
  ];

  // ── Cross-sell pairs (static) ──
  const pairMax = Math.max(...servicePairs.map((p) => p.pair_count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* ── Темний герой: двигуни росту ── */}
      <div className="lg:col-span-12 min-w-0">
        <section
          className="relative overflow-hidden rounded-[var(--card-radius)] text-[var(--accent-on)]"
          style={{ background: 'var(--hero-card-bg)', boxShadow: 'var(--hero-card-shadow)' }}
          aria-label="Двигуни росту за період"
        >
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full blur-3xl" style={{ background: 'rgba(99,102,241,0.28)' }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full blur-3xl" style={{ background: 'rgba(16,185,129,0.16)' }} />

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/12">
              <h2 className="heading-serif text-lg md:text-xl text-white/90 leading-none">Двигуни росту</h2>
              <span className="text-xs font-medium text-white/55 tabular-nums">{rangeLabel}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 lg:gap-10 pt-6 items-center">
              {/* Домінанта: розумні ціни (надбавка) або fallback на LTV */}
              {hasUplift ? (
                <button
                  type="button"
                  onClick={() => onOpenDetail(upliftDetail)}
                  className="flex flex-col justify-center text-left w-full group cursor-pointer"
                >
                  <p className="text-[13px] font-medium text-white/55 mb-1.5 flex items-center gap-1.5">
                    <Zap size={13} /> Додатковий дохід від розумних цін
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </p>
                  <div className="flex items-end gap-2.5 flex-wrap">
                    <span className="metric-value leading-[0.9] text-[clamp(2.5rem,6.5vw,4.25rem)] tracking-tight text-white">
                      +{grn(upliftKopecks).toLocaleString('uk-UA')}
                    </span>
                    <span className="text-2xl md:text-3xl font-medium text-white/70 mb-1.5">₴</span>
                  </div>
                  <p className="text-xs text-white/55 mt-1.5">
                    {savedSlots > 0 ? `${savedSlots} ${pluralUk(savedSlots, 'врятований слот', 'врятовані слоти', 'врятованих слотів')} · ` : ''}
                    {totalRuleHits} {pluralUk(totalRuleHits, 'спрацювання', 'спрацювання', 'спрацювань')} правил
                  </p>
                </button>
              ) : (
                <div className="flex flex-col justify-center">
                  <p className="text-[13px] font-medium text-white/55 mb-1.5 flex items-center gap-1.5"><Users size={13} /> Концентрація виручки</p>
                  <div className="flex items-end gap-2.5 flex-wrap">
                    <span className="metric-value leading-[0.9] text-[clamp(2.5rem,6.5vw,4.25rem)] tracking-tight text-white">{concentrationPct}%</span>
                  </div>
                  <p className="text-xs text-white/55 mt-1.5">виручки приносять топ-20% клієнтів</p>
                  <a href="/dashboard/revenue" className="group mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white hover:text-white/90">
                    Увімкнути розумні ціни
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              )}

              {/* by the numbers */}
              <div className="grid grid-cols-3 divide-x divide-white/12 lg:border-l lg:border-white/12 lg:pl-10">
                {[
                  { label: 'Топ-20% частка', value: `${concentrationPct}%` },
                  { label: 'Флеш заброньовано', value: String(flash.claimed) },
                  { label: 'Розсилки → записи', value: String(broadcast.converted) },
                ].map((m, i) => (
                  <div key={m.label} className={cn('flex flex-col', i === 0 ? 'pr-3' : 'px-3', i === 2 && 'pr-0')}>
                    <span className="metric-value text-xl md:text-2xl text-white leading-none">{m.value}</span>
                    <span className="text-[11px] font-medium text-white/55 mt-1.5">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── LTV Парето: featured ── */}
      <div className="lg:col-span-7 min-w-0">
        <BentoCell className="h-full p-5">
          <button
            type="button"
            onClick={() => onOpenDetail(ltvDetail)}
            className="text-left w-full cursor-pointer group mb-4"
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary mb-3">
              <Users size={13} /> Хто приносить виручку
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="metric-value font-semibold leading-[0.9] text-[clamp(2.25rem,5vw,3rem)] tracking-tight text-foreground group-hover:text-primary transition-colors">
                {concentrationPct}%
              </span>
              <span className="text-sm font-medium text-text-sub mb-1.5">виручки дають топ-20% клієнтів</span>
            </div>
          </button>

          {/* LTV histogram (static) */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border-strong/45">
            {LTV_ORDER.map((key) => {
              const count = ltvDistribution[key] ?? 0;
              const pct = ltvTotal > 0 ? Math.round((count / ltvTotal) * 100) : 0;
              const fill = Math.max(2, Math.round((count / ltvMax) * 100));
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-foreground">{LTV_LABELS[key]}</span>
                    <span className="metric-value font-semibold text-foreground tabular-nums">
                      {count} <span className="text-text-sub font-normal">· {pct}%</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary/60 overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${fill}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Winback */}
          {winbackCandidates.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border-strong/45">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#92400E] mb-2.5">
                <TrendingUp size={12} /> Варто повернути
              </p>
              <div className="flex flex-col">
                {winbackCandidates.slice(0, 4).map((c, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => onOpenClient(c.client_name, c.client_phone)}
                    className="flex items-center justify-between gap-3 py-2.5 border-b border-border/30 last:border-0 text-left w-full cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{c.client_name}</p>
                      <p className="text-[11px] text-text-sub mt-0.5">
                        Немає {c.days_inactive} {pluralUk(c.days_inactive, 'день', 'дні', 'днів')} · LTV {formatPrice(grn(c.ltv))}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-primary flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </BentoCell>
      </div>

      {/* ── Канали залучення: ранг-список ── */}
      <div className="lg:col-span-5 min-w-0">
        <BentoCell className="h-full p-5">
          <SectionHeading title="Канали залучення" subtitle="Звідки приходять записи та клієнти" />
          <div className="flex flex-col">
            {channels.map((ch) => {
              const Icon = ch.icon;
              return (
                <div key={ch.name} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/[0.06] text-primary flex-shrink-0">
                    <Icon size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{ch.name}</span>
                      <span className="metric-value text-lg font-semibold text-foreground flex-shrink-0 leading-none">{ch.value}</span>
                    </div>
                    <p className="text-[11px] text-text-sub mt-0.5">{ch.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </BentoCell>
      </div>

      {/* ── Розумні ціни: розбивка правил ── */}
      <div className="lg:col-span-5 min-w-0">
        <BentoCell className="h-full p-5">
          <SectionHeading title="Спрацювання розумних цін" subtitle="Які правила приносять надбавку" />
          {totalRuleHits > 0 ? (
            <div className="flex flex-col">
              {rulesList.map(([rule, count]) => {
                const fill = Math.max(2, Math.round((count / Math.max(rulesList[0]?.[1] ?? 1, 1)) * 100));
                return (
                  <div key={rule} className="py-2.5 border-b border-border/30 last:border-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <span className="text-sm text-foreground">{RULE_LABELS[rule] ?? rule}</span>
                      <span className="metric-value text-sm font-semibold text-foreground tabular-nums">{count} ×</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary/60 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${fill}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-sub py-6 text-center">Правила розумних цін ще не спрацьовували за цей період.</p>
          )}
        </BentoCell>
      </div>

      {/* ── Cross-sell: пари послуг ── */}
      <div className="lg:col-span-7 min-w-0">
        <BentoCell className="h-full p-5">
          <SectionHeading title="Що бронюють разом" subtitle="Пари послуг для апсейлу" />
          {servicePairs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {servicePairs.slice(0, 5).map((p, i) => {
                const fill = Math.max(4, Math.round((p.pair_count / pairMax) * 100));
                return (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-foreground min-w-0 truncate">
                        <span className="font-medium">{p.service_a}</span>
                        <span className="text-text-sub"> + </span>
                        <span className="font-medium">{p.service_b}</span>
                      </span>
                      <span className="metric-value font-semibold text-foreground tabular-nums flex-shrink-0">
                        {p.pair_count} ×
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary/60 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${fill}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-8 text-text-sub">
              <Layers size={20} className="mb-2 text-text-sub" />
              <p className="text-sm max-w-xs">Поки замало спільних бронювань, щоб виявити пари послуг.</p>
            </div>
          )}
        </BentoCell>
      </div>

      {/* ── Когорти повернення ── */}
      {cohortMatrix.length > 0 && (
        <div className="lg:col-span-12 min-w-0">
          <BentoCell className="p-5">
            <SectionHeading title="Когорти повернення" subtitle="Частка повторних візитів нових клієнтів по місяцях" />
            <CohortHeatmap data={cohortMatrix} />
          </BentoCell>
        </div>
      )}
    </div>
  );
}
