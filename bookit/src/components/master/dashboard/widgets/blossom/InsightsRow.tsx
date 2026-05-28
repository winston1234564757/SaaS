'use client';

import { useState, useMemo } from 'react';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
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

function TopClientPanel({ onOpen }: { onOpen: (c: ClientRow) => void }) {
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
        count:    prev.count + 1,
        phone:    b.client_phone || prev.phone,
        spent:    prev.spent + (b.status === 'completed' ? b.total_price : 0),
        lastDate: b.date > prev.lastDate ? b.date : prev.lastDate,
      });
    });
    let topName = ''; let topData = { count: 0, phone: '', spent: 0, lastDate: '' };
    grouped.forEach((data, name) => { if (data.count > topData.count) { topData = data; topName = name; } });
    return topData.count > 0
      ? { name: topName, count: topData.count, phone: topData.phone, totalSpent: topData.spent, lastVisitAt: topData.lastDate || null }
      : null;
  }, [bookings]);

  const initials = topClient
    ? topClient.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '';

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
    <div>
      <p className="text-[15px] font-semibold tracking-[0.08em] uppercase text-[var(--text-secondary)] mb-3">
        Топ клієнт тижня
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <div className="skeleton-shimmer h-8 w-8 rounded-full" />
          <div className="skeleton-shimmer h-4 w-24 rounded-full" />
        </div>
      ) : topClient ? (
        <div
          className="cursor-pointer group"
          onClick={handleOpen}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold mb-2"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
          >
            {initials}
          </div>
          <p
            className="font-service text-[15px] group-hover:text-[var(--accent)] transition-colors duration-200"
            style={{ color: 'var(--text-primary)' }}
          >
            {fmtClientName(topClient.name)}
          </p>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            {topClient.count} {pluralUk(topClient.count, 'візит', 'візити', 'візитів')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <span style={{ color: 'var(--text-tertiary)' }}><Users size={18} strokeWidth={1.5} /></span>
          <p className="text-[13px] text-[var(--text-tertiary)] italic">Записів ще немає</p>
        </div>
      )}
    </div>
  );
}

function AvgCheckPanel() {
  const thisWeek = getWeekRange(0);
  const prevWeek = getWeekRange(-1);
  const { bookings: thisBookings, isLoading } = useBookings(thisWeek.from, thisWeek.to);
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

  return (
    <div>
      <p className="text-[15px] font-semibold tracking-[0.08em] uppercase text-[var(--text-secondary)] mb-3">
        Середній чек
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <div className="skeleton-shimmer h-10 w-20 rounded-xl" />
          <div className="skeleton-shimmer h-3 w-14 rounded-full" />
        </div>
      ) : (
        <>
          <span
            style={{
              fontFamily:    "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize:      'clamp(1.6rem, 5vw, 2.2rem)',
              fontWeight:    300,
              letterSpacing: '-0.01em',
              color:         'var(--text-primary)',
              lineHeight:    1,
              display:       'block',
            }}
          >
            {thisAvg > 0 ? formatPrice(thisAvg) : '—'}
          </span>
          {deltaPct !== null && (
            <div
              className="flex items-center gap-1 mt-2 text-[12px] font-semibold"
              style={{ color: isPositive ? 'var(--success)' : 'var(--error)' }}
            >
              {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              <span>{deltaPct > 0 ? '+' : ''}{deltaPct}%</span>
              <span className="font-normal text-[var(--text-tertiary)]">vs минулий</span>
            </div>
          )}
          {thisAvg === 0 && (
            <p className="text-[13px] mt-1 italic text-[var(--text-tertiary)]">
              Нема завершених записів
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function InsightsRow() {
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-x-6">
        <TopClientPanel onOpen={setSelectedClient} />
        <div className="relative">
          <div className="absolute left-0 inset-y-0 w-px" style={{ background: 'var(--border)' }} />
          <div className="pl-6">
            <AvgCheckPanel />
          </div>
        </div>
      </div>
      <ClientDetailSheet client={selectedClient} onClose={() => setSelectedClient(null)} />
    </>
  );
}
