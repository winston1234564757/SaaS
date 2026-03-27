'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { format } from 'date-fns';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { getPrevPeriodRange, type Preset } from './useDateRange';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsBookingRow {
  date: string;
  status: string;
  total_price: number;
  total_services_price: number | null;
  total_products_price: number | null;
  client_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  source: string | null;
  booking_services: { service_name: string; service_price: number; duration_minutes: number }[];
  booking_products: { product_name: string; product_price: number; quantity: number }[];
}

interface TrendBookingRow { date: string; status: string; total_price: number; }
interface PrevBookingRow  { status: string; total_price: number; }
interface VisitRow        { client_phone: string | null; }

interface CsvBookingRow {
  date: string | null;
  start_time: string | null;
  client_name: string | null;
  client_phone: string | null;
  booking_services: { service_name: string }[] | null;
  booking_products: { product_name: string; quantity: number }[] | null;
  discount_percent: number | null;
  total_price: number;
  status: string;
  source: string | null;
}

export interface MonthStat { month: string; bookings: number; revenue: number; }

export interface TopService {
  name:         string;
  revenue:      number;
  count:        number;
  crossSellRate: number;  // % of bookings with this service that also had products
}

export interface TopProduct { name: string; revenue: number; qty: number; }

export interface TopClient {
  clientId:   string | null;
  clientName: string;
  revenue:    number;
  visits:     number;
}

export interface RetentionData { newClients: number; returningClients: number; }

export interface BentoData {
  revenueByCategory: { services: number; products: number };
  topClients:        TopClient[];
  bestDayOfWeek:     { dayIdx: number; day: string; pct: number; data: number[]; bookings: number[] };
  avgCheck:          { current: number; prev: number | null; delta: number | null };
  hoursBooked:       number;
  sourceBreakdown:   { online: number; manual: number; total: number };
}

export interface AnalyticsData {
  summary:    { bookings: number; revenue: number; activeClients: number; newClients: number | null };
  monthStats: MonthStat[];
  topServices: TopService[];
  topProducts: TopProduct[];
  retention:  RetentionData | null;
  bento:      BentoData | null;  // Pro only
}

// ── Constants ─────────────────────────────────────────────────────────────────

