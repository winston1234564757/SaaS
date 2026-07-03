'use client';

import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Sheet } from '@/components/ui/Sheet';
import { ClientDetailSheet } from '@/components/master/clients/ClientDetailSheet';
import { formatPrice } from '@/components/master/services/types';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useWeeklyInsights, type WeeklyInsightsData, type WeeklyTopClient } from '../shared/hooks/useWeeklyInsights';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';

/**
 * Калібровані статус-тони для дрібного тексту (weight 500 → normal, треба 4.5:1 на periwinkle).
 * Токени --success/--warning провалюють 4.5 на --surface (≈3.95). Ці дають ≥5:1. Урок DS-DASH-04.
 */
const TONE = {
  good: '#0B6B2E',       // 5.3:1
  bad:  'var(--error)',  // #B91C1C, 5.1:1
} as const;

function fmtClientName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? name;
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

function initialsOf(name: string): string {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function toClientRow(c: WeeklyTopClient): ClientRow {
  return {
    id: c.phone, client_id: null, client_name: c.name,
    client_phone: c.phone, total_visits: c.count,
    total_spent: c.totalSpent,
    average_check: c.count > 0 ? Math.round(c.totalSpent / c.count) : 0,
    last_visit_at: c.lastVisitAt, last_service_name: null,
    is_vip: false, relation_id: null, retention_status: 'active',
    health_notes: null, medical_notes: null,
  };
}

/* ─── Герой: середній чек (домінанта, тап → розбивка по послугах) ─── */
function AvgHero({
  avgCheck, delta, open, onOpen,
}: { avgCheck: number; delta: number | null; open: boolean; onOpen: () => void }) {
  const trend =
    delta === null ? null
    : delta > 0 ? { text: `+${delta}%`, color: TONE.good, up: true }
    : delta < 0 ? { text: `${delta}%`,  color: TONE.bad,  up: false }
    : { text: 'без змін', color: 'var(--text-secondary)', up: true };

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label="Розбивка середнього чека по послугах"
      className="w-full text-left rounded-xl -mx-2 px-2 py-1.5 transition-colors active:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
    >
      <p className="text-[11px] text-[var(--text-secondary)] mb-1">Середній чек тижня</p>
      <span className="flex items-center gap-1.5">
        <span className="metric-value text-[2.4rem] font-bold leading-[0.9] text-[var(--text-primary)]">
          {avgCheck > 0 ? formatPrice(avgCheck) : '—'}
        </span>
        <ChevronRight size={16} className="opacity-45 shrink-0 mt-1" style={{ color: 'var(--text-secondary)' }} aria-hidden />
      </span>
      {trend && (
        <span className="flex items-center gap-1 mt-1.5 text-[12px] font-semibold" style={{ color: trend.color }}>
          {trend.up ? <TrendingUp size={12} strokeWidth={2} aria-hidden /> : <TrendingDown size={12} strokeWidth={2} aria-hidden />}
          <span>{trend.text}</span>
          <span className="font-normal text-[var(--text-secondary)]">за тиждень</span>
        </span>
      )}
    </button>
  );
}

