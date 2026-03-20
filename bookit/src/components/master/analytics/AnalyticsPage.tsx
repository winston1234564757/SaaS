'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, TrendingUp, TrendingDown, Users, Lock,
  Minus, Download, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, Clock, Zap,
  ShoppingBag, Star, ChevronDown,
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
import { ClientDetailSheet } from '@/components/master/clients/ClientDetailSheet';
import type { ClientRow } from '@/components/master/clients/ClientsPage';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AnalyticsPageProps { isPro: boolean }

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'day',   label: 'День'  },
  { key: 'week',  label: 'Тиждень' },
  { key: 'month', label: 'Місяць'  },
  { key: 'year',  label: 'Рік'     },
  { key: 'all',   label: 'Весь час' },
];

const UA_MONTHS   = ['Січень','Лютий','Березень','Квітень','Травень','Червень',
                     'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const UA_DOW      = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];
const UA_DOW_FULL = ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота'];

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ h = 'h-5', w = 'w-full', rounded = 'rounded-xl' }: { h?: string; w?: string; rounded?: string }) {
  return <div className={`animate-pulse bg-[#F0E4DE] ${h} ${w} ${rounded}`} />;
}

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bento-card p-5 flex flex-col gap-3">
      <Skeleton h="h-3" w="w-28" />
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} h="h-10" rounded="rounded-2xl" />)}
    </div>
  );
}

// ── Pro lock overlay ──────────────────────────────────────────────────────────

function ProLock({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 backdrop-blur-[3px] bg-white/50 z-10 flex flex-col items-center justify-center gap-2 rounded-[24px]">
      <div className={`rounded-full bg-[#789A99]/15 flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-11 h-11'}`}>
        <Lock size={compact ? 14 : 18} className="text-[#789A99]" />
      </div>
      <p className={`font-semibold text-[#2C1A14] ${compact ? 'text-xs' : 'text-sm'}`}>Тільки для Pro</p>
      {!compact && (
        <Link href="/dashboard/billing"
          className="px-4 py-1.5 rounded-xl bg-[#789A99] text-white text-xs font-semibold">
          Перейти на Pro
        </Link>
      )}
    </div>
  );
}

// ── Date range selector ───────────────────────────────────────────────────────

