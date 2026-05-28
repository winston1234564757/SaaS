'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';
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

interface TopClientData {
  name: string;
  count: number;
  phone: string;
  totalSpent: number;
  lastVisitAt: string | null;
}

function TopClientCard({ onOpen }: { onOpen: (client: ClientRow) => void }) {
  const { from, to } = getWeekRange(0);
  const { bookings, isLoading } = useBookings(from, to);

  const topClient = useMemo((): TopClientData | null => {
    if (!bookings || bookings.length === 0) return null;

    const grouped = new Map<string, { count: number; phone: string; spent: number; lastDate: string }>();
    bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const name = b.client_name || 'Невідомий';
      const prev = grouped.get(name) ?? { count: 0, phone: b.client_phone, spent: 0, lastDate: '' };
      grouped.set(name, {
        count:    prev.count + 1,
        phone:    b.client_phone || prev.phone,
        spent:    prev.spent + (b.status === 'completed' ? b.total_price : 0),
        lastDate: b.date > prev.lastDate ? b.date : prev.lastDate,
      });
    });

    let topName = '';
    let topData = { count: 0, phone: '', spent: 0, lastDate: '' };
    grouped.forEach((data, name) => {
      if (data.count > topData.count) { topData = data; topName = name; }
    });

    return topData.count > 0
      ? { name: topName, count: topData.count, phone: topData.phone, totalSpent: topData.spent, lastVisitAt: topData.lastDate || null }
      : null;
  }, [bookings]);

  const initials = topClient
    ? topClient.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const handleOpen = () => {
    if (!topClient) return;
    const client: ClientRow = {
      id:               topClient.phone,
      client_id:        null,
      client_name:      topClient.name,
      client_phone:     topClient.phone,
      total_visits:     topClient.count,
      total_spent:      topClient.totalSpent,
      average_check:    topClient.count > 0 ? Math.round(topClient.totalSpent / topClient.count) : 0,
      last_visit_at:    topClient.lastVisitAt,
      last_service_name: null,
      is_vip:           false,
      relation_id:      null,
      retention_status: 'active',
      health_notes:     null,
      medical_notes:    null,
    };
    onOpen(client);
  };

  return (
    <div className="bento-card p-4 flex flex-col min-h-[110px]">
      <p className="widget-heading mb-3">Топ клієнт тижня</p>

      <div
        className="flex-1"
        onClick={topClient ? handleOpen : undefined}
        style={{ cursor: topClient ? 'pointer' : 'default' }}
      >
        {isLoading ? (
          <div className="space-y-2">
            <div className="skeleton-shimmer h-10 w-10 rounded-full" />
            <div className="skeleton-shimmer h-3 w-20 rounded-full" />
          </div>
        ) : topClient ? (
          <div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold mb-2"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
            >
              {initials}
            </div>
            <p
              className="font-service text-[14px] leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {fmtClientName(topClient.name)}
            </p>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {topClient.count}{' '}
              {pluralUk(topClient.count, 'візит', 'візити', 'візитів')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-1 gap-2">
            <Users size={18} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-[13px] text-center" style={{ color: 'var(--text-tertiary)' }}>
              Записів ще немає
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AvgCheckCard() {
  const thisWeek = getWeekRange(0);
  const prevWeek = getWeekRange(-1);

  const { bookings: thisBookings, isLoading: loadingThis } = useBookings(thisWeek.from, thisWeek.to);
  const { bookings: prevBookings }                          = useBookings(prevWeek.from, prevWeek.to);

  const thisAvg = useMemo(() => {
    const paid = (thisBookings ?? []).filter(b => b.status === 'completed');
    if (paid.length === 0) return 0;
    return Math.round(paid.reduce((s, b) => s + b.total_price, 0) / paid.length);
  }, [thisBookings]);

  const prevAvg = useMemo(() => {
    const paid = (prevBookings ?? []).filter(b => b.status === 'completed');
    if (paid.length === 0) return 0;
    return Math.round(paid.reduce((s, b) => s + b.total_price, 0) / paid.length);
  }, [prevBookings]);

  const deltaPct = prevAvg > 0 ? Math.round(((thisAvg - prevAvg) / prevAvg) * 100) : null;
  const isPositive = deltaPct !== null && deltaPct >= 0;

  return (
    <div className="bento-card p-4 flex flex-col min-h-[110px]">
      <p className="widget-heading mb-3">Середній чек</p>

      {loadingThis ? (
        <div className="space-y-2">
          <div className="skeleton-shimmer h-8 w-20 rounded-full" />
          <div className="skeleton-shimmer h-3 w-14 rounded-full" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-end">
          <p
            className="metric-value text-[clamp(1.3rem,3vw,1.6rem)] font-bold leading-none"
            style={{ color: 'var(--text-primary)' }}
          >
            {thisAvg > 0 ? formatPrice(thisAvg) : '—'}
          </p>

          {deltaPct !== null && (
            <div
              className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold"
              style={{ color: isPositive ? 'var(--success)' : 'var(--error)' }}
            >
              {isPositive
                ? <TrendingUp size={11} />
                : <TrendingDown size={11} />}
              <span>{deltaPct > 0 ? '+' : ''}{deltaPct}%</span>
              <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>
                vs минулий
              </span>
            </div>
          )}

          {thisAvg === 0 && (
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Нема завершених записів
            </p>
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
      <div className="grid grid-cols-2 gap-3">
        <TopClientCard onOpen={setSelectedClient} />
        <AvgCheckCard />
      </div>
      <ClientDetailSheet
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
      />
    </>
  );
}