/* ─── Підтримка: порівняльні смуги цей/минулий тиждень (2 різні, домінанта primary) ─── */
function CompareBars({ avgCheck, prevAvg }: { avgCheck: number; prevAvg: number }) {
  const maxVal = Math.max(avgCheck, prevAvg, 1);
  const rows = [
    { label: 'Цей тиждень', value: avgCheck, primary: true },
    { label: 'Минулий',     value: prevAvg,  primary: false },
  ];
  return (
    <div className="mt-4 space-y-2.5">
      {rows.map(({ label, value, primary }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{label}</span>
            <span
              className="metric-value text-[11px] font-bold tabular-nums"
              style={{ color: primary ? 'var(--text-primary)' : 'var(--text-secondary)' }}
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
  );
}

/* ─── Featured-рядок: топ-клієнт тижня (людське обличчя, тап → профіль) ─── */
function TopClientRow({ client, onOpen }: { client: WeeklyTopClient; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Профіль клієнта: ${client.name}`}
      className="w-full text-left flex items-center gap-3 rounded-xl -mx-2 px-2 py-2 transition-colors active:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
    >
      <span
        className="flex items-center justify-center size-11 rounded-full flex-shrink-0 text-[14px] font-bold"
        style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
        aria-hidden
      >
        {initialsOf(client.name)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[var(--text-secondary)] mb-0.5">Топ-клієнт тижня</p>
        <p className="heading-serif text-[18px] text-[var(--text-primary)] truncate leading-tight">
          {fmtClientName(client.name)}
        </p>
        <p className="text-[12px] text-[var(--text-secondary)] truncate">
          {client.count} {pluralUk(client.count, 'візит', 'візити', 'візитів')}
          {client.totalSpent > 0 && <> · {formatPrice(client.totalSpent)}</>}
        </p>
      </div>
      <ChevronRight size={16} className="opacity-45 shrink-0" style={{ color: 'var(--text-secondary)' }} aria-hidden />
    </button>
  );
}

/* ─── Презентаційна картка (props-only) — для own-eyes прев'ю без хуків ─── */
export function InsightsCard({
  avgCheck, delta, prevAvg, breakdown, completedCount, topClient, hasBookings,
}: Omit<WeeklyInsightsData, 'isLoading'>) {
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState<ClientRow | null>(null);

  const dividerTop = { borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' } as const;

  let body: React.ReactNode;

  // ── Стан empty: жодного не-скасованого запису тижня ──
  if (!hasBookings) {
    body = (
      <div className="flex flex-col justify-center flex-1 py-2">
        <p className="heading-serif text-[22px] text-[var(--text-primary)] leading-tight">Записів цього тижня ще немає</p>
        <p className="text-[13px] mt-1.5 text-[var(--text-secondary)] max-w-[34ch]">
          Перший запис принесе сюди середній чек і топ-клієнта тижня.
        </p>
      </div>
    );
  } else {
    const showBars = avgCheck > 0;
    body = (
      <div className="flex flex-col flex-1">
        <AvgHero avgCheck={avgCheck} delta={delta} open={open} onOpen={() => setOpen(true)} />

        {avgCheck === 0 && (
          <p className="text-[12px] mt-2 text-[var(--text-secondary)] max-w-[34ch]">
            Завершіть записи, щоб порахувати чек тижня.
          </p>
        )}

        {showBars && <CompareBars avgCheck={avgCheck} prevAvg={prevAvg} />}

        {topClient && (
          <div className="mt-auto pt-3" style={dividerTop}>
            <TopClientRow client={topClient} onOpen={() => setClient(toClientRow(topClient))} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      <Section title="Цього тижня" icon={Wallet} className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">
        {body}
      </Section>

      {/* Розбивка середнього чека по послугах */}
      <Sheet open={open} onOpenChange={setOpen} variant="adaptive" title="Середній чек цього тижня" maxWidth="md">
        <div className="flex items-end justify-between pb-3 mb-1" style={{ borderBottom: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
          <div>
            <p className="metric-value text-[1.5rem] font-bold leading-none text-[var(--text-primary)]">
              {avgCheck > 0 ? formatPrice(avgCheck) : '—'}
            </p>
            <p className="text-[12px] mt-1 text-[var(--text-secondary)]">середній чек</p>
          </div>
          <div className="text-right">
            <p className="metric-value text-[1.1rem] font-bold leading-none text-[var(--text-primary)]">{completedCount}</p>
            <p className="text-[12px] mt-1 text-[var(--text-secondary)]">
              {pluralUk(completedCount, 'завершений', 'завершені', 'завершених')} {pluralUk(completedCount, 'запис', 'записи', 'записів')}
            </p>
          </div>
        </div>

        {breakdown.length > 0 ? (
          <div className="flex flex-col">
            {breakdown.map(s => (
              <div key={s.name} className="py-3" style={{ borderBottom: '1px solid color-mix(in srgb, var(--accent) 8%, transparent)' }}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] font-semibold truncate text-[var(--text-primary)]">{s.name}</p>
                  <span className="metric-value text-[13px] font-bold tabular-nums flex-shrink-0 text-[var(--text-primary)]">
                    {formatPrice(s.revenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[12px] text-[var(--text-secondary)]">{s.count} × {formatPrice(s.avgPrice)}</p>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{s.sharePct}%</span>
                </div>
                <div className="h-[3px] rounded-full overflow-hidden mt-1.5" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.sharePct}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Завершених записів цього тижня немає</p>
            <p className="text-[13px] mt-1 max-w-[260px] text-[var(--text-secondary)]">
              Щойно завершите перші записи, тут буде видно, які послуги формують чек.
            </p>
          </div>
        )}
      </Sheet>

      <ClientDetailSheet client={client} onClose={() => setClient(null)} />
    </div>
  );
}

export function InsightsRow() {
  const { isLoading, ...data } = useWeeklyInsights();

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 h-full">
        <Section title="Цього тижня" icon={Wallet} className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">
          <div className="skeleton-shimmer h-11 w-32 rounded-xl" />
          <div className="mt-4 space-y-2.5">
            <div className="skeleton-shimmer h-3 w-full rounded-full" />
            <div className="skeleton-shimmer h-3 w-full rounded-full" />
          </div>
          <div className="mt-auto pt-3 flex items-center gap-3">
            <div className="skeleton-shimmer size-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-3.5 w-24 rounded-full" />
              <div className="skeleton-shimmer h-3 w-16 rounded-full" />
            </div>
          </div>
        </Section>
      </div>
    );
  }

  return <InsightsCard {...data} />;
}
