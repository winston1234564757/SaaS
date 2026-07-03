'use client';

import { useMemo } from 'react';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getWeekRange } from '@/lib/utils/dates';

export interface ServiceSlice {
  name: string;
  count: number;
  revenue: number;
  avgPrice: number;
  sharePct: number;
}

export interface WeeklyTopClient {
  name: string;
  count: number;
  phone: string;
  totalSpent: number;
  lastVisitAt: string | null;
}

export interface WeeklyInsightsData {
  /** Середній чек завершених записів цього тижня (₴, округлено). 0 = ще нема completed. */
  avgCheck: number;
  /** Δ% середнього чека до минулого тижня, або null якщо минулий тиждень без completed. */
  delta: number | null;
  /** Середній чек минулого тижня — для порівняльних смуг. */
  prevAvg: number;
  /** Розбивка чека по послугах (спад за виручкою) — для Sheet. */
  breakdown: ServiceSlice[];
  /** К-сть завершених записів цього тижня. */
  completedCount: number;
  /** Топ-клієнт тижня за к-стю візитів, або null. */
  topClient: WeeklyTopClient | null;
  /** Чи є хоч один не-скасований запис цього тижня (розрізнити empty від partial). */
  hasBookings: boolean;
  isLoading: boolean;
}

export function useWeeklyInsights(): WeeklyInsightsData {
  const { from, to }   = getWeekRange(0);
  const prev           = getWeekRange(-1);
  const { bookings, isLoading }     = useBookings(from, to);
  const { bookings: prevBookings }  = useBookings(prev.from, prev.to);

  const derived = useMemo(() => {
    const list = bookings ?? [];
    const valid = list.filter(b => b.status !== 'cancelled');
    const paid  = list.filter(b => b.status === 'completed');

    // ── Середній чек + розбивка по послугах ──
    const avgCheck = paid.length
      ? Math.round(paid.reduce((s, b) => s + b.total_price, 0) / paid.length)
      : 0;

    const svcMap = new Map<string, { count: number; revenue: number }>();
    paid.forEach(b => b.services.forEach(s => {
      const prevS = svcMap.get(s.name) ?? { count: 0, revenue: 0 };
      svcMap.set(s.name, { count: prevS.count + 1, revenue: prevS.revenue + s.price });
    }));
    const svcTotal = [...svcMap.values()].reduce((sum, v) => sum + v.revenue, 0);
    const breakdown: ServiceSlice[] = [...svcMap.entries()]
      .map(([name, v]) => ({
        name,
        count: v.count,
        revenue: v.revenue,
        avgPrice: v.count > 0 ? Math.round(v.revenue / v.count) : 0,
        sharePct: svcTotal > 0 ? Math.round((v.revenue / svcTotal) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── Топ-клієнт тижня (за візитами серед не-скасованих) ──
    const clientMap = new Map<string, { count: number; phone: string; spent: number; lastDate: string }>();
    valid.forEach(b => {
      const name = b.client_name || 'Невідомий';
      const prevC = clientMap.get(name) ?? { count: 0, phone: b.client_phone, spent: 0, lastDate: '' };
      clientMap.set(name, {
        count: prevC.count + 1,
        phone: b.client_phone || prevC.phone,
        spent: prevC.spent + (b.status === 'completed' ? b.total_price : 0),
        lastDate: b.date > prevC.lastDate ? b.date : prevC.lastDate,
      });
    });
    let topName = '';
    let topData = { count: 0, phone: '', spent: 0, lastDate: '' };
    clientMap.forEach((data, name) => { if (data.count > topData.count) { topData = data; topName = name; } });
    const topClient: WeeklyTopClient | null = topData.count > 0
      ? { name: topName, count: topData.count, phone: topData.phone, totalSpent: topData.spent, lastVisitAt: topData.lastDate || null }
      : null;

    return { avgCheck, breakdown, completedCount: paid.length, topClient, hasBookings: valid.length > 0 };
  }, [bookings]);

  const prevAvg = useMemo(() => {
    const paid = (prevBookings ?? []).filter(b => b.status === 'completed');
    if (!paid.length) return 0;
    return Math.round(paid.reduce((s, b) => s + b.total_price, 0) / paid.length);
  }, [prevBookings]);

  const delta = prevAvg > 0 && derived.avgCheck > 0
    ? Math.round(((derived.avgCheck - prevAvg) / prevAvg) * 100)
    : null;

  return { ...derived, prevAvg, delta, isLoading };
}
