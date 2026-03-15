'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, TrendingDown, Users, Lock, Minus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/components/master/services/types';

interface AnalyticsPageProps {
  isPro: boolean;
}

interface MonthStats {
  month: string;
  bookings: number;
  revenue: number;
}

const BAR_MAX_PX = 80;

// ── Linear regression ──────────────────────────────────────────────────────
function linearRegression(ys: number[]): { forecast: number; slope: number; r2: number } {
  const n = ys.length;
  if (n < 2) return { forecast: ys[0] ?? 0, slope: 0, r2: 0 };
  const xs = ys.map((_, i) => i);
  const sumX = xs.reduce((s, x) => s + x, 0);
  const sumY = ys.reduce((s, y) => s + y, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const forecast = Math.max(0, Math.round(slope * n + intercept));
  // R²
  const meanY = sumY / n;
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const ssRes = ys.reduce((s, y, i) => s + (y - (slope * i + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  return { forecast, slope, r2 };
}

export function AnalyticsPage({ isPro }: AnalyticsPageProps) {
  const { masterProfile } = useMasterContext();
  const supabase = createClient();

  const [thisMonth, setThisMonth] = useState({ bookings: 0, revenue: 0, clients: 0 });
  const [monthStats, setMonthStats] = useState<MonthStats[]>([]);
  const [topServices, setTopServices] = useState<{ name: string; revenue: number; count: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; revenue: number; qty: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const UA_MONTHS_SHORT = ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'];

  useEffect(() => {
    if (!masterProfile?.id) return;
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    Promise.all([
      // Поточний місяць
      supabase
        .from('bookings')
        .select('total_price, client_id, status')
        .eq('master_id', masterProfile.id)
        .gte('date', firstDay)
        .lte('date', lastDay),
      // Останні 6 місяців (тільки Pro)
      isPro ? supabase
        .from('bookings')
        .select('date, total_price, status')
        .eq('master_id', masterProfile.id)
        .gte('date', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10))
        .lte('date', lastDay) : Promise.resolve({ data: null }),
      // Топ-послуги — completed цього місяця (тільки Pro)
      isPro ? supabase
        .from('bookings')
        .select('booking_services(service_name, service_price)')
        .eq('master_id', masterProfile.id)
        .eq('status', 'completed')
        .gte('date', firstDay)
        .lte('date', lastDay) : Promise.resolve({ data: null }),
      // Топ-товари — completed цього місяця (тільки Pro)
      isPro ? supabase
        .from('bookings')
        .select('booking_products(product_name, product_price, quantity)')
        .eq('master_id', masterProfile.id)
        .eq('status', 'completed')
        .gte('date', firstDay)
        .lte('date', lastDay) : Promise.resolve({ data: null }),
    ]).then(([curr, hist, topRaw, topProdRaw]) => {
      const data = curr.data ?? [];
      const completed = data.filter(b => b.status === 'completed');
      const revenue = completed.reduce((s, b) => s + Number(b.total_price), 0);
      const uniqueClients = new Set(completed.map(b => b.client_id).filter(Boolean)).size;
      setThisMonth({ bookings: data.length, revenue, clients: uniqueClients });

      if (hist.data) {
        const map = new Map<string, { bookings: number; revenue: number }>();
        hist.data.forEach((b: any) => {
          const key = b.date.slice(0, 7);
          const cur = map.get(key) ?? { bookings: 0, revenue: 0 };
          map.set(key, {
            bookings: cur.bookings + 1,
            revenue: b.status === 'completed' ? cur.revenue + Number(b.total_price) : cur.revenue,
          });
        });
        const stats: MonthStats[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toISOString().slice(0, 7);
          const m = map.get(key) ?? { bookings: 0, revenue: 0 };
          stats.push({ month: UA_MONTHS_SHORT[d.getMonth()], ...m });
        }
        setMonthStats(stats);
      }

      if (topRaw.data) {
        const svcMap = new Map<string, { count: number; revenue: number }>();
        topRaw.data.forEach((b: any) => {
          (b.booking_services ?? []).forEach((s: any) => {
            const cur = svcMap.get(s.service_name) ?? { count: 0, revenue: 0 };
            svcMap.set(s.service_name, { count: cur.count + 1, revenue: cur.revenue + Number(s.service_price) });
          });
        });
        const sorted = Array.from(svcMap.entries())
          .map(([name, d]) => ({ name, ...d }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        setTopServices(sorted);
      }

      if (topProdRaw.data) {
        const prodMap = new Map<string, { qty: number; revenue: number }>();
        topProdRaw.data.forEach((b: any) => {
          (b.booking_products ?? []).forEach((p: any) => {
            const cur = prodMap.get(p.product_name) ?? { qty: 0, revenue: 0 };
            const itemRevenue = Number(p.product_price) * Number(p.quantity);
            prodMap.set(p.product_name, { qty: cur.qty + Number(p.quantity), revenue: cur.revenue + itemRevenue });
          });
        });
        const sorted = Array.from(prodMap.entries())
          .map(([name, d]) => ({ name, ...d }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);
        setTopProducts(sorted);
      }

      setIsLoading(false);
    });
  }, [masterProfile?.id, isPro]);

  const maxRevenue = Math.max(...monthStats.map(m => m.revenue), 1);

  // Revenue Forecast
  const forecast = isPro && monthStats.length >= 2
    ? linearRegression(monthStats.map(m => m.revenue))
    : null;
  const currentMonthRevenue = monthStats[monthStats.length - 1]?.revenue ?? 0;
  const forecastDelta = forecast ? forecast.forecast - currentMonthRevenue : 0;
  const forecastPct = currentMonthRevenue > 0 ? Math.round((forecastDelta / currentMonthRevenue) * 100) : null;

  const UA_MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
  const nextMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return UA_MONTHS[d.getMonth()]; })();

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Аналітика</h1>
        <p className="text-sm text-[#A8928D]">Статистика та звіти</p>
      </div>

      {/* Цей місяць */}
      <div className="bento-card p-5">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-4">Цей місяць</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: BarChart2, label: 'Записів',   value: thisMonth.bookings,         color: '#789A99' },
            { icon: TrendingUp, label: 'Виручка',  value: formatPrice(thisMonth.revenue), color: '#5C9E7A' },
            { icon: Users,      label: 'Клієнтів', value: thisMonth.clients,           color: '#D4935A' },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/50">
              <stat.icon size={18} style={{ color: stat.color }} />
              <p className="text-base font-bold text-[#2C1A14] leading-none mt-1">{stat.value}</p>
              <p className="text-[11px] text-[#A8928D]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Графік 6 місяців (Pro) */}
      <div className="bento-card p-5 relative overflow-hidden">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-4">Виручка за 6 місяців</p>

        {!isPro && (
          <div className="absolute inset-0 backdrop-blur-[3px] bg-white/40 z-10 flex flex-col items-center justify-center gap-3 rounded-[24px]">
            <div className="w-12 h-12 rounded-full bg-[#789A99]/15 flex items-center justify-center">
              <Lock size={20} className="text-[#789A99]" />
            </div>
            <p className="text-sm font-semibold text-[#2C1A14]">Тільки для Pro</p>
            <p className="text-xs text-[#A8928D] text-center max-w-[180px]">Детальна аналітика доступна на тарифі Pro або Studio</p>
            <Link href="/dashboard/billing" className="mt-1 px-4 py-2 rounded-xl bg-[#789A99] text-white text-xs font-semibold">
              Перейти на Pro — 349 ₴/міс
            </Link>
          </div>
        )}

        {/* Барний графік */}
        <div className="flex items-end gap-2 h-24">
          {(isPro ? monthStats : Array(6).fill({ month: '...', bookings: 3, revenue: 1200 })).map((m: MonthStats, i: number) => {
            const h = m.revenue === 0 ? 4 : Math.round((m.revenue / maxRevenue) * BAR_MAX_PX);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: h }}
                  transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
                  className="w-full rounded-t-xl bg-[#789A99]/40"
                  style={{ minHeight: 4 }}
                />
                <span className="text-[10px] text-[#A8928D]">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Forecast (Pro) */}
      <div className="bento-card p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide">Прогноз виручки</p>
          <span className="text-[10px] font-medium text-[#A8928D] bg-[#F5E8E3] px-2 py-0.5 rounded-full">AI-free · linear regression</span>
        </div>

        {!isPro && (
          <div className="absolute inset-0 backdrop-blur-[3px] bg-white/40 z-10 flex flex-col items-center justify-center gap-3 rounded-[24px]">
            <div className="w-12 h-12 rounded-full bg-[#789A99]/15 flex items-center justify-center">
              <Lock size={20} className="text-[#789A99]" />
            </div>
            <p className="text-sm font-semibold text-[#2C1A14]">Тільки для Pro</p>
            <Link href="/dashboard/billing" className="mt-1 px-4 py-2 rounded-xl bg-[#789A99] text-white text-xs font-semibold">
              Перейти на Pro — 349 ₴/міс
            </Link>
          </div>
        )}

        {forecast ? (
          <div className="flex flex-col gap-4">
            {/* Main forecast */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/50">
              <div>
                <p className="text-xs text-[#A8928D] mb-1">{nextMonth} — очікувана виручка</p>
                <p className="text-2xl font-bold text-[#2C1A14]">{formatPrice(forecast.forecast)}</p>
              </div>
              <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl ${
                forecastDelta > 0 ? 'bg-[#5C9E7A]/10' : forecastDelta < 0 ? 'bg-[#C05B5B]/10' : 'bg-[#F5E8E3]'
              }`}>
                {forecastDelta > 0
                  ? <TrendingUp size={20} className="text-[#5C9E7A]" />
                  : forecastDelta < 0
                  ? <TrendingDown size={20} className="text-[#C05B5B]" />
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

            {/* Mini trend chart: 6 months + forecast bar */}
            <div>
              <p className="text-[11px] text-[#A8928D] mb-2">Тренд + прогноз</p>
              <div className="flex items-end gap-1.5 h-14">
                {monthStats.map((m, i) => {
                  const allVals = [...monthStats.map(x => x.revenue), forecast.forecast];
                  const maxVal = Math.max(...allVals, 1);
                  const h = Math.max(3, Math.round((m.revenue / maxVal) * 48));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: h }}
                        transition={{ delay: 0.05 + i * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
                        className="w-full rounded-t-lg bg-[#789A99]/40"
                      />
                      <span className="text-[9px] text-[#A8928D]">{m.month}</span>
                    </div>
                  );
                })}
                {/* Forecast bar */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: Math.max(3, Math.round((forecast.forecast / Math.max(...monthStats.map(x => x.revenue), forecast.forecast, 1)) * 48)) }}
                    transition={{ delay: 0.05 + monthStats.length * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
                    className="w-full rounded-t-lg border-2 border-dashed border-[#789A99] bg-[#789A99]/15"
                  />
                  <span className="text-[9px] font-semibold text-[#789A99]">{nextMonth.slice(0, 3)}</span>
                </div>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#F5E8E3] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#789A99]/60 rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(forecast.r2 * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#A8928D] flex-shrink-0">
                Точність: {Math.round(forecast.r2 * 100)}%
              </span>
            </div>
          </div>
        ) : isPro ? (
          <p className="text-sm text-[#A8928D] text-center py-4">
            Потрібно мінімум 2 місяці даних для прогнозу
          </p>
        ) : null}
      </div>

      {/* Продажі товарів (Pro) */}
      <div className="bento-card p-5 relative overflow-hidden">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-4">Продажі товарів</p>

        {!isPro && (
          <div className="absolute inset-0 backdrop-blur-[3px] bg-white/40 z-10 flex flex-col items-center justify-center gap-2 rounded-[24px]">
            <Lock size={18} className="text-[#789A99]" />
            <p className="text-xs font-semibold text-[#2C1A14]">Тільки для Pro</p>
          </div>
        )}

        {topProducts.length === 0 && isPro ? (
          <p className="text-sm text-[#A8928D] text-center py-4">
            Ще немає продажів товарів цього місяця
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {(isPro ? topProducts : [
              { name: 'Гель-лак OPI', revenue: 3600, qty: 20 },
              { name: 'База Esthetic', revenue: 2400, qty: 20 },
              { name: 'Засіб для кутикули', revenue: 800, qty: 10 },
            ]).map((prod, i) => {
              const maxRev = Math.max(...(isPro ? topProducts : []).map(p => p.revenue), prod.revenue, 1);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#A8928D] w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-[#2C1A14] truncate pr-2">{prod.name}</span>
                      <span className="text-xs font-medium text-[#5C9E7A] flex-shrink-0">{formatPrice(prod.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F5E8E3]">
                      <div
                        className="h-full rounded-full bg-[#D4935A]/60 transition-all duration-700"
                        style={{ width: `${Math.round((prod.revenue / maxRev) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#A8928D]">Продано: {prod.qty} шт.</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Топ послуги (Pro) */}
      <div className="bento-card p-5 relative overflow-hidden">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-4">Топ послуги</p>

        {!isPro && (
          <div className="absolute inset-0 backdrop-blur-[3px] bg-white/40 z-10 flex flex-col items-center justify-center gap-2 rounded-[24px]">
            <Lock size={18} className="text-[#789A99]" />
            <p className="text-xs font-semibold text-[#2C1A14]">Тільки для Pro</p>
          </div>
        )}

        {topServices.length === 0 && isPro ? (
          <p className="text-sm text-[#A8928D] text-center py-4">
            Ще немає завершених записів цього місяця
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {(isPro ? topServices : [
              { name: 'Класичний манікюр', revenue: 7200, count: 3 },
              { name: 'Покриття гелем', revenue: 4800, count: 2 },
              { name: 'Манікюр + покриття', revenue: 2400, count: 1 },
            ]).map((svc, i) => {
              const maxRev = Math.max(...(isPro ? topServices : []).map(s => s.revenue), svc.revenue, 1);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#A8928D] w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-[#2C1A14] truncate pr-2">{svc.name}</span>
                      <span className="text-xs font-medium text-[#5C9E7A] flex-shrink-0">{formatPrice(svc.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F5E8E3]">
                      <div
                        className="h-full rounded-full bg-[#789A99]/60 transition-all duration-700"
                        style={{ width: `${Math.round((svc.revenue / maxRev) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
