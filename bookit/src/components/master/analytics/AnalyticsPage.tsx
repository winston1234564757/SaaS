'use client';

import { useState, useEffect } from 'react';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, TrendingUp, TrendingDown, Users,
  Minus, Download, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, Clock, Zap,
  Star, ChevronDown, Crown,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/components/master/services/types';
import { useDateRange, type Preset } from '@/lib/supabase/hooks/useDateRange';
import {
  useAnalytics, exportAnalyticsCsv, linearRegression,
  type TopService, type TopClient,
} from '@/lib/supabase/hooks/useAnalytics';
import { Tooltip } from '@/components/ui/Tooltip';
import { pluralize } from '@/lib/utils/dates';
import { ClientDetailSheet } from '@/components/master/clients/ClientDetailSheet';
import type { ClientRow } from '@/components/master/clients/ClientsPage';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AnalyticsPageProps { isPro: boolean }

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'day', label: 'День' },
  { key: 'week', label: 'Тиждень' },
  { key: 'month', label: 'Місяць' },
  { key: 'year', label: 'Рік' },
  { key: 'all', label: 'Весь час' },
];

const UA_MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const UA_DOW = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const UA_DOW_FULL = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ h = 'h-5', w = 'w-full', rounded = 'rounded-xl' }: {
  h?: string; w?: string; rounded?: string;
}) {
  return <div className={`animate-pulse bg-[#F0E4DE] ${h} ${w} ${rounded}`} />;
}

// ── DateRangeBar ──────────────────────────────────────────────────────────────

