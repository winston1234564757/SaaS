'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Wallet, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useAnalyticsExtras, type FinanceAnalytics, type FinanceServiceItem } from '@/lib/supabase/hooks/useAnalyticsExtras';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { BentoCell } from '../../primitives/BentoCell';
import { SectionHeading } from '../OverviewTab';
import type { OverviewDetail } from '../OverviewDetailSheet';

interface FinancesTabProps {
  start: string;
  end: string;
  isPro: boolean;
  rangeLabel: string;
  onOpenDetail: (d: OverviewDetail) => void;
}

const EMPTY_FIN: FinanceAnalytics = {
  services_revenue: 0,
  products_revenue: 0,
  materials_cost: 0,
  discount_amount: 0,
  operational_expenses_total: 0,
  net_profit: 0,
  services: [],
  products: [],
};

/** Зсуває [start,end] на один рівний період назад (для Δ-тренду) */
function previousWindow(start: string, end: string): { prevStart: string; prevEnd: string } {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end + 'T00:00:00Z');
  const lenDays = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
  const prevEnd = new Date(s.getTime() - 86_400_000);
  const prevStart = new Date(prevEnd.getTime() - (lenDays - 1) * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { prevStart: iso(prevStart), prevEnd: iso(prevEnd) };
}

const grn = (kopecks: number) => Math.round(kopecks / 100);

/** Розбивка маржі однієї послуги (клік у списку) */
function serviceMarginDetail(s: FinanceServiceItem): OverviewDetail {
  const profit = grn(s.revenue_kopecks - s.cost_kopecks);
  const low = s.margin_pct < 40;
  return {
    title: s.service_name,
    eyebrow: 'Послуга',
    hero: { label: 'Маржа', value: `${s.margin_pct}%` },
    rows: [
      { label: 'Виручка', value: formatPrice(grn(s.revenue_kopecks)) },
      { label: 'Собівартість розхідників', value: `-${formatPrice(grn(s.cost_kopecks))}`, tone: 'warning' },
      { label: 'Прибуток', value: formatPrice(profit), tone: 'success' },
      { label: 'Записів', value: String(s.bookings_count) },
    ],
    note: low
      ? 'Висока собівартість розхідників зменшує прибуток із кожного запису. Перегляньте ціну або склад матеріалів.'
      : 'Маржа здорова: ціна та собівартість у балансі.',
    cta: { label: 'Перейти до послуги', href: `/dashboard/services?edit=${s.service_id}` },
  };
}

