'use client';

import React from 'react';
import { Crown } from 'lucide-react';
import { formatPrice } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';
import type { TopClient } from '@/lib/supabase/hooks/useAnalytics';

/**
 * Клієнти з асиметричною ієрархією (Принцип темного блоку):
 * №1 — featured VIP (велика картка на всю ширину), решта — компактний список.
 * Нуль рівних карток.
 */
export function FeaturedClients({
  clients,
  onOpenClient,
}: {
  clients: TopClient[];
  onOpenClient: (clientId: string, clientName: string) => void;
}) {
  if (clients.length === 0) return null;
  const [hero, ...rest] = clients;
  const heroAvg = hero.visits > 0 ? Math.round(hero.revenue / hero.visits) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
      {/* ── VIP №1 ── */}
      <button
        type="button"
        onClick={() => hero.clientId && onOpenClient(hero.clientId, hero.clientName)}
        disabled={!hero.clientId}
        className="lg:col-span-5 text-left rounded-2xl p-5 bg-primary/[0.05] border border-primary/15 hover:bg-primary/[0.08] transition-colors duration-150 active:scale-[0.99] cursor-pointer flex flex-col justify-between gap-4"
      >
        <div className="flex items-center gap-2 text-primary">
          <Crown size={14} />
          <span className="text-[11px] font-semibold">Топ-клієнт періоду</span>
        </div>
        <div>
          <h4 className="heading-serif text-[26px] leading-none text-foreground truncate">{hero.clientName}</h4>
          <p className="text-xs text-text-sub mt-1.5 tabular-nums">
            {hero.visits} {pluralUk(hero.visits, 'відвідування', 'відвідування', 'відвідувань')} · сер. чек {formatPrice(heroAvg)}
          </p>
        </div>
        <p className="metric-value text-3xl font-semibold text-foreground leading-none">
          {formatPrice(Math.round(hero.revenue))}
        </p>
      </button>

      {/* ── Решта №2-N ── */}
      <div className="lg:col-span-7 flex flex-col">
        {rest.map((c, i) => (
          <button
            type="button"
            key={i}
            onClick={() => c.clientId && onOpenClient(c.clientId, c.clientName)}
            disabled={!c.clientId}
            className="flex items-center gap-3.5 py-3 border-b border-border/30 last:border-0 text-left w-full cursor-pointer hover:bg-secondary/40 rounded-lg px-2 -mx-2 transition-colors duration-150"
          >
            <span className="metric-value text-sm font-semibold text-text-sub w-5 flex-shrink-0 text-center">{i + 2}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{c.clientName}</p>
              <p className="text-[11px] text-text-sub tabular-nums">{c.visits} {pluralUk(c.visits, 'відвідування', 'відвідування', 'відвідувань')}</p>
            </div>
            <p className="metric-value text-sm font-semibold text-foreground flex-shrink-0">{formatPrice(Math.round(c.revenue))}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
