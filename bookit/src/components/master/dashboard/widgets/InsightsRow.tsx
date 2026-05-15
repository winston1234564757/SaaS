'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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

/* ── Top client card ─────────────────────────────────────── */
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
    };
    onOpen(client);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34 }}
      className="bento-card flex-1 overflow-hidden"
    >
      <div
        className="px-4 pt-4 pb-4 flex flex-col gap-3 h-full"
        onClick={topClient ? handleOpen : undefined}
        style={{ cursor: topClient ? 'pointer' : 'default' }}
      >
        <p
          className="text-[9px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Топ клієнт тижня
        </p>

        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer rounded-full shrink-0" style={{ width: 40, height: 40 }} />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="skeleton-shimmer rounded-md" style={{ height: 12, width: '70%' }} />
              <div className="skeleton-shimmer rounded-md" style={{ height: 10, width: '40%' }} />
            </div>
          </div>
        ) : topClient ? (
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold"
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                border: '0.5px solid var(--border-strong)',
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold text-sm truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {fmtClientName(topClient.name)}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {topClient.count}{' '}
                {pluralUk(topClient.count, 'візит', 'візити', 'візитів')} цього тижня
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 py-1" style={{ color: 'var(--text-tertiary)' }}>
            <Users size={18} strokeWidth={1.5} />
            <p className="text-xs">Записів ще немає</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Avg check card ──────────────────────────────────────── */
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

  const pct = prevAvg > 0 ? Math.round(((thisAvg - prevAvg) / prevAvg) * 100) : null;
  const isPositive = pct !== null && pct >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34, delay: 0.07 }}
      className="bento-card flex-1 overflow-hidden"
    >
      <div className="px-4 pt-4 pb-4 flex flex-col gap-1">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Середній чек
        </p>

        {loadingThis ? (
          <div className="skeleton-shimmer rounded-xl mt-2" style={{ height: 32, width: '80%' }} />
        ) : (
          <>
            <p
              className="leading-none mt-1"
              style={{
                fontFamily: 'var(--font-cormorant, Georgia, serif)',
                fontSize: '1.55rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: thisAvg > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              {thisAvg > 0 ? formatPrice(thisAvg) : '—'}
            </p>

            {pct !== null && (
              <div className="flex items-center gap-1 mt-1">
                <span style={{ color: isPositive ? 'var(--success)' : 'var(--error)' }}>
                  {isPositive
                    ? <TrendingUp size={12} />
                    : <TrendingDown size={12} />}
                </span>
                <span
                  className="text-[11px] font-bold"
                  style={{ color: isPositive ? 'var(--success)' : 'var(--error)' }}
                >
                  {pct > 0 ? '+' : ''}{pct}%
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  vs минулий тиждень
                </span>
              </div>
            )}

            {thisAvg === 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Нема завершених записів
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ── Export ──────────────────────────────────────────────── */
export function InsightsRow() {
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:gap-5">
        <TopClientCard onOpen={setSelectedClient} />
        <AvgCheckCard />
      </div>

      <ClientDetailSheet
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onVipChange={() => {}}
      />
    </>
  );
}
