'use client';

import { useState, useMemo } from 'react';
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

export function InsightsRow() {
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const { from, to } = getWeekRange(0);
  const prevWeek = getWeekRange(-1);
  const { bookings }                      = useBookings(from, to);
  const { bookings: prevBookings }         = useBookings(prevWeek.from, prevWeek.to);

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

  const thisAvg = useMemo(() => {
    const paid = (bookings ?? []).filter(b => b.status === 'completed');
    if (!paid.length) return 0;
    return Math.round(paid.reduce((s, b) => s + b.total_price, 0) / paid.length);
  }, [bookings]);

  const prevAvg = useMemo(() => {
    const paid = (prevBookings ?? []).filter(b => b.status === 'completed');
    if (!paid.length) return 0;
    return Math.round(paid.reduce((s, b) => s + b.total_price, 0) / paid.length);
  }, [prevBookings]);

  const deltaPct = prevAvg > 0 ? Math.round(((thisAvg - prevAvg) / prevAvg) * 100) : null;

  const handleOpen = () => {
    if (!topClient) return;
    setSelectedClient({
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
    <>
      <div className="flex flex-col" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        {/* Row: top client */}
        <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--text-tertiary)]">
            Топ клієнт тижня
          </p>
          {topClient ? (
            <button
              type="button"
              onClick={handleOpen}
              className="text-right active:opacity-70 transition-opacity"
            >
              <p className="text-[14px] font-medium text-[var(--text-primary)]">
                {fmtClientName(topClient.name)}
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                {topClient.count} {pluralUk(topClient.count, 'візит', 'візити', 'візитів')}
              </p>
            </button>
          ) : (
            <span className="text-[13px] text-[var(--text-tertiary)]">—</span>
          )}
        </div>

        {/* Row: avg check */}
        <div className="flex items-center justify-between py-2.5">
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--text-tertiary)]">
            Середній чек
          </p>
          <div className="text-right">
            <p className="metric-value text-[1.1rem] font-bold text-[var(--text-primary)]">
              {thisAvg > 0 ? formatPrice(thisAvg) : '—'}
            </p>
            {deltaPct !== null && (
              <p
                className="text-[11px] mt-0.5 font-semibold"
                style={{ color: deltaPct >= 0 ? 'var(--success)' : 'var(--error)' }}
              >
                {deltaPct > 0 ? '+' : ''}{deltaPct}% vs минулий
              </p>
            )}
          </div>
        </div>
      </div>

      <ClientDetailSheet client={selectedClient} onClose={() => setSelectedClient(null)} />
    </>
  );
}