function DateRangeBar({
  preset, canGoNext, label,
  setPreset, goPrev, goNext,
}: {
  preset: Preset; canGoNext: boolean; label: string;
  setPreset: (p: Preset) => void; goPrev: () => void; goNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-[#F5E8E3]/60 p-1.5 rounded-2xl flex gap-0.5 overflow-x-auto scrollbar-hide">
        {PRESETS.map(p => (
          <button key={p.key} onClick={() => setPreset(p.key)}
            className={`flex-1 flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${preset === p.key
                ? 'bg-white shadow-[0_2px_10px_rgb(0,0,0,0.08)] text-[#2C1A14] font-semibold'
                : 'text-[#A8928D] hover:text-[#6B5750] hover:bg-white/30'
              }`}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={goPrev}
          className="w-8 h-8 rounded-full bg-white/70 border border-white/80 flex items-center justify-center text-[#6B5750] hover:bg-white transition-colors flex-shrink-0 shadow-sm">
          <ChevronLeft size={14} />
        </button>
        <p className="flex-1 text-center text-sm font-semibold text-[#2C1A14]">{label}</p>
        <button onClick={goNext} disabled={!canGoNext}
          className="w-8 h-8 rounded-full bg-white/70 border border-white/80 flex items-center justify-center text-[#6B5750] hover:bg-white transition-colors flex-shrink-0 shadow-sm disabled:opacity-30">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wider">{title}</p>
      {subtitle && <p className="text-[11px] text-[#A8928D]/70 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ── ServiceRow ────────────────────────────────────────────────────────────────

function ServiceRow({ svc, maxRev }: { svc: TopService; maxRev: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="w-full text-left">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium text-[#2C1A14] truncate pr-2">{svc.name}</span>
          <span className="text-sm font-bold text-[#5C9E7A] flex-shrink-0">{formatPrice(svc.revenue)}</span>
        </div>
        <div className="h-2 rounded-full bg-[#F5E8E3]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#789A99] to-[#789A99]/50 transition-all duration-700"
            style={{ width: `${Math.round((svc.revenue / maxRev) * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-[#A8928D]">{pluralize(svc.count, ['запис', 'записи', 'записів'])}</span>
          <ChevronDown size={12} className={`text-[#A8928D] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.25s ease' }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div className="mt-2 p-3 rounded-2xl bg-[#789A99]/[0.06] border border-[#789A99]/15 grid grid-cols-3 gap-2">
            {[
              { label: 'Cross-sell', value: `${svc.crossSellRate}%`, color: '#789A99' },
              { label: 'З товарами', value: `${Math.round(svc.count * svc.crossSellRate / 100)}/${svc.count}`, color: '#2C1A14' },
              { label: 'Серед. чек', value: svc.count > 0 ? formatPrice(Math.round(svc.revenue / svc.count)) : '—', color: '#2C1A14' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] text-[#A8928D] mb-0.5">{item.label}</p>
                <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DowChart ──────────────────────────────────────────────────────────────────

function DowChart({ data, bookings, bestIdx }: { data: number[]; bookings: number[]; bestIdx: number }) {
  const max = Math.max(...data, 1);
  const total = data.reduce((s, v) => s + v, 0);
  const [activeBar, setActiveBar] = useState<number | null>(null);

  useEffect(() => {
    if (activeBar === null) return;
    const close = () => setActiveBar(null);
    const frame = requestAnimationFrame(() => {
      document.addEventListener('click', close, { once: true });
      document.addEventListener('touchstart', close, { once: true, passive: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('click', close);
      document.removeEventListener('touchstart', close);
    };
  }, [activeBar]);

  return (
    <div className="flex items-end gap-1.5 h-12 mt-2">
      {data.map((v, i) => {
        const pct = total > 0 ? Math.round((v / total) * 100) : 0;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 relative"
            onMouseEnter={() => setActiveBar(i)}
            onMouseLeave={() => setActiveBar(null)}
            onClick={(e) => { e.stopPropagation(); setActiveBar(prev => prev === i ? null : i); }}
          >
            <AnimatePresence>
              {activeBar === i && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                  style={{
                    background: 'rgba(255,248,244,0.97)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.72)',
                    boxShadow: '0 8px 24px rgba(44,26,20,0.12)',
                    borderRadius: 12,
                    padding: '6px 10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <p className="text-sm text-[#6B5750] mb-0.5">{UA_DOW_FULL[i]}</p>
                  <p className="text-base font-bold text-[#2C1A14]">{formatPrice(v)}</p>
                  <p className="text-[11px] text-[#6B5750]">{pct}% · {pluralize(bookings[i], ['запис', 'записи', 'записів'])}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: Math.max(3, Math.round((v / max) * 36)) }}
              transition={{ delay: i * 0.04, ...SPRING }}
              className={`w-full rounded-t-md cursor-pointer ${i === bestIdx ? 'bg-[#789A99]' : 'bg-[#789A99]/20'}`}
            />
            <span className={`text-[9px] leading-none ${i === bestIdx ? 'font-bold text-[#789A99]' : 'text-[#C8B8B2]'}`}>
              {UA_DOW[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── ClientSheetById ───────────────────────────────────────────────────────────

function ClientSheetById({ clientId, masterId, clientName, onClose }: {
  clientId: string; masterId: string; clientName: string; onClose: () => void;
}) {
  const [row, setRow] = useState<ClientRow | null>(null);
  useEffect(() => {
    if (!clientId || !masterId) return;
    const sb = createClient();
    Promise.all([
      sb.from('bookings').select('client_phone, date, total_price, status, client_name')
        .eq('master_id', masterId).eq('client_id', clientId).order('date', { ascending: false }),
      sb.from('client_master_relations').select('id, is_vip')
        .eq('master_id', masterId).eq('client_id', clientId).maybeSingle(),
    ]).then(([bRes, rRes]) => {
      const bs = (bRes.data ?? []) as any[];
      const rel = rRes.data as any;
      const nonCancelled = bs.filter(b => b.status !== 'cancelled');
      const completed = bs.filter(b => b.status === 'completed');
      const spent = completed.reduce((s: number, b: any) => s + Number(b.total_price), 0);
      setRow({
        id: bs[0]?.client_phone ?? clientId,
        client_id: clientId,
        client_name: bs[0]?.client_name ?? clientName,
        client_phone: bs[0]?.client_phone ?? '',
        total_visits: nonCancelled.length,
        total_spent: spent,
        average_check: completed.length > 0 ? Math.round(spent / completed.length) : 0,
        last_visit_at:    bs[0]?.date ?? null,
        is_vip:           rel?.is_vip ?? false,
        relation_id:      rel?.id ?? null,
        retention_status: 'active' as const,
      });
    });
  }, [clientId, masterId]);
  return (
    <ClientDetailSheet
      client={row}
      onClose={onClose}
      onVipChange={(_, v) => setRow(r => r ? { ...r, is_vip: v } : null)}
    />
  );
}

// ── Pro Upgrade Card ──────────────────────────────────────────────────────────

function ProUpgradeCard() {
  return (
    <motion.div
      data-testid="upgrade-prompt"
      className="bento-card p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}
    >
      {/* Декоративні блоби */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#789A99]/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#5C9E7A]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-5 relative">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#789A99] to-[#5C9E7A] flex items-center justify-center shadow-[0_4px_14px_rgba(120,154,153,0.4)] flex-shrink-0">
          <Crown size={19} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#2C1A14]">Глибока аналітика</p>
          <p className="text-[11px] text-[#A8928D]">Доступно з Pro-тарифом</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6 relative">
        {[
          { icon: TrendingUp, label: 'Тренд виручки за 6 місяців + прогноз' },
          { icon: Users, label: 'Нові vs постійні клієнти' },
          { icon: Star, label: 'Топ клієнти, послуги та товари' },
          { icon: BarChart2, label: 'Середній чек і джерела записів' },
          { icon: Download, label: 'CSV-експорт усіх транзакцій' },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-[#789A99]/10 flex items-center justify-center flex-shrink-0">
              <f.icon size={13} className="text-[#789A99]" />
            </div>
            <p className="text-[13px] text-[#6B5750]">{f.label}</p>
          </div>
        ))}
      </div>

      <Link href="/dashboard/billing"
        className="relative flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#789A99] to-[#5C9E7A] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(92,158,122,0.3)] hover:shadow-[0_6px_20px_rgba(92,158,122,0.4)] active:scale-[0.98] transition-all">
        <Crown size={15} />
        Перейти на Pro — 700₴/міс
      </Link>
    </motion.div>
  );
}

// ── MonthBarChart ─────────────────────────────────────────────────────────────

function MonthBarChart({ monthStats }: { monthStats: Array<{ month: string; revenue: number; bookings: number }> }) {
  const [activeBar, setActiveBar] = useState<number | null>(null);

  useEffect(() => {
    if (activeBar === null) return;
    const close = () => setActiveBar(null);
    const frame = requestAnimationFrame(() => {
      document.addEventListener('click', close, { once: true });
      document.addEventListener('touchstart', close, { once: true, passive: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('click', close);
      document.removeEventListener('touchstart', close);
    };
  }, [activeBar]);

  const maxV = Math.max(...monthStats.map(x => x.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {monthStats.map((m, i) => {
        const h = m.revenue === 0 ? 4 : Math.round((m.revenue / maxV) * 80);
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 relative"
            onMouseEnter={() => setActiveBar(i)}
            onMouseLeave={() => setActiveBar(null)}
            onClick={(e) => { e.stopPropagation(); setActiveBar(prev => prev === i ? null : i); }}
          >
            <AnimatePresence>
              {activeBar === i && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                  style={{
                    background: 'rgba(255,248,244,0.97)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.72)',
                    boxShadow: '0 8px 24px rgba(44,26,20,0.12)',
                    borderRadius: 12,
                    padding: '6px 10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <p className="text-sm text-[#6B5750] mb-0.5">{m.month}</p>
                  <p className="text-base font-bold text-[#2C1A14]">{formatPrice(m.revenue)}</p>
                  <p className="text-[11px] text-[#6B5750]">{pluralize(m.bookings, ['запис', 'записи', 'записів'])}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              initial={{ height: 0 }} animate={{ height: h }}
              transition={{ delay: 0.06 + i * 0.06, ...SPRING }}
              className="w-full rounded-t-xl bg-gradient-to-t from-[#789A99]/60 to-[#789A99]/25"
              style={{ minHeight: 4, cursor: 'pointer' }}
            />
            <span className="text-[10px] text-[#A8928D]">{m.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalyticsPage({ isPro }: AnalyticsPageProps) {
  const { masterProfile } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('analytics', 2, {
    initialSeen: seenTours?.analytics ?? false,
    masterId: masterProfile?.id,
  });
  const range = useDateRange();
  const [exporting, setExporting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<TopClient | null>(null);

  // Starter: тільки поточний місяць безкоштовний
  const isLockedDateRange = !isPro && (range.preset !== 'month' || range.offset !== 0);

  const { data, isLoading, isError, refetch, isFetching } = useAnalytics(
    { startDate: range.startDate, endDate: range.endDate },
    isPro,
    range.preset,
    range.offset,
  );

  const summary = data?.summary ?? { bookings: 0, revenue: 0, activeClients: 0, newClients: null };
  const monthStats = data?.monthStats ?? [];
  const topServices = data?.topServices ?? [];
  const topProducts = data?.topProducts ?? [];
  const retention = data?.retention ?? null;
  const bento = data?.bento ?? null;

  const maxSvcRev = Math.max(...topServices.map(s => s.revenue), 1);
  const maxProdRev = Math.max(...topProducts.map(p => p.revenue), 1);

  const forecast = isPro && monthStats.length >= 2
    ? linearRegression(monthStats.map(m => m.revenue))
    : null;
  const lastMonthRev = monthStats[monthStats.length - 1]?.revenue ?? 0;
  const forecastDelta = forecast ? forecast.forecast - lastMonthRev : 0;
  const forecastPct = lastMonthRev > 0 ? Math.round((forecastDelta / lastMonthRev) * 100) : null;
  const nextMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return UA_MONTHS[d.getMonth()]; })();

  const retTotal = retention ? retention.newClients + retention.returningClients : 0;
  const retRate = retTotal > 0 ? Math.round((retention!.returningClients / retTotal) * 100) : 0;

  async function handleExport() {
    if (!masterProfile?.id) return;
    setExporting(true);
    try { await exportAnalyticsCsv(masterProfile.id, range.startDate, range.endDate); }
    finally { setExporting(false); }
  }

  return (
    <div className="flex flex-col gap-4 pb-8 w-full max-w-full overflow-x-hidden">
      {/* ── Header ── */}
      <div className={cn(
        'relative bento-card p-5 transition-all duration-500',
        currentStep === 0 && 'tour-glow z-40 scale-[1.02]'
      )}>
        <AnchoredTooltip
          isOpen={currentStep === 0}
          onClose={closeTour}
          title="💰 Контроль доходів"
          text="Тримайте фінанси під контролем. Тут ви побачите реальний графік ваших доходів за місяць."
          position="bottom"
          primaryButtonText="Далі →"
          onPrimaryClick={nextStep}
        />
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Аналітика</h1>
            <p className="text-sm text-[#A8928D]">Статистика та звіти</p>
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F5E8E3] text-[#6B5750] hover:bg-[#EDD9D1] transition-colors disabled:opacity-40">
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
        <DateRangeBar
          preset={range.preset} canGoNext={range.canGoNext} label={range.label}
          setPreset={range.setPreset} goPrev={range.goPrev} goNext={range.goNext}
        />
        {isLockedDateRange && (
          <div className="mt-3 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#789A99]/8 border border-[#789A99]/20">
            <Crown size={13} className="text-[#789A99] flex-shrink-0" />
            <p className="text-[12px] text-[#6B5750] flex-1">Цей діапазон доступний у Pro</p>
            <Link href="/dashboard/billing" className="text-[11px] font-bold text-[#789A99] whitespace-nowrap">
              Оновити →
            </Link>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {isError && (
        <div className="bento-card p-5 text-center text-sm text-[#C05B5B]">
          Помилка завантаження.{' '}
          <button onClick={() => refetch()} className="underline">Повторити</button>
        </div>
      )}

      {/* ── Summary ── */}
      <motion.div
        data-testid={isLoading ? 'stats-loading' : 'stats-ready'}
        className="bento-card p-5"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wider">{range.label}</p>
            <p className="text-[11px] text-[#A8928D]/60 mt-0.5">{range.startDate} — {range.endDate}</p>
          </div>
        </div>

        {isLockedDateRange ? (
          <div className="flex flex-col items-center py-6 gap-2.5" data-testid="locked-date-range">
            <div className="w-12 h-12 rounded-2xl bg-[#789A99]/10 flex items-center justify-center">
              <Crown size={20} className="text-[#789A99]" data-testid="paywall-lock" />
            </div>
            <p className="text-sm font-bold text-[#2C1A14]">Виберіть поточний місяць</p>
            <p className="text-[12px] text-[#A8928D] text-center max-w-[200px]">
              Безкоштовна аналітика доступна лише для поточного місяця
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: BarChart2, label: 'Записів', value: isLoading ? null : summary.bookings, color: '#789A99' },
              { icon: TrendingUp, label: 'Виручка', value: isLoading ? null : formatPrice(summary.revenue), color: '#5C9E7A' },
              { icon: Users, label: 'Клієнтів', value: isLoading ? null : summary.activeClients, color: '#D4935A' },
              { icon: Star, label: 'Нових', value: isLoading ? null : (summary.newClients !== null ? summary.newClients : '—'), color: '#789A99' },
            ].map(s => (
              <div key={s.label} className="flex flex-col gap-2.5 p-3.5 rounded-3xl bg-white/50 border border-white/60">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}18` }}>
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
                {s.value === null
                  ? <Skeleton h="h-7" w="w-20" />
                  : <p className="text-2xl font-bold tracking-tight text-[#2C1A14] leading-none">{s.value}</p>
                }
                <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Empty state: no bookings yet ── */}
      {!isLoading && !isLockedDateRange && summary.bookings === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.15 }}
          className="bento-card p-6 flex flex-col gap-5"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#789A99]/10 flex items-center justify-center mx-auto mb-4">
              <BarChart2 size={28} className="text-[#789A99]" />
            </div>
            <p className="text-base font-bold text-[#2C1A14]">Даних ще немає</p>
            <p className="text-sm text-[#A8928D] mt-1 text-balance">
              Аналітика з'явиться після перших записів. Ось як їх отримати:
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                emoji: '🔗',
                title: 'Поширте публічну сторінку',
                desc: 'Ваш унікальний link in bio — надішліть в Instagram Stories, Telegram-канал або WhatsApp.',
                href: '/dashboard/settings',
                cta: 'Налаштування →',
              },
              {
                emoji: '⚡',
                title: 'Запустіть флеш-акцію',
                desc: 'Знижка -20% на перший запис залучає нових клієнтів моментально.',
                href: '/dashboard/flash',
                cta: 'Створити акцію →',
              },
              {
                emoji: '✍️',
                title: 'Додайте запис вручну',
                desc: 'Зафіксуйте поточних клієнтів — їхня статистика одразу з\'явиться тут.',
                href: '/dashboard/bookings',
                cta: 'Записи →',
              },
            ].map(step => (
              <div key={step.title} className="flex gap-3 p-4 rounded-2xl bg-white/50">
                <span className="text-xl flex-shrink-0 mt-0.5">{step.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2C1A14]">{step.title}</p>
                  <p className="text-xs text-[#A8928D] mt-0.5 leading-relaxed">{step.desc}</p>
                  <Link href={step.href} className="inline-flex mt-1.5 text-xs font-semibold text-[#789A99] hover:text-[#5C7E7D] transition-colors">
                    {step.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Starter: одна красива картка апгрейду ── */}
      {!isPro && !isLockedDateRange && summary.bookings > 0 && <ProUpgradeCard />}

      {/* ── Pro контент ── */}
      {isPro && (
        <>
          {/* Нові vs Постійні */}
          <div className={cn(
            'relative bento-card p-5 transition-all duration-500',
            currentStep === 1 && 'tour-glow z-40 scale-[1.02]'
          )}>
            <AnchoredTooltip
              isOpen={currentStep === 1}
              onClose={closeTour}
              title="📊 Когортний аналіз"
              text="Слідкуйте за тим, скільки нових клієнтів до вас приходить, і який відсоток з них стає постійними."
              position="top"
              primaryButtonText="Зрозуміло"
              onPrimaryClick={nextStep}
            />
            <SectionHeader title="Нові vs Постійні" />
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton h="h-3" /><Skeleton h="h-3" w="w-24" />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[0, 1, 2].map(i => <Skeleton key={i} h="h-16" rounded="rounded-2xl" />)}
                </div>
              </div>
            ) : !retention || retTotal === 0 ? (
              <p className="text-sm text-[#A8928D] text-center py-4">Недостатньо даних за цей період</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-[#A8928D] mb-1.5">
                    <span>Нові · {retention.newClients}</span>
                    <span>Постійні · {retention.returningClients}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#F5E8E3] overflow-hidden flex">
                    <div className="h-full bg-[#D4935A]/70 transition-all duration-700" style={{ width: `${100 - retRate}%` }} />
                    <div className="h-full bg-[#789A99]/70 transition-all duration-700" style={{ width: `${retRate}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { label: 'Нових', value: retention.newClients, color: '#D4935A' },
                    { label: 'Постійних', value: retention.returningClients, color: '#789A99' },
                    { label: 'Повторність', value: `${retRate}%`, color: '#5C9E7A' },
                  ].map(item => (
                    <div key={item.label} className="flex flex-col items-center p-3 rounded-2xl bg-white/50 border border-white/80">
                      <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-[10px] text-[#A8928D] text-center leading-tight mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Виручка за 6 місяців */}
          <div className="bento-card p-5">
            <SectionHeader title="Виручка за 6 місяців" />
            {isLoading ? (
              <div className="flex items-end gap-2 h-24">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <Skeleton h="h-16" rounded="rounded-t-xl" /><Skeleton h="h-2" w="w-6" />
                  </div>
                ))}
              </div>
            ) : monthStats.length === 0 ? (
              <p className="text-sm text-[#A8928D] text-center py-8">Недостатньо даних</p>
            ) : (
              <MonthBarChart monthStats={monthStats} />
            )}
          </div>

          {/* Bento row: Розподіл виручки + Кращий день */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bento-card p-4">
              <SectionHeader title="Розподіл" />
              {isLoading ? <Skeleton h="h-20" rounded="rounded-xl" /> : bento ? (() => {
                const svcRev = bento.revenueByCategory.services;
                const prodRev = bento.revenueByCategory.products;
                const total = svcRev + prodRev;
                const svcPct = total > 0 ? Math.round((svcRev / total) * 100) : 0;
                return (
                  <div className="flex flex-col gap-3">
                    <div className="h-2 rounded-full bg-[#F5E8E3] overflow-hidden flex">
                      <div className="h-full bg-[#789A99]/70 transition-all duration-700" style={{ width: `${svcPct}%` }} />
                      <div className="h-full bg-[#D4935A]/60 transition-all duration-700 flex-1" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { dot: '#789A99', label: 'Послуги', pct: svcPct, rev: svcRev },
                        { dot: '#D4935A', label: 'Товари', pct: 100 - svcPct, rev: prodRev },
                      ].map(item => (
                        <Tooltip key={item.label}
                          content={<div><p className="text-sm text-[#6B5750] mb-1">{item.label}</p><p className="text-lg font-bold text-[#2C1A14]">{formatPrice(item.rev)}</p></div>}
                        >
                          <div className="flex items-center justify-between cursor-default">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.dot }} />
                              <span className="text-[11px] text-[#A8928D]">{item.label}</span>
                            </div>
                            <span className="text-[11px] font-bold text-[#2C1A14]">{item.pct}%</span>
                          </div>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                );
              })() : null}
            </div>

            <div className="bento-card p-4">
              <SectionHeader title="Кращий день" />
              {isLoading ? <Skeleton h="h-20" rounded="rounded-xl" /> : bento ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <p className="text-lg font-bold text-[#789A99]">{bento.bestDayOfWeek.day}</p>
                    <p className="text-[11px] text-[#A8928D]">· {bento.bestDayOfWeek.pct}%</p>
                  </div>
                  <DowChart
                    data={bento.bestDayOfWeek.data}
                    bookings={bento.bestDayOfWeek.bookings}
                    bestIdx={bento.bestDayOfWeek.dayIdx}
                  />
                </>
              ) : null}
            </div>
          </div>

          {/* Bento mini: Серед. чек + Години + Джерело */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bento-card p-4 flex flex-col gap-2">
              <BarChart2 size={15} className="text-[#789A99]" />
              {isLoading
                ? <Skeleton h="h-5" w="w-14" />
                : <p className="text-base font-bold text-[#2C1A14] leading-tight">
                  {bento && bento.avgCheck.current > 0 ? formatPrice(bento.avgCheck.current) : '—'}
                </p>
              }
              <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wider leading-tight">Серед. чек</p>
              {bento?.avgCheck.delta !== null && bento?.avgCheck.delta !== undefined && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold ${bento.avgCheck.delta > 0 ? 'text-[#5C9E7A]' : bento.avgCheck.delta < 0 ? 'text-[#C05B5B]' : 'text-[#A8928D]'
                  }`}>
                  {bento.avgCheck.delta > 0 ? <TrendingUp size={10} /> : bento.avgCheck.delta < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                  {bento.avgCheck.delta > 0 ? '+' : ''}{bento.avgCheck.delta}%
                </div>
              )}
            </div>

            <div className="bento-card p-4 flex flex-col gap-2">
              <Clock size={15} className="text-[#789A99]" />
              {isLoading
                ? <Skeleton h="h-5" w="w-12" />
                : <p className="text-base font-bold text-[#2C1A14] leading-tight">{bento?.hoursBooked ?? '—'}г</p>
              }
              <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wider leading-tight">Год. заброньовано</p>
            </div>

            <div className="bento-card p-4 flex flex-col gap-2">
              <Zap size={15} className="text-[#789A99]" />
              <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wider leading-tight">Джерело</p>
              {isLoading ? <Skeleton h="h-8" rounded="rounded-lg" /> : (
                <div className="flex flex-col gap-1.5 mt-auto">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-[#A8928D]">Онлайн</span>
                    <span className="text-[10px] font-bold text-[#789A99]">{bento?.sourceBreakdown.online ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-[#A8928D]">Вручну</span>
                    <span className="text-[10px] font-bold text-[#2C1A14]">{bento?.sourceBreakdown.manual ?? '—'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Найприбутковіші клієнти */}
          <div className="bento-card p-5">
            <SectionHeader title="Найприбутковіші клієнти" />
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map(i => <Skeleton key={i} h="h-12" rounded="rounded-2xl" />)}
              </div>
            ) : bento && bento.topClients.length > 0 ? (
              <div className="flex flex-col gap-1">
                {bento.topClients.map((c, i) => (
                  <button key={i}
                    onClick={() => c.clientId ? setSelectedClient(c) : undefined}
                    disabled={!c.clientId}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/60 transition-colors cursor-pointer disabled:cursor-default text-left w-full"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-[#D4935A]/20 text-[#D4935A]' : i === 1 ? 'bg-[#789A99]/15 text-[#789A99]' : 'bg-[#F5E8E3] text-[#A8928D]'
                      }`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2C1A14] truncate">{c.clientName}</p>
                      <p className="text-[11px] text-[#A8928D]">{c.visits} відвідувань</p>
                    </div>
                    <p className="text-sm font-bold text-[#5C9E7A] flex-shrink-0">{formatPrice(c.revenue)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#A8928D] text-center py-4">Немає даних за цей період</p>
            )}
          </div>

          {/* Прогноз виручки */}
          <div className="bento-card p-5">
            <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wider mb-4">Прогноз виручки</p>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton h="h-16" rounded="rounded-2xl" />
                <Skeleton h="h-14" />
                <Skeleton h="h-2" />
              </div>
            ) : forecast ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/50">
                  <div>
                    <p className="text-xs text-[#A8928D] mb-1">{nextMonth} — очікувана виручка</p>
                    <p className="text-3xl font-bold tracking-tight text-[#2C1A14]">{formatPrice(forecast.forecast)}</p>
                  </div>
                  <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl ${forecastDelta > 0 ? 'bg-[#5C9E7A]/10' : forecastDelta < 0 ? 'bg-[#C05B5B]/10' : 'bg-[#F5E8E3]'
                    }`}>
                    {forecastDelta > 0 ? <TrendingUp size={20} className="text-[#5C9E7A]" />
                      : forecastDelta < 0 ? <TrendingDown size={20} className="text-[#C05B5B]" />
                        : <Minus size={20} className="text-[#A8928D]" />}
                    {forecastPct !== null && (
                      <span className={`text-xs font-bold ${forecastDelta > 0 ? 'text-[#5C9E7A]' : forecastDelta < 0 ? 'text-[#C05B5B]' : 'text-[#A8928D]'
                        }`}>{forecastDelta > 0 ? '+' : ''}{forecastPct}%</span>
                    )}
                  </div>
                </div>
                <div className="flex items-end gap-1.5 h-14">
                  {monthStats.map((m, i) => {
                    const allVals = [...monthStats.map(x => x.revenue), forecast.forecast];
                    const maxV = Math.max(...allVals, 1);
                    const h = Math.max(3, Math.round((m.revenue / maxV) * 48));
                    return (
                      <Tooltip key={i}
                        content={<div><p className="text-sm text-[#6B5750] mb-1">{m.month}</p><p className="text-lg font-bold text-[#2C1A14]">{formatPrice(m.revenue)}</p></div>}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <motion.div initial={{ height: 0 }} animate={{ height: h }}
                          transition={{ delay: 0.04 + i * 0.05, ...SPRING }}
                          className="w-full rounded-t-lg bg-[#789A99]/40" />
                        <span className="text-[9px] text-[#A8928D]">{m.month}</span>
                      </Tooltip>
                    );
                  })}
                  <Tooltip
                    content={<div><p className="text-sm text-[#6B5750] mb-1">Прогноз · {nextMonth}</p><p className="text-lg font-bold text-[#2C1A14]">{formatPrice(forecast.forecast)}</p>{forecastPct !== null && <p className="text-sm text-[#6B5750]">{forecastPct > 0 ? '+' : ''}{forecastPct}% до минулого місяця</p>}</div>}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <motion.div initial={{ height: 0 }}
                      animate={{ height: Math.max(3, Math.round((forecast.forecast / Math.max(...monthStats.map(x => x.revenue), forecast.forecast, 1)) * 48)) }}
                      transition={{ delay: monthStats.length * 0.05, ...SPRING }}
                      className="w-full rounded-t-lg border-2 border-dashed border-[#789A99] bg-[#789A99]/15" />
                    <span className="text-[9px] font-semibold text-[#789A99]">{nextMonth.slice(0, 3)}</span>
                  </Tooltip>
                </div>

                {/* Transparent breakdown — показує логіку розрахунку */}
                {bento && bento.avgCheck.current > 0 && summary.bookings > 0 && (
                  <div className="flex flex-col gap-1.5 px-3 py-3 rounded-2xl bg-[#F5E8E3]/60">
                    <p className="text-[11px] text-[#6B5750] font-medium">Як рахується прогноз</p>
                    <div className="flex items-center gap-1.5 text-xs text-[#A8928D]">
                      <span className="font-semibold text-[#2C1A14]">{summary.bookings}</span>
                      <span>записів за цей місяць</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#A8928D]">
                      <span>×</span>
                      <span className="font-semibold text-[#2C1A14]">{formatPrice(bento.avgCheck.current)}</span>
                      <span>середній чек</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs border-t border-[#E8D5CF] pt-1.5 mt-0.5">
                      <span className="text-[#A8928D]">=</span>
                      <span className="font-bold text-[#2C1A14]">{formatPrice(summary.bookings * bento.avgCheck.current)}</span>
                      <span className="text-[#A8928D]">простий прогноз</span>
                    </div>
                  </div>
                )}

                {forecastDelta > 0 && forecastPct !== null && forecastPct >= 5 && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-[#5C9E7A]/8 border border-[#5C9E7A]/20">
                    <span className="text-base">🎉</span>
                    <p className="text-xs font-semibold text-[#5C9E7A]">
                      Ви зростаєте! Прогноз на {nextMonth} краще за минулий місяць на {forecastPct}%
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#A8928D] text-center py-4">Потрібно мінімум 2 місяці даних для прогнозу</p>
            )}
          </div>

          {/* Топ послуги */}
          <div className="bento-card p-5">
            <SectionHeader title="Топ послуги" subtitle="Натисни для cross-sell деталей" />
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton h="h-3" w="w-32" />
                    <Skeleton h="h-2" rounded="rounded-full" />
                  </div>
                ))}
              </div>
            ) : topServices.length === 0 ? (
              <p className="text-sm text-[#A8928D] text-center py-4">Немає завершених записів за цей період</p>
            ) : (
              <div className="flex flex-col gap-4">
                {topServices.map(svc => <ServiceRow key={svc.name} svc={svc} maxRev={maxSvcRev} />)}
              </div>
            )}
          </div>

          {/* Продажі товарів */}
          <div className="bento-card p-5">
            <SectionHeader title="Продажі товарів" />
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton h="h-3" w="w-36" />
                    <Skeleton h="h-2" rounded="rounded-full" />
                  </div>
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-[#A8928D] text-center py-4">Немає продажів за цей період</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topProducts.map((prod, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#A8928D] w-4 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-medium text-[#2C1A14] truncate pr-2">{prod.name}</span>
                        <span className="text-sm font-bold text-[#5C9E7A] flex-shrink-0">{formatPrice(prod.revenue)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#F5E8E3]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#D4935A]/70 to-[#D4935A]/30 transition-all duration-700"
                          style={{ width: `${Math.round((prod.revenue / maxProdRev) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-[#A8928D] mt-0.5 block">Продано: {prod.qty} шт.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CSV Експорт */}
          <div className="bento-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-[#789A99]/10 flex items-center justify-center flex-shrink-0">
                <Download size={16} className="text-[#789A99]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2C1A14]">Експорт звіту</p>
                <p className="text-[11px] text-[#A8928D]">CSV з усіма транзакціями · {range.label}</p>
              </div>
            </div>
            <button onClick={handleExport} disabled={exporting || isLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-[#789A99] to-[#5C9E7A] text-white text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(92,158,122,0.3)] hover:shadow-[0_6px_20px_rgba(92,158,122,0.4)]">
              {exporting
                ? <><Loader2 size={16} className="animate-spin" /> Генеруємо...</>
                : <><Download size={16} /> Завантажити CSV</>}
            </button>
          </div>
        </>
      )}

      {/* ── Client detail sheet ── */}
      {selectedClient?.clientId && masterProfile?.id && (
        <ClientSheetById
          clientId={selectedClient.clientId}
          masterId={masterProfile.id}
          clientName={selectedClient.clientName}
          onClose={() => setSelectedClient(null)}
        />
      )}

    </div>
  );
}
