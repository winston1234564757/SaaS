'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface SourceAttributionPoint {
  source: string;
  count: number;
  revenue: number; // в копійках
  pct: number;
}

export function useSourceAttribution({ start, end }: { start: string; end: string }) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery({
    queryKey: ['analytics-tab-source', masterId, start, end],
    enabled: !!masterId,
    staleTime: 5 * 60_000, // 5 min
    queryFn: async (): Promise<SourceAttributionPoint[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('source, total_price, status')
        .eq('master_id', masterId!)
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;

      const rows = (data ?? []) as { source: string | null; total_price: number; status: string }[];
      const totalCount = rows.length;

      const sourceMap = new Map<string, { count: number; revenue: number }>();

      rows.forEach((r) => {
        // Стандартизуємо назву джерела
        let rawSource = r.source || 'public_page';
        if (rawSource === 'instagram_link' || rawSource === 'instagram') rawSource = 'Instagram';
        else if (rawSource === 'telegram_bot' || rawSource === 'tg') rawSource = 'Telegram';
        else if (rawSource === 'manual' || rawSource === 'direct') rawSource = 'Вручну';
        else if (rawSource === 'explore') rawSource = 'Каталог';
        else rawSource = 'Сайт-візитка';

        const cur = sourceMap.get(rawSource) ?? { count: 0, revenue: 0 };
        sourceMap.set(rawSource, {
          count: cur.count + 1,
          revenue: cur.revenue + (r.status === 'completed' ? Math.round(Number(r.total_price) * 100) : 0),
        });
      });

      const result: SourceAttributionPoint[] = [];
      sourceMap.forEach((val, key) => {
        result.push({
          source: key,
          count: val.count,
          revenue: val.revenue,
          pct: totalCount > 0 ? Math.round((val.count / totalCount) * 100) : 0,
        });
      });

      return result.sort((a, b) => b.count - a.count);
    },
  });
}
