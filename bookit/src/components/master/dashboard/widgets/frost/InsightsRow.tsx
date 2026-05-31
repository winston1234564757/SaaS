'use client';

import { useState, useMemo } from 'react';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';
import { TrendingUp, TrendingDown, Users, ChevronRight } from 'lucide-react';
import { ClientDetailSheet } from '@/components/master/clients/ClientDetailSheet';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';

function fmtClientName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? name;
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekRange(offsetWeeks = 0) {
  const now = getNow();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toISO(monday), to: toISO(sunday) };
}

function TopClientCard({ onOpen }: { onOpen: (c: ClientRow) => void }) {
  const { from, to } = getWeekRange(0);
  const { bookings, isLoading } = useBookings(from, to);

  const topClient = useMemo(() => {
    if (!bookings?.length) return null;
    const grouped = new Map<string, { count: number; phone: string; spent: number; lastDate: string }>();
    bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const name = b.client_name || 'Невідомий';
      const prev = grouped.get(name) ?? { count: 0, phone: b.client_phone, spent: 0, lastDate: '' };
      grouped.set(name, {
        count: prev.count + 1, phone: b.client_phone || prev.phone,
        spent: prev.spent + (b.status === 'completed' ? b.total_price : 0),
        lastDate: b.date > prev.lastDate ? b.date : prev.lastDate,
      });
    });
    let topName = ''; let topData = { count: 0, phone: '', spent: 0, lastDate: '' };
    grouped.forEach((data, name) => { if (data.count > topData.count) { topData = data; topName = name; } });
    return topData.count > 0
      ? { name: topName, count: topData.count, phone: topData.phone, totalSpent: topData.spent, lastVisitAt: topData.lastDate || null }
      : null;
  }, [bookings]);

  const initials = topClient ? topClient.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '';

  const handleOpen = () => {
    if (!topClient) return;
    onOpen({
      id: topClient.phone, client_id: null, client_name: topClient.name,
      client_phone: topClient.phone, total_visits: topClient.count,
      total_spent: topClient.totalSpent,
      average_check: topClient.count > 0 ? Math.round(topClient.totalSpent / topClient.count) : 0,
      last_visit_at: topClient.lastVisitAt, last_service_name: null,
      is_vip: false, relation_id: null, retention_status: 'active',
      health_notes: null, medical_notes: null,
    });
  };

  return (
    <div className="bento-card p-4 flex flex-col">
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)] mb-3">
        Топ клієнт тижня
      </p>

      {isLoading ? (
        <div className="flex flex-col flex-1 gap-3">
          <div className="skeleton-shimmer size-11 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton-shimmer h-3.5 w-24 rounded-full" />
            <div className="skeleton-shimmer h-3 w-16 rounded-full" />
          </div>
        </div>
      ) : topClient ? (
        <button type="button" className="flex flex-col flex-1 text-left w-full bg-transparent border-0 p-0 cursor-pointer" onClick={handleOpen}>
          {/* Avatar */}
          <div
            className="size-11 rounded-full flex items-center justify-center text-[14px] font-bold mb-3 flex-shrink-0"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
          >
            {initials}
          </div>

          {/* Name + stats */}
          <p className="font-bold text-[15px] leading-tight" style={{ color: 'var(--text-primary)' }}>
            {fmtClientName(topClient.name)}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {topClient.count} {pluralUk(topClient.count, 'візит', 'візити', 'візитів')} цього тижня
          </p>

          {/* Total spent */}
          {topClient.totalSpent > 0 && (
            <p className="metric-value text-[1.25rem] font-bold mt-2 leading-none" style={{ color: 'var(--text-primary)' }}>
              {formatPrice(topClient.totalSpent)}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* CTA footer */}
          <div
            className="flex items-center justify-between pt-3 mt-3"
            style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}
          >
            <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
              Профіль клієнта
            </span>
            <ChevronRight size={12} strokeWidth={2} style={{ color: 'var(--accent)' }} />
          </div>
        </button>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <div
            className="size-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}
          >
            <Users size={18} strokeWidth={1.4} style={{ color: 'var(--accent)', opacity: 0.6 }} />
          </div>
          <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            Записів ще немає
          </p>
        </div>
      )}
    </div>
  );
}

function AvgCheckCard() {
  const { from, to }    = getWeekRange(0);
  const prevWeek        = getWeekRange(-1);
  const { bookings: thisBookings, isLoading } = useBookings(from, to);
  const { bookings: prevBookings }            = useBookings(prevWeek.from, prevWeek.to);

  const thisAvg = useMemo(() => {
    const paid = (thisBookings ?? []).filter(b => b.status === 'completed');
    if (!paid.length) return 0;
    return Math.round(paid.reduce((s, b) => s + b.total_price, 0) / paid.length);
  }, [thisBookings]);

  const prevAvg = useMemo(() => {
    const paid = (prevBookings ?? []).filter(b => b.status === 'completed');
    if (!paid.length) return 0;
    return Math.round(paid.reduce((s, b) => s + b.total_price, 0) / paid.length);
  }, [prevBookings]);

  const deltaPct   = prevAvg > 0 ? Math.round(((thisAvg - prevAvg) / prevAvg) * 100) : null;
  const isPositive = deltaPct !== null && deltaPct >= 0;
  const maxVal     = Math.max(thisAvg, prevAvg, 1);

  return (
    <div className="bento-card p-4 flex flex-col">
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)] mb-3">
        Середній чек
      </p>

      {isLoading ? (
        <div className="flex flex-col flex-1 gap-3">
          <div className="skeleton-shimmer h-8 w-20 rounded-xl" />
          <div className="skeleton-shimmer h-3 w-14 rounded-full" />
          <div className="mt-auto space-y-3">
            <div className="skeleton-shimmer h-3 w-full rounded-full" />
            <div className="skeleton-shimmer h-3 w-full rounded-full" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          {/* Main metric */}
          <p className="metric-value text-[1.6rem] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {thisAvg > 0 ? formatPrice(thisAvg) : '—'}
          </p>

          {/* Delta badge */}
          {deltaPct !== null && (
            <div
              className="flex items-center gap-1 mt-1.5 text-[11px] font-bold"
              style={{ color: isPositive ? 'var(--success)' : 'var(--error)' }}
            >
              {isPositive ? <TrendingUp size={10} strokeWidth={2} /> : <TrendingDown size={10} strokeWidth={2} />}
              <span>{deltaPct > 0 ? '+' : ''}{deltaPct}%</span>
              <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>vs минулий</span>
            </div>
          )}

          {/* Comparison bars pinned to bottom */}
          {(thisAvg > 0 || prevAvg > 0) ? (
            <div
              className="mt-auto pt-3 space-y-2.5"
              style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}
            >
              {[
                { label: 'Цей тиждень', value: thisAvg, primary: true },
                { label: 'Минулий',     value: prevAvg, primary: false },
              ].map(({ label, value, primary }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                      {label}
                    </span>
                    <span
                      className="metric-value text-[11px] font-bold tabular-nums"
                      style={{ color: primary ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                    >
                      {value > 0 ? formatPrice(value) : '—'}
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width:      `${Math.round((value / maxVal) * 100)}%`,
                        background: primary ? 'var(--accent)' : 'var(--border-strong)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-auto pt-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                Завершених записів ще немає
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function InsightsRow() {
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 flex-1">
        <TopClientCard onOpen={setSelectedClient} />
        <AvgCheckCard />
      </div>
      <ClientDetailSheet client={selectedClient} onClose={() => setSelectedClient(null)} />
    </>
  );
}