const UA_MONTHS_SHORT = ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'];
const UA_DOW          = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// Use date-fns format — avoids UTC offset that toISOString() introduces
function toYMD(d: Date) { return format(d, 'yyyy-MM-dd'); }

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAnalytics(
  { startDate, endDate }: { startDate: string; endDate: string },
  isPro: boolean,
  preset: Preset,
  offset: number,
) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  return useQuery({
    queryKey: ['analytics-v2', masterId, startDate, endDate, isPro],
    enabled:  !!masterId,
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,

    queryFn: async (): Promise<AnalyticsData> => {
      const supabase = createClient();

      const now          = new Date();
      // End of CURRENT month (not today) — so the current month in the trend
      // chart shows a full month, not truncated at today's date
      const endOfMonth   = toYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      const sixMonthsAgo = toYMD(new Date(now.getFullYear(), now.getMonth() - 5, 1));
      const prevPeriod   = getPrevPeriodRange(preset, offset);

      // ── Parallel queries ─────────────────────────────────────────────────
      const [mainRes, trendRes, prevRes] = await Promise.all([
        // Rich main query — everything we need for the selected period
        supabase
          .from('bookings')
          .select(`
            date, status, total_price,
            total_services_price, total_products_price,
            client_id, client_name, client_phone, source,
            booking_services ( service_name, service_price, duration_minutes ),
            booking_products  ( product_name, product_price, quantity )
          `)
          .eq('master_id', masterId!)
          .gte('date', startDate)
          .lte('date', endDate),

        // 6-month trend (fixed window, independent of filter — keeps forecast alive)
        // Uses end-of-month so current month is always complete, not cut off at today
        isPro
          ? supabase
              .from('bookings')
              .select('date, total_price, status')
              .eq('master_id', masterId!)
              .gte('date', sixMonthsAgo)
              .lte('date', endOfMonth)
          : Promise.resolve({ data: null, error: null }),

        // Previous period — for avg check delta (Pro only)
        isPro && prevPeriod
          ? supabase
              .from('bookings')
              .select('total_price, status')
              .eq('master_id', masterId!)
              .gte('date', prevPeriod.startDate)
              .lte('date', prevPeriod.endDate)
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (mainRes.error)  throw mainRes.error;
      if (trendRes.error) throw trendRes.error;
      if (prevRes.error)  throw prevRes.error;

      const rows = (mainRes.data ?? []) as AnalyticsBookingRow[];

      // ── Summary ───────────────────────────────────────────────────────────
      const nonCancelled = rows.filter(b => b.status !== 'cancelled');
      const completed    = rows.filter(b => b.status === 'completed');
      const revenue      = completed.reduce((s, b) => s + Number(b.total_price), 0);
      // Active clients = unique phones (includes guests & manual — client_id may be null)
      const activePhones    = [...new Set(nonCancelled.map(b => b.client_phone as string).filter(Boolean))] as string[];
      // client_id set still needed for Pro bento top-clients
      const activeClientIds = [...new Set(nonCancelled.map(b => b.client_id as string).filter(Boolean))] as string[];

      // ── 6-month trend ─────────────────────────────────────────────────────
      const monthStats: MonthStat[] = [];
      if (trendRes.data) {
        const map = new Map<string, { bookings: number; revenue: number }>();
        for (const b of trendRes.data as TrendBookingRow[]) {
          const key = (b.date as string).slice(0, 7);
          const cur = map.get(key) ?? { bookings: 0, revenue: 0 };
          map.set(key, {
            bookings: cur.bookings + 1,
            revenue:  b.status === 'completed' ? cur.revenue + Number(b.total_price) : cur.revenue,
          });
        }
        for (let i = 5; i >= 0; i--) {
          const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = toYMD(d).slice(0, 7);
          const m   = map.get(key) ?? { bookings: 0, revenue: 0 };
          monthStats.push({ month: UA_MONTHS_SHORT[d.getMonth()], ...m });
        }
      }

      // ── Top services (with cross-sell rate) ───────────────────────────────
      const svcMap = new Map<string, { count: number; revenue: number; withProducts: number }>();
      for (const b of completed) {
        const hasProd = (b.booking_products ?? []).length > 0;
        for (const s of b.booking_services ?? []) {
          const cur = svcMap.get(s.service_name) ?? { count: 0, revenue: 0, withProducts: 0 };
          svcMap.set(s.service_name, {
            count:       cur.count + 1,
            revenue:     cur.revenue + Number(s.service_price),
            withProducts: cur.withProducts + (hasProd ? 1 : 0),
          });
        }
      }
      const topServices: TopService[] = Array.from(svcMap.entries())
        .map(([name, d]) => ({
          name,
          revenue:       d.revenue,
          count:         d.count,
          crossSellRate: d.count > 0 ? Math.round((d.withProducts / d.count) * 100) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // ── Top products ──────────────────────────────────────────────────────
      const prodMap = new Map<string, { qty: number; revenue: number }>();
      for (const b of completed) {
        for (const p of b.booking_products ?? []) {
          const cur = prodMap.get(p.product_name) ?? { qty: 0, revenue: 0 };
          prodMap.set(p.product_name, {
            qty:     cur.qty + Number(p.quantity),
            revenue: cur.revenue + Number(p.product_price) * Number(p.quantity),
          });
        }
      }
      const topProducts: TopProduct[] = Array.from(prodMap.entries())
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // ── Bento (Pro only) ─────────────────────────────────────────────────
      let bento: BentoData | null = null;

      if (isPro) {
        // Revenue by category
        const servicesRev = completed.reduce((s, b) => s + Number(b.total_services_price ?? 0), 0);
        const productsRev = completed.reduce((s, b) => s + Number(b.total_products_price ?? 0), 0);

        // Top 3 clients by revenue (from non-cancelled) — includes guests & manual
        const clientMap = new Map<string, { clientId: string | null; name: string; revenue: number; visits: number }>();
        for (const b of nonCancelled) {
          const key = (b.client_phone as string) || (b.client_name as string) || 'unknown';
          const cur = clientMap.get(key) ?? { clientId: b.client_id || null, name: b.client_name || 'Невідомий', revenue: 0, visits: 0 };
          clientMap.set(key, {
            clientId: cur.clientId,
            name:     cur.name,
            revenue:  cur.revenue + (b.status === 'completed' ? Number(b.total_price) : 0),
            visits:   cur.visits + 1,
          });
        }
        const topClients: TopClient[] = Array.from(clientMap.values())
          .map(d => ({ clientId: d.clientId, clientName: d.name, revenue: d.revenue, visits: d.visits }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3);

        // Best day of week (by revenue from completed)
        const dowRevenue  = new Array(7).fill(0) as number[];
        const dowBookings = new Array(7).fill(0) as number[];
        for (const b of completed) {
          // Use local Date constructor — avoids UTC midnight shift on date strings
          const [yr, mo, dy] = (b.date as string).split('-').map(Number);
          const d   = new Date(yr, mo - 1, dy);
          const dow = d.getDay(); // 0 = Sun
          dowRevenue[dow]  += Number(b.total_price);
          dowBookings[dow] += 1;
        }
        const maxDow    = dowRevenue.reduce((m, v, i) => v > dowRevenue[m] ? i : m, 0);
        const totalRev  = dowRevenue.reduce((s, v) => s + v, 0);
        const bestDayOfWeek = {
          dayIdx:   maxDow,
          day:      UA_DOW[maxDow],
          pct:      totalRev > 0 ? Math.round((dowRevenue[maxDow] / totalRev) * 100) : 0,
          data:     dowRevenue,
          bookings: dowBookings,
        };

        // Avg check (current period + prev period)
        const currentCompleted = completed.length;
        const currentAvg       = currentCompleted > 0 ? revenue / currentCompleted : 0;
        let prevAvg: number | null = null;
        if (prevRes.data) {
          const prevCompleted = (prevRes.data as PrevBookingRow[]).filter(b => b.status === 'completed');
          const prevRev       = prevCompleted.reduce((s, b) => s + Number(b.total_price), 0);
          prevAvg = prevCompleted.length > 0 ? prevRev / prevCompleted.length : null;
        }
        const avgCheckDelta = prevAvg !== null && currentAvg > 0
          ? Math.round(((currentAvg - prevAvg) / prevAvg) * 100)
          : null;

        // Hours booked (sum duration_minutes from booking_services of non-cancelled)
        let totalMins = 0;
        for (const b of nonCancelled) {
          for (const s of b.booking_services ?? []) {
            totalMins += Number(s.duration_minutes ?? 0);
          }
        }

        // Source breakdown
        const onlineCount = nonCancelled.filter(b => b.source !== 'manual').length;
        const manualCount = nonCancelled.filter(b => b.source === 'manual').length;

        bento = {
          revenueByCategory: { services: servicesRev, products: productsRev },
          topClients,
          bestDayOfWeek,
          avgCheck: {
            current: Math.round(currentAvg),
            prev:    prevAvg !== null ? Math.round(prevAvg) : null,
            delta:   avgCheckDelta,
          },
          hoursBooked: Math.round(totalMins / 60 * 10) / 10,
          sourceBreakdown: {
            online: onlineCount,
            manual: manualCount,
            total:  nonCancelled.length,
          },
        };
      }

      // ── Retention: Lifetime logic (sequential — depends on activePhones) ──
      // "Постійні" = клієнт має > 1 візит за весь час до endDate
      // "Нові"     = клієнт має рівно 1 візит (вперше прийшов у цьому періоді)
      let retention: RetentionData | null = null;
      let newClients: number | null = null;

      if (activePhones.length > 0) {
        const { data: allVisitsData } = await supabase
          .from('bookings')
          .select('client_phone')
          .eq('master_id', masterId!)
          .lte('date', endDate)
          .neq('status', 'cancelled')
          .in('client_phone', activePhones);

        const visitsMap = new Map<string, number>();
        for (const b of (allVisitsData ?? []) as VisitRow[]) {
          const p = b.client_phone as string;
          if (p) visitsMap.set(p, (visitsMap.get(p) ?? 0) + 1);
        }

        let returningClients = 0;
        let newCount         = 0;
        for (const phone of activePhones) {
          if ((visitsMap.get(phone) ?? 0) > 1) returningClients++;
          else newCount++;
        }
        newClients = newCount;
        retention  = { newClients, returningClients };
      } else {
        retention  = { newClients: 0, returningClients: 0 };
        newClients = 0;
      }

      return {
        summary: {
          bookings:      rows.length,
          revenue,
          activeClients: activePhones.length,  // phone-based: includes guests & manual
          newClients,
        },
        monthStats,
        topServices,
        topProducts,
        retention,
        bento,
      };
    },
  });
}

// ── Linear regression (kept here so AnalyticsPage can import it) ──────────────

export function linearRegression(ys: number[]) {
  const n = ys.length;
  if (n < 2) return { forecast: ys[0] ?? 0, slope: 0, r2: 0 };
  const xs    = ys.map((_, i) => i);
  const sumX  = xs.reduce((s, x) => s + x, 0);
  const sumY  = ys.reduce((s, y) => s + y, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const int_  = (sumY - slope * sumX) / n;
  const fc    = Math.max(0, Math.round(slope * n + int_));
  const meanY = sumY / n;
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const ssRes = ys.reduce((s, y, i) => s + (y - (slope * i + int_)) ** 2, 0);
  return { forecast: fc, slope, r2: ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot) };
}

// ── CSV Export ────────────────────────────────────────────────────────────────

export async function exportAnalyticsCsv(
  masterId: string,
  startDate: string,
  endDate: string,
): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase
    .from('bookings')
    .select(`
      date, start_time, client_name, client_phone,
      total_price, status, discount_percent, source,
      booking_services ( service_name, service_price ),
      booking_products ( product_name, product_price, quantity )
    `)
    .eq('master_id', masterId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date',       { ascending: true })
    .order('start_time', { ascending: true });

  if (!data?.length) return;

  const STATUS_UA: Record<string, string> = {
    pending: 'Очікує', confirmed: 'Підтверджено',
    completed: 'Завершено', cancelled: 'Скасовано', no_show: 'Не з\'явився',
  };

  const rows = [
    ['Дата', 'Час', 'Клієнт', 'Телефон', 'Послуги', 'Товари', 'Знижка %', 'Сума', 'Статус', 'Джерело'],
    ...(data as CsvBookingRow[]).map(b => [
      b.date ?? '',
      String(b.start_time ?? '').slice(0, 5),
      b.client_name  ?? '',
      b.client_phone ?? '',
      (b.booking_services ?? []).map((s) => s.service_name).join('; '),
      (b.booking_products  ?? []).map((p) => `${p.product_name} ×${p.quantity}`).join('; '),
      String(b.discount_percent ?? 0),
      Number(b.total_price).toFixed(2),
      STATUS_UA[b.status] ?? b.status ?? '',
      b.source === 'manual' ? 'Вручну' : 'Онлайн',
    ]),
  ];

  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `bookit-звіт-${startDate}—${endDate}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
}
