'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface SourceAttributionPoint {
  source: string;
  count: number;
  /** Записів, що дійшли до завершеного візиту */
  completedCount: number;
  /** Виручка у гривнях (лише completed) */
  revenue: number;
  /** Частка від усіх записів періоду (%) */
  pct: number;
  /** Δ кількості записів проти попереднього періоду (%), null якщо без бази порівняння */
  deltaPct: number | null;
}

type Row = { source: string | null; total_price: number; status: string };

function normalizeSource(raw: string | null): string {
  const s = raw || 'public_page';
  if (s === 'instagram_link' || s === 'instagram') return 'Instagram';
  if (s === 'telegram_bot' || s === 'tg') return 'Telegram';
  if (s === 'manual' || s === 'direct') return 'Вручну';
  if (s === 'explore') return 'Каталог';
  return 'Сайт-візитка';
}

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

export function useSourceAttribution({
  start,
  end,
  compareTrend = false,
}: {
  start: string;
  end: string;
  /** Тягнути попередній період для per-канал Δ (Pro) */
  compareTrend?: boolean;
}) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery({
    queryKey: ['analytics-tab-source', masterId, start, end, compareTrend],
    enabled: !!masterId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<SourceAttributionPoint[]> => {
      const supabase = createClient();

      const fetchRows = async (from: string, to: string): Promise<Row[]> => {
        const { data, error } = await supabase
          .from('bookings')
          .select('source, total_price, status')
          .eq('master_id', masterId!)
          .gte('date', from)
          .lte('date', to);
        if (error) throw error;
        return (data ?? []) as Row[];
      };

      // Попередній період — лише для Pro (Δ-тренд); від поточного не залежить → паралельно
      const prevWindow = compareTrend ? previousWindow(start, end) : null;
      const [rows, prevRows] = await Promise.all([
        fetchRows(start, end),
        prevWindow ? fetchRows(prevWindow.prevStart, prevWindow.prevEnd) : Promise.resolve([] as Row[]),
      ]);

      const prevCounts = new Map<string, number>();
      prevRows.forEach((r) => {
        const key = normalizeSource(r.source);
        prevCounts.set(key, (prevCounts.get(key) ?? 0) + 1);
      });

      const totalCount = rows.length;
      const agg = new Map<string, { count: number; completedCount: number; revenue: number }>();

      rows.forEach((r) => {
        const key = normalizeSource(r.source);
        const cur = agg.get(key) ?? { count: 0, completedCount: 0, revenue: 0 };
        const completed = r.status === 'completed';
        agg.set(key, {
          count: cur.count + 1,
          completedCount: cur.completedCount + (completed ? 1 : 0),
          revenue: cur.revenue + (completed ? Number(r.total_price) : 0),
        });
      });

      const result: SourceAttributionPoint[] = [];
      agg.forEach((val, key) => {
        const prev = prevCounts.get(key);
        const deltaPct =
          compareTrend && prev !== undefined && prev > 0
            ? Math.round(((val.count - prev) / prev) * 100)
            : null;
        result.push({
          source: key,
          count: val.count,
          completedCount: val.completedCount,
          revenue: val.revenue,
          pct: totalCount > 0 ? Math.round((val.count / totalCount) * 100) : 0,
          deltaPct,
        });
      });

      return result.sort((a, b) => b.count - a.count);
    },
  });
}