function DateRangeBar({
  preset, canGoNext, label,
  setPreset, goPrev, goNext,
}: {
  preset: Preset; canGoNext: boolean; label: string;
  setPreset: (p: Preset) => void; goPrev: () => void; goNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {PRESETS.map(p => (
          <button key={p.key} onClick={() => setPreset(p.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              preset === p.key
                ? 'bg-[#789A99] text-white shadow-sm'
                : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
            }`}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={goPrev}
          className="w-7 h-7 rounded-full bg-white/70 border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-white transition-colors flex-shrink-0">
          <ChevronLeft size={13} />
        </button>
        <p className="flex-1 text-center text-sm font-semibold text-[#2C1A14]">{label}</p>
        <button onClick={goNext} disabled={!canGoNext}
          className="w-7 h-7 rounded-full bg-white/70 border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-white transition-colors flex-shrink-0 disabled:opacity-30">
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Interactive top-service row ───────────────────────────────────────────────

function ServiceRow({ svc, maxRev }: { svc: TopService; maxRev: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 text-left">
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-[#2C1A14] truncate pr-2">{svc.name}</span>
            <span className="text-xs font-medium text-[#5C9E7A] flex-shrink-0">{formatPrice(svc.revenue)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#F5E8E3]">
            <div className="h-full rounded-full bg-[#789A99]/60 transition-all duration-700"
              style={{ width: `${Math.round((svc.revenue / maxRev) * 100)}%` }} />
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-[#A8928D]">{svc.count} записів</span>
            <ChevronDown size={11} className={`text-[#A8928D] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* CSS grid accordion */}
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.28s ease',
      }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div className="mt-2 px-3 py-2.5 rounded-xl bg-[#789A99]/6 border border-[#789A99]/15 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-[#A8928D] mb-0.5">Cross-sell</p>
              <p className="text-sm font-bold text-[#789A99]">{svc.crossSellRate}%</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-[#A8928D] mb-0.5">З товарами</p>
              <p className="text-sm font-bold text-[#2C1A14]">
                {Math.round(svc.count * svc.crossSellRate / 100)} / {svc.count}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-[#A8928D] mb-0.5">Серед. чек</p>
              <p className="text-sm font-bold text-[#2C1A14]">
                {svc.count > 0 ? formatPrice(Math.round(svc.revenue / svc.count)) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Day-of-week mini chart ────────────────────────────────────────────────────

function DowChart({ data, bookings, bestIdx }: { data: number[]; bookings: number[]; bestIdx: number }) {
  const max   = Math.max(...data, 1);
  const total = data.reduce((s, v) => s + v, 0);
  return (
    <div className="flex items-end gap-1 h-10 mt-2">
      {data.map((v, i) => {
        const pct = total > 0 ? Math.round((v / total) * 100) : 0;
        return (
          <Tooltip
            key={i}
            content={
              <div>
                <p className="text-sm text-[#6B5750] mb-1">{UA_DOW_FULL[i]}</p>
                <p className="text-lg font-bold text-[#2C1A14]">{formatPrice(v)}</p>
                <p className="text-sm text-[#6B5750]">{pct}% виручки · {bookings[i]} записів</p>
              </div>
            }
            className="flex-1 flex flex-col items-center gap-0.5"
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: Math.max(2, Math.round((v / max) * 32)) }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 22 }}
              className={`w-full rounded-t-md ${i === bestIdx ? 'bg-[#789A99]' : 'bg-[#789A99]/25'}`}
            />
            <span className={`text-[9px] leading-none ${i === bestIdx ? 'font-bold text-[#789A99]' : 'text-[#C8B8B2]'}`}>
              {UA_DOW[i]}
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}

// ── Lazy client sheet (fetches ClientRow by client_id) ────────────────────────

function ClientSheetById({
  clientId, masterId, clientName, onClose,
}: {
  clientId: string; masterId: string; clientName: string; onClose: () => void;
}) {
  const [row, setRow] = useState<ClientRow | null>(null);

  useEffect(() => {
    if (!clientId || !masterId) return;
    const sb = createClient();
    Promise.all([
      sb.from('bookings')
        .select('client_phone, date, total_price, status, client_name')
        .eq('master_id', masterId)
        .eq('client_id', clientId)
        .order('date', { ascending: false }),
      sb.from('client_master_relations')
        .select('id, is_vip')
        .eq('master_id', masterId)
        .eq('client_id', clientId)
        .maybeSingle(),
    ]).then(([bRes, rRes]) => {
      const bs  = (bRes.data ?? []) as any[];
      const rel = rRes.data as any;
      const nonCancelled = bs.filter(b => b.status !== 'cancelled');
      const completed    = bs.filter(b => b.status === 'completed');
      const spent = completed.reduce((s: number, b: any) => s + Number(b.total_price), 0);
      const phone = bs[0]?.client_phone ?? '';
      setRow({
        id:            phone || clientId,
        client_id:     clientId,
        client_name:   bs[0]?.client_name ?? clientName,
        client_phone:  phone,
        total_visits:  nonCancelled.length,
        total_spent:   spent,
        average_check: completed.length > 0 ? Math.round(spent / completed.length) : 0,
        last_visit_at: bs[0]?.date ?? null,
        is_vip:        rel?.is_vip ?? false,
        relation_id:   rel?.id ?? null,
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

// ── Main component ────────────────────────────────────────────────────────────

export function AnalyticsPage({ isPro }: AnalyticsPageProps) {
  const { masterProfile } = useMasterContext();
  const range = useDateRange();
  const [exporting, setExporting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<TopClient | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useAnalytics(
    { startDate: range.startDate, endDate: range.endDate },
    isPro,
    range.preset,
    range.offset,
  );

  const summary     = data?.summary     ?? { bookings: 0, revenue: 0, activeClients: 0, newClients: null };
  const monthStats  = data?.monthStats  ?? [];
  const topServices = data?.topServices ?? [];
  const topProducts = data?.topProducts ?? [];
  const retention   = data?.retention   ?? null;
  const bento       = data?.bento       ?? null;

  const maxSvcRev  = Math.max(...topServices.map(s => s.revenue), 1);
  const maxProdRev = Math.max(...topProducts.map(p => p.revenue), 1);
  const maxBarRev  = Math.max(...monthStats.map(m => m.revenue), 1);

  const forecast = isPro && monthStats.length >= 2
    ? linearRegression(monthStats.map(m => m.revenue))
    : null;
  const lastMonthRev  = monthStats[monthStats.length - 1]?.revenue ?? 0;
  const forecastDelta = forecast ? forecast.forecast - lastMonthRev : 0;
  const forecastPct   = lastMonthRev > 0 ? Math.round((forecastDelta / lastMonthRev) * 100) : null;
  const nextMonth     = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return UA_MONTHS[d.getMonth()]; })();

  const retTotal = retention ? retention.newClients + retention.returningClients : 0;
  const retRate  = retTotal > 0 ? Math.round((retention!.returningClients / retTotal) * 100) : 0;

  async function handleExport() {
    if (!masterProfile?.id) return;
    setExporting(true);
    try { await exportAnalyticsCsv(masterProfile.id, range.startDate, range.endDate); }
    finally { setExporting(false); }
  }

  return (
    <div className="flex flex-col gap-4 pb-8">

      {/* ── Header ── */}
      <div className="bento-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Аналітика</h1>
            <p className="text-sm text-[#A8928D]">Статистика та звіти</p>
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5E8E3] text-[#6B5750] hover:bg-[#EDD9D1] transition-colors disabled:opacity-40">
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
        <DateRangeBar
          preset={range.preset} canGoNext={range.canGoNext} label={range.label}
          setPreset={range.setPreset} goPrev={range.goPrev} goNext={range.goNext}
        />
      </div>

      {/* ── Summary ── */}
      {isLoading ? <CardSkeleton rows={1} /> : isError ? (
        <div className="bento-card p-5 text-center text-sm text-[#C05B5B]">
          Помилка завантаження. <button onClick={() => refetch()} className="underline">Повторити</button>
        </div>
      ) : (
        <motion.div className="bento-card p-5"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-1">{range.label}</p>
          <p className="text-[11px] text-[#A8928D] mb-4">{range.startDate} — {range.endDate}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { icon: BarChart2,  label: 'Всього записів', value: summary.bookings,             color: '#789A99' },
              { icon: TrendingUp, label: 'Виручка',         value: formatPrice(summary.revenue), color: '#5C9E7A' },
            ].map(s => (
              <div key={s.label} className="flex flex-col gap-1 p-3 rounded-2xl bg-white/50">
                <s.icon size={16} style={{ color: s.color }} />
                <p className="text-lg font-bold text-[#2C1A14] leading-none mt-0.5">{s.value}</p>
                <p className="text-[11px] text-[#A8928D]">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/50">
              <Users size={16} className="text-[#D4935A]" />
              <p className="text-lg font-bold text-[#2C1A14] leading-none mt-0.5">{summary.activeClients}</p>
              <p className="text-[11px] text-[#A8928D]">Активних клієнтів</p>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/50">
              <Star size={16} className="text-[#789A99]" />
              <p className="text-lg font-bold text-[#2C1A14] leading-none mt-0.5">
                {summary.newClients !== null ? summary.newClients : '—'}
              </p>
              <p className="text-[11px] text-[#A8928D]">Нових клієнтів</p>
              <p className="text-[10px] text-[#789A99]">вперше у тебе</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Нові vs Постійні (Pro) ── */}
      <div className="bento-card p-5 relative overflow-hidden">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-4">Нові vs Постійні</p>
        {!isPro && <ProLock />}
        {isPro && (isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton h="h-3" w="w-24" />
            <Skeleton h="h-3" />
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[0,1,2].map(i => <Skeleton key={i} h="h-16" rounded="rounded-2xl" />)}
            </div>
          </div>
        ) : !retention || retTotal === 0 ? (
          <p className="text-sm text-[#A8928D] text-center py-2">Недостатньо даних за цей період</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-[11px] text-[#A8928D] mb-1.5">
                <span>Нові · {retention.newClients}</span>
                <span>Постійні · {retention.returningClients}</span>
              </div>
              <div className="h-3 rounded-full bg-[#F5E8E3] overflow-hidden flex">
                <div className="h-full bg-[#D4935A]/70 transition-all duration-700"
                  style={{ width: `${100 - retRate}%` }} />
                <div className="h-full bg-[#789A99]/70 transition-all duration-700"
                  style={{ width: `${retRate}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Нових',    value: retention.newClients,       color: '#D4935A' },
                { label: 'Постійних', value: retention.returningClients, color: '#789A99' },
                { label: 'Повторність', value: `${retRate}%`,           color: '#5C9E7A' },
              ].map(item => (
                <div key={item.label}
                  className="flex flex-col items-center p-3 rounded-2xl bg-white/50 border border-white/80">
                  <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-[10px] text-[#A8928D] text-center leading-tight mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bento Revenue Dashboard (Pro) ── */}
      {isPro && (
        <>
          {isLoading ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <CardSkeleton rows={2} />
                <CardSkeleton rows={2} />
              </div>
              <CardSkeleton rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <CardSkeleton rows={1} />
                <CardSkeleton rows={1} />
              </div>
            </>
          ) : bento && (
            <>
              {/* Row 1: Revenue by category + Best day */}
              <div className="grid grid-cols-2 gap-3">
                {/* Revenue by category */}
                <div className="bento-card p-4">
                  <p className="text-[10px] font-bold text-[#A8928D] uppercase tracking-wider mb-3">Виручка</p>
                  {(() => {
                    const svcRev  = bento.revenueByCategory.services;
                    const prodRev = bento.revenueByCategory.products;
                    const total   = svcRev + prodRev;
                    const svcPct  = total > 0 ? Math.round((svcRev / total) * 100) : 0;
                    return (
                      <div className="flex flex-col gap-2">
                        <div className="h-2 rounded-full bg-[#F5E8E3] overflow-hidden flex">
                          <div className="h-full bg-[#789A99]/70 transition-all duration-700" style={{ width: `${svcPct}%` }} />
                          <div className="h-full bg-[#D4935A]/60 transition-all duration-700 flex-1" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Tooltip content={
                            <div>
                              <p className="text-sm text-[#6B5750] mb-1">Послуги</p>
                              <p className="text-lg font-bold text-[#2C1A14]">{formatPrice(svcRev)}</p>
                            </div>
                          }>
                            <div className="flex items-center justify-between cursor-default w-full">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#789A99]/70" />
                                <span className="text-[10px] text-[#A8928D]">Послуги</span>
                              </div>
                              <span className="text-[11px] font-semibold text-[#2C1A14]">{svcPct}%</span>
                            </div>
                          </Tooltip>
                          <Tooltip content={
                            <div>
                              <p className="text-sm text-[#6B5750] mb-1">Товари</p>
                              <p className="text-lg font-bold text-[#2C1A14]">{formatPrice(prodRev)}</p>
                            </div>
                          }>
                            <div className="flex items-center justify-between cursor-default w-full">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#D4935A]/60" />
                                <span className="text-[10px] text-[#A8928D]">Товари</span>
                              </div>
                              <span className="text-[11px] font-semibold text-[#2C1A14]">{100 - svcPct}%</span>
                            </div>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Best day of week */}
                <div className="bento-card p-4">
                  <p className="text-[10px] font-bold text-[#A8928D] uppercase tracking-wider mb-1">Кращий день</p>
                  <div className="flex items-baseline gap-1 mb-0.5">
                    <p className="text-base font-bold text-[#789A99]">{bento.bestDayOfWeek.day}</p>
                    <p className="text-[11px] text-[#A8928D]">· {bento.bestDayOfWeek.pct}%</p>
                  </div>
                  <DowChart
                    data={bento.bestDayOfWeek.data}
                    bookings={bento.bestDayOfWeek.bookings}
                    bestIdx={bento.bestDayOfWeek.dayIdx}
                  />
                </div>
              </div>

              {/* Row 2: Top 3 clients */}
              <div className="bento-card p-5">
                <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-4">Найприбутковіші клієнти</p>
                {bento.topClients.length === 0 ? (
                  <p className="text-sm text-[#A8928D] text-center py-2">Немає даних за цей період</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {bento.topClients.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => c.clientId ? setSelectedClient(c) : undefined}
                        disabled={!c.clientId}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/60 transition-colors cursor-pointer disabled:cursor-default text-left w-full"
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          i === 0 ? 'bg-[#D4935A]/20 text-[#D4935A]'
                          : i === 1 ? 'bg-[#789A99]/15 text-[#789A99]'
                          : 'bg-[#F5E8E3] text-[#A8928D]'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2C1A14] truncate">{c.clientName}</p>
                          <p className="text-[11px] text-[#A8928D]">{c.visits} відвідувань</p>
                        </div>
                        <p className="text-sm font-bold text-[#5C9E7A] flex-shrink-0">{formatPrice(c.revenue)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: Avg check + Hours booked + Source */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bento-card p-4 flex flex-col gap-1">
                  <BarChart2 size={14} className="text-[#789A99]" />
                  <p className="text-base font-bold text-[#2C1A14] leading-tight">
                    {bento.avgCheck.current > 0 ? formatPrice(bento.avgCheck.current) : '—'}
                  </p>
                  <p className="text-[10px] text-[#A8928D] leading-tight">Серед. чек</p>
                  {bento.avgCheck.delta !== null && (
                    <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                      bento.avgCheck.delta > 0 ? 'text-[#5C9E7A]'
                      : bento.avgCheck.delta < 0 ? 'text-[#C05B5B]'
                      : 'text-[#A8928D]'
                    }`}>
                      {bento.avgCheck.delta > 0 ? <TrendingUp size={10} /> : bento.avgCheck.delta < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                      {bento.avgCheck.delta > 0 ? '+' : ''}{bento.avgCheck.delta}%
                    </div>
                  )}
                </div>

                <div className="bento-card p-4 flex flex-col gap-1">
                  <Clock size={14} className="text-[#789A99]" />
                  <p className="text-base font-bold text-[#2C1A14] leading-tight">{bento.hoursBooked}г</p>
                  <p className="text-[10px] text-[#A8928D] leading-tight">Год. заброньовано</p>
                </div>

                <div className="bento-card p-4 flex flex-col gap-1">
                  <Zap size={14} className="text-[#789A99]" />
                  <p className="text-[10px] text-[#A8928D] leading-tight mb-1">Джерело</p>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between">
                      <span className="text-[9px] text-[#A8928D]">Онлайн</span>
                      <span className="text-[10px] font-bold text-[#789A99]">{bento.sourceBreakdown.online}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] text-[#A8928D]">Вручну</span>
                      <span className="text-[10px] font-bold text-[#2C1A14]">{bento.sourceBreakdown.manual}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── 6-month trend ── */}
      <div className="bento-card p-5 relative overflow-hidden">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-4">
          Виручка за 6 місяців
        </p>
        {!isPro && <ProLock />}
        {isLoading && isPro ? (
          <div className="flex items-end gap-2 h-24">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <Skeleton h="h-16" rounded="rounded-t-xl" />
                <Skeleton h="h-2" w="w-6" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-end gap-2 h-24">
            {(isPro ? monthStats : Array(6).fill({ month: '...', revenue: 1200, bookings: 0 })).map((m, i) => {
              const h = m.revenue === 0 ? 4 : Math.round((m.revenue / maxBarRev) * 80);
              return (
                <Tooltip
                  key={i}
                  content={isPro ? (
                    <div>
                      <p className="text-sm text-[#6B5750] mb-1">{m.month}</p>
                      <p className="text-lg font-bold text-[#2C1A14]">{formatPrice(m.revenue)}</p>
                      <p className="text-sm text-[#6B5750]">{m.bookings} записів</p>
                    </div>
                  ) : null}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: h }}
                    transition={{ delay: 0.08 + i * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
                    className="w-full rounded-t-xl bg-[#789A99]/40" style={{ minHeight: 4 }}
                  />
                  <span className="text-[10px] text-[#A8928D]">{m.month}</span>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Revenue Forecast ── */}
      <div className="bento-card p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide">Прогноз виручки</p>
          <span className="text-[10px] text-[#A8928D] bg-[#F5E8E3] px-2 py-0.5 rounded-full">Лінійна регресія</span>
        </div>
        {!isPro && <ProLock />}
        {isPro && isLoading ? (
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
                <p className="text-2xl font-bold text-[#2C1A14]">{formatPrice(forecast.forecast)}</p>
              </div>
              <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl ${
                forecastDelta > 0 ? 'bg-[#5C9E7A]/10' : forecastDelta < 0 ? 'bg-[#C05B5B]/10' : 'bg-[#F5E8E3]'
              }`}>
                {forecastDelta > 0 ? <TrendingUp size={20} className="text-[#5C9E7A]" />
                  : forecastDelta < 0 ? <TrendingDown size={20} className="text-[#C05B5B]" />
                  : <Minus size={20} className="text-[#A8928D]" />}
                {forecastPct !== null && (
                  <span className={`text-xs font-bold ${
                    forecastDelta > 0 ? 'text-[#5C9E7A]' : forecastDelta < 0 ? 'text-[#C05B5B]' : 'text-[#A8928D]'
                  }`}>
                    {forecastDelta > 0 ? '+' : ''}{forecastPct}%
                  </span>
                )}
              </div>
            </div>

            {/* Trend mini chart */}
            <div className="flex items-end gap-1.5 h-14">
              {monthStats.map((m, i) => {
                const allVals = [...monthStats.map(x => x.revenue), forecast.forecast];
                const maxV    = Math.max(...allVals, 1);
                const h       = Math.max(3, Math.round((m.revenue / maxV) * 48));
                return (
                  <Tooltip
                    key={i}
                    content={
                      <div>
                        <p className="text-sm text-[#6B5750] mb-1">{m.month}</p>
                        <p className="text-lg font-bold text-[#2C1A14]">{formatPrice(m.revenue)}</p>
                      </div>
                    }
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <motion.div initial={{ height: 0 }} animate={{ height: h }}
                      transition={{ delay: 0.05 + i * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
                      className="w-full rounded-t-lg bg-[#789A99]/40" />
                    <span className="text-[9px] text-[#A8928D]">{m.month}</span>
                  </Tooltip>
                );
              })}
              {/* Forecast bar */}
              <Tooltip
                content={
                  <div>
                    <p className="text-sm text-[#6B5750] mb-1">Прогноз · {nextMonth}</p>
                    <p className="text-lg font-bold text-[#2C1A14]">{formatPrice(forecast.forecast)}</p>
                    {forecastPct !== null && (
                      <p className="text-sm text-[#6B5750]">
                        Очікується {forecastPct > 0 ? '+' : ''}{forecastPct}% до минулого місяця
                      </p>
                    )}
                  </div>
                }
                className="flex-1 flex flex-col items-center gap-1"
              >
                <motion.div initial={{ height: 0 }}
                  animate={{ height: Math.max(3, Math.round((forecast.forecast / Math.max(...monthStats.map(x => x.revenue), forecast.forecast, 1)) * 48)) }}
                  transition={{ delay: monthStats.length * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
                  className="w-full rounded-t-lg border-2 border-dashed border-[#789A99] bg-[#789A99]/15" />
                <span className="text-[9px] font-semibold text-[#789A99]">{nextMonth.slice(0, 3)}</span>
              </Tooltip>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#F5E8E3] rounded-full overflow-hidden">
                <div className="h-full bg-[#789A99]/60 rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(forecast.r2 * 100)}%` }} />
              </div>
              <Tooltip
                content={
                  <div className="max-w-[220px]">
                    <p className="text-sm font-semibold text-[#2C1A14] mb-1">Точність прогнозу</p>
                    <p className="text-sm text-[#6B5750] leading-relaxed">
                      Розраховується на основі стабільності твого доходу. Чим менше різких стрибків між місяцями, тим точніший прогноз.
                    </p>
                  </div>
                }
                position="top"
              >
                <span className="text-[10px] text-[#A8928D] flex-shrink-0 cursor-default underline decoration-dotted">
                  Точність: {Math.round(forecast.r2 * 100)}%
                </span>
              </Tooltip>
            </div>
          </div>
        ) : isPro ? (
          <p className="text-sm text-[#A8928D] text-center py-4">
            Потрібно мінімум 2 місяці даних для прогнозу
          </p>
        ) : null}
      </div>

      {/* ── Top services ── */}
      <div className="bento-card p-5 relative overflow-hidden">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-1">Топ послуги</p>
        <p className="text-[11px] text-[#A8928D] mb-4">Натисни для cross-sell деталей</p>
        {!isPro && <ProLock compact />}
        {isPro && (
          isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton h="h-3" w="w-32" />
                  <Skeleton h="h-1.5" rounded="rounded-full" />
                </div>
              ))}
            </div>
          ) : topServices.length === 0 ? (
            <p className="text-sm text-[#A8928D] text-center py-4">Немає завершених записів за цей період</p>
          ) : (
            <div className="flex flex-col gap-4">
              {topServices.map(svc => (
                <ServiceRow key={svc.name} svc={svc} maxRev={maxSvcRev} />
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Top products ── */}
      <div className="bento-card p-5 relative overflow-hidden">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-4">Продажі товарів</p>
        {!isPro && <ProLock compact />}
        {isPro && (
          isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton h="h-3" w="w-36" />
                  <Skeleton h="h-1.5" rounded="rounded-full" />
                </div>
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-[#A8928D] text-center py-4">Немає продажів за цей період</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topProducts.map((prod, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#A8928D] w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-[#2C1A14] truncate pr-2">{prod.name}</span>
                      <span className="text-xs font-medium text-[#5C9E7A] flex-shrink-0">{formatPrice(prod.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F5E8E3]">
                      <div className="h-full rounded-full bg-[#D4935A]/60 transition-all duration-700"
                        style={{ width: `${Math.round((prod.revenue / maxProdRev) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] text-[#A8928D]">Продано: {prod.qty} шт.</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── CSV Export ── */}
      <div className="bento-card p-5 relative overflow-hidden">
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide">Експорт звіту</p>
          <ShoppingBag size={14} className="text-[#A8928D]" />
        </div>
        <p className="text-xs text-[#A8928D] mb-4">CSV з усіма транзакціями · {range.label}</p>
        {!isPro && <ProLock compact />}
        {isPro && (
          <button onClick={handleExport} disabled={exporting || isLoading}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#6B8C8B] active:scale-[0.98] transition-all disabled:opacity-50">
            {exporting
              ? <><Loader2 size={16} className="animate-spin" /> Генеруємо...</>
              : <><Download size={16} /> Завантажити CSV</>}
          </button>
        )}
      </div>

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