export function FinancesTab({ start, end, isPro, rangeLabel, onOpenDetail }: FinancesTabProps) {
  const { data, isLoading } = useAnalyticsExtras({ start, end, isPro, scope: 'finances', enabled: isPro });

  const { prevStart, prevEnd } = previousWindow(start, end);
  const { data: prevData } = useAnalyticsExtras({
    start: prevStart,
    end: prevEnd,
    isPro,
    scope: 'finances',
    enabled: isPro,
  });

  if (!isPro) {
    return (
      <div className="p-8 rounded-[var(--card-radius)] bg-secondary/20 border border-border/10 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Wallet className="size-12 text-primary mb-4" />
        <h3 className="heading-serif text-2xl text-foreground mb-2">Фінансовий звіт — у Pro</h3>
        <p className="text-sm text-text-sub max-w-sm">
          Підключіть Pro, щоб бачити чистий прибуток, собівартість матеріалів і маржу кожної послуги.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonCell variant="flat" className="h-[350px]" />;
  }

  const fin = data?.finances ?? EMPTY_FIN;
  const hasData = fin.services_revenue > 0 || fin.products_revenue > 0;

  // Empty-стан БЕЗ фейк-чисел: skeleton-силует + чесний teaser
  if (!hasData) {
    return (
      <div className="relative w-full">
        <div aria-hidden className="flex flex-col gap-4 opacity-50">
          <div className="h-[200px] rounded-[var(--card-radius)] bg-secondary/50" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7"><div className="h-[220px] rounded-[var(--card-radius)] bg-secondary/40" /></div>
            <div className="lg:col-span-5"><div className="h-[220px] rounded-[var(--card-radius)] bg-secondary/40" /></div>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="bento-card p-8 flex flex-col items-center justify-center text-center max-w-md">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-5 border border-primary/15">
              <Wallet size={28} />
            </div>
            <h3 className="heading-serif text-2xl text-foreground mb-2">Фінансовий звіт</h3>
            <p className="text-sm text-text-sub leading-relaxed">
              Коли ви завершите перші записи з послугами, BookIT порахує чистий прибуток і маржу кожної послуги автоматично.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Δ чистого прибутку до минулого рівного періоду (Pro)
  const prevNet = prevData?.finances?.net_profit ?? null;
  const deltaNet =
    prevNet !== null && prevNet !== 0
      ? Math.round(((fin.net_profit - prevNet) / Math.abs(prevNet)) * 100)
      : null;

  return <FinancesTabView fin={fin} deltaNet={deltaNet} rangeLabel={rangeLabel} onOpenDetail={onOpenDetail} />;
}

/** Δ-чіп на темному slate-герої (світлі тінти для контрасту на #0F172A) */
function DarkDeltaChip({ delta }: { delta: number }) {
  const up = delta > 0;
  const flat = delta === 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold leading-none tabular-nums', up ? 'text-emerald-300' : flat ? 'text-white/55' : 'text-rose-300')}>
      {!flat && <Icon size={13} strokeWidth={2.5} />}
      {up ? '+' : ''}{delta}%
    </span>
  );
}

/** Чиста презентація (без fetch) — для прев'ю/тестів і верифікації власними очима */
export function FinancesTabView({
  fin,
  deltaNet,
  rangeLabel,
  onOpenDetail,
}: {
  fin: FinanceAnalytics;
  deltaNet: number | null;
  rangeLabel: string;
  onOpenDetail: (d: OverviewDetail) => void;
}) {
  const totalRevKop = fin.services_revenue + fin.products_revenue;
  const totalCostKop = fin.materials_cost + fin.discount_amount + fin.operational_expenses_total;
  const marginPct = totalRevKop > 0 ? Math.round((fin.net_profit / totalRevKop) * 100) : 0;
  const lossy = fin.net_profit < 0;

  // ── Чесний каскад руху грошей (нуль вигаданих чисел) ──
  const maxKop = Math.max(totalRevKop, 1);
  type Flow = { label: string; kop: number; kind: 'in' | 'sub' | 'out' | 'total' };
  const flow: Flow[] = ([
    { label: 'Виручка послуг', kop: fin.services_revenue, kind: 'in' },
    { label: 'Продажі товарів', kop: fin.products_revenue, kind: 'in' },
    { label: 'Загальна виручка', kop: totalRevKop, kind: 'sub' },
    { label: 'Собівартість розхідників', kop: fin.materials_cost, kind: 'out' },
    { label: 'Знижки та акції', kop: fin.discount_amount, kind: 'out' },
    { label: 'Операційні витрати', kop: fin.operational_expenses_total, kind: 'out' },
    { label: 'Чистий прибуток', kop: fin.net_profit, kind: 'total' },
  ] as Flow[]).filter((f) => f.kind === 'total' || f.kind === 'sub' || f.kop > 0);

  const BAR: Record<Flow['kind'], string> = {
    in: 'bg-[#16803C]/55',
    sub: 'bg-foreground/55',
    out: 'bg-destructive/55',
    total: 'bg-primary',
  };

  // ── Маржинальність послуг: найтонша маржа = герой ризику ──
  const services = [...fin.services].filter((s) => s.bookings_count > 0).sort((a, b) => a.margin_pct - b.margin_pct);
  const riskiest = services[0] ?? null;
  const restServices = services.slice(1);
  const riskLow = riskiest != null && riskiest.margin_pct < 40;

  const netProfitDetail: OverviewDetail = {
    title: 'Чистий прибуток',
    eyebrow: rangeLabel,
    hero: { label: 'За період', value: formatPrice(grn(fin.net_profit)) },
    rows: [
      { label: 'Виручка послуг', value: formatPrice(grn(fin.services_revenue)) },
      { label: 'Продажі товарів', value: formatPrice(grn(fin.products_revenue)) },
      { label: 'Собівартість розхідників', value: `-${formatPrice(grn(fin.materials_cost))}`, tone: 'warning' },
      { label: 'Знижки та акції', value: `-${formatPrice(grn(fin.discount_amount))}`, tone: 'warning' },
      { label: 'Операційні витрати', value: `-${formatPrice(grn(fin.operational_expenses_total))}`, tone: 'warning' },
      { label: 'Чиста маржа', value: `${marginPct}%`, tone: 'primary' },
    ],
    note: 'Прибуток рахується як виручка мінус собівартість матеріалів, знижки та операційні витрати за період.',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Темний герой: P&L-обкладинка ── */}
      <section
        className="relative overflow-hidden rounded-[var(--card-radius)] text-[var(--accent-on)]"
        style={{ background: 'var(--hero-card-bg)', boxShadow: 'var(--hero-card-shadow)' }}
        aria-label="Фінансовий підсумок за період"
      >
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full blur-3xl" style={{ background: 'rgba(99,102,241,0.28)' }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full blur-3xl" style={{ background: 'rgba(16,185,129,0.14)' }} />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/12">
            <h2 className="heading-serif text-lg md:text-xl text-white/90 leading-none">Фінансовий підсумок</h2>
            <span className="text-xs font-medium text-white/55 tabular-nums">{rangeLabel}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 lg:gap-10 pt-6 items-center">
            {/* Чистий прибуток — домінанта (клік → P&L-розбивка) */}
            <button
              type="button"
              onClick={() => onOpenDetail(netProfitDetail)}
              className="flex flex-col justify-center text-left w-full group cursor-pointer"
            >
              <p className="text-[13px] font-medium text-white/55 mb-1.5 flex items-center gap-1.5">
                Чистий прибуток
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all" />
              </p>
              <div className="flex items-end gap-2.5 flex-wrap">
                <span className={cn('metric-value leading-[0.9] text-[clamp(2.5rem,6.5vw,4.25rem)] tracking-tight', lossy ? 'text-rose-300' : 'text-white')}>
                  {grn(fin.net_profit).toLocaleString('uk-UA')}
                </span>
                <span className="text-2xl md:text-3xl font-medium text-white/70 mb-1.5">₴</span>
                {deltaNet !== null && <span className="mb-2.5"><DarkDeltaChip delta={deltaNet} /></span>}
              </div>
              <p className="text-xs text-white/55 mt-1.5">
                Чиста маржа {marginPct}%{deltaNet !== null ? (deltaNet > 0 ? ' · зростання до минулого періоду' : deltaNet < 0 ? ' · спад до минулого періоду' : ' · без змін') : ''}
              </p>
            </button>

            {/* by the numbers (виручка / витрати / маржа) */}
            <div className="grid grid-cols-3 divide-x divide-white/12 lg:border-l lg:border-white/12 lg:pl-10">
              {[
                { label: 'Виручка', value: formatPrice(grn(totalRevKop)) },
                { label: 'Витрати', value: `-${formatPrice(grn(totalCostKop))}` },
                { label: 'Чиста маржа', value: `${marginPct}%` },
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

      {/* ── Каскад + Маржа ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Чесний каскад руху грошей */}
        <div className="lg:col-span-7 min-w-0">
          <BentoCell className="h-full p-5">
            <SectionHeading title="Рух грошей" subtitle="Куди йде кожна гривня виручки" />
            <div className="flex flex-col gap-3.5">
              {flow.map((f) => {
                const widthPct = Math.max(2, Math.round((f.kop / maxKop) * 100));
                const isOut = f.kind === 'out';
                const isTotal = f.kind === 'total';
                const isSub = f.kind === 'sub';
                return (
                  <div key={f.label} className="flex items-center gap-3">
                    <span className={cn('text-xs w-36 flex-shrink-0 truncate', isTotal || isSub ? 'font-semibold text-foreground' : 'text-text-sub')}>
                      {f.label}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-secondary/40 overflow-hidden">
                      <div className={cn('h-full rounded-full', BAR[f.kind])} style={{ width: `${widthPct}%` }} />
                    </div>
                    <span
                      className={cn(
                        'metric-value text-xs font-semibold w-24 text-right flex-shrink-0 tabular-nums',
                        isTotal ? (lossy ? 'text-destructive' : 'text-foreground') : isOut ? 'text-destructive' : 'text-foreground',
                      )}
                    >
                      {isOut ? '-' : ''}{formatPrice(grn(f.kop))}
                    </span>
                  </div>
                );
              })}
            </div>
          </BentoCell>
        </div>

        {/* Маржинальність: герой ризику + ранг */}
        <div className="lg:col-span-5 min-w-0">
          <BentoCell className="h-full p-5 flex flex-col">
            <SectionHeading title="Маржинальність послуг" subtitle="Від найтоншої маржі" />

            {riskiest ? (
              <>
                {/* Герой ризику — найтонша маржа */}
                <button
                  type="button"
                  onClick={() => onOpenDetail(serviceMarginDetail(riskiest))}
                  className={cn(
                    'text-left w-full cursor-pointer group rounded-2xl p-4 border',
                    riskLow ? 'bg-destructive/[0.06] border-destructive/15' : 'bg-primary/[0.05] border-primary/10',
                  )}
                >
                  <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold mb-2', riskLow ? 'text-destructive' : 'text-[#0D6B2F]')}>
                    {riskLow && <AlertTriangle size={12} />}
                    {riskLow ? 'Низька маржа' : 'Найтонша маржа'}
                  </span>
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{riskiest.service_name}</p>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className={cn('metric-value text-3xl font-semibold leading-none', riskLow ? 'text-destructive' : 'text-foreground')}>{riskiest.margin_pct}%</span>
                    <span className="text-[11px] text-text-sub">
                      {riskiest.bookings_count} {pluralUk(riskiest.bookings_count, 'запис', 'записи', 'записів')} · {formatPrice(grn(riskiest.revenue_kopecks))}
                    </span>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary group-hover:gap-2.5 transition-all">
                    Переглянути ціну
                    <ArrowRight size={14} />
                  </span>
                </button>

                {/* Ранг-список решти */}
                {restServices.length > 0 && (
                  <div className="flex flex-col mt-1.5">
                    {restServices.map((s) => {
                      const low = s.margin_pct < 40;
                      return (
                        <button
                          type="button"
                          key={s.service_id}
                          onClick={() => onOpenDetail(serviceMarginDetail(s))}
                          className="flex items-center justify-between gap-3 py-2.5 border-b border-border/30 last:border-0 text-left w-full cursor-pointer group"
                        >
                          <span className="text-sm text-foreground truncate group-hover:text-primary transition-colors min-w-0">{s.service_name}</span>
                          <span className={cn('metric-value text-sm font-semibold flex-shrink-0 tabular-nums', low ? 'text-destructive' : 'text-[#0D6B2F]')}>{s.margin_pct}%</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-text-sub py-6 text-center">
                Маржа порахується, коли зʼявляться записи з послугами в цьому періоді.
              </p>
            )}
          </BentoCell>
        </div>
      </div>
    </div>
  );
}
