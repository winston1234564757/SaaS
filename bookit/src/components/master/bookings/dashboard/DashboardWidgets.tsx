'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Users, Zap, Clock, ChevronRight, CalendarX } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';
import { Sheet } from '@/components/ui/Sheet';
import { formatPrice } from '@/components/master/services/types';
import { formatDate, formatDurationFull } from '@/lib/utils/dates';
import { BOOKING_STATUS_CONFIG } from '@/lib/constants/bookingStatus';
import { toMins } from '@/lib/utils/smartSlots';
import type { DashboardStats } from '../hooks/useBookingsDashboardLogic';
import type { BookingWithServices } from '@/lib/supabase/hooks/useBookings';

type MetricKey = 'occupancy' | 'forecast' | 'retention' | 'efficiency';

interface Props {
  stats: DashboardStats;
  bookings?: BookingWithServices[];
  isLoading?: boolean;
}

export function DashboardWidgets({ stats, bookings = [], isLoading }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<MetricKey | null>(null);
  const close = () => setOpen(null);

  const goBooking = (id: string) => {
    setOpen(null);
    router.push(`?bookingId=${id}`, { scroll: false });
  };
  const goClient = (phone: string) => {
    setOpen(null);
    router.push(`/dashboard/clients?clientPhone=${encodeURIComponent(phone)}`);
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <WidgetCard
          title="Заповненість"
          value={`${Math.round(stats.occupancyRate)}%`}
          label="розкладу"
          icon={<Clock className="text-primary" size={18} />}
          isLoading={isLoading}
          expanded={open === 'occupancy'}
          onClick={() => setOpen('occupancy')}
        />
        <WidgetCard
          title="Прогноз"
          value={`${stats.forecastRevenue.toLocaleString('uk-UA')} ₴`}
          label="до кінця періоду"
          icon={<TrendingUp className="text-success" size={18} />}
          isLoading={isLoading}
          expanded={open === 'forecast'}
          onClick={() => setOpen('forecast')}
        />
        <WidgetCard
          title="Лояльність"
          value={`${Math.round(stats.retentionRate)}%`}
          label={`${stats.returningClientsCount} ${pluralUk(stats.returningClientsCount, 'повертається', 'повертаються', 'повертаються')}`}
          icon={<Users className="text-sage" size={18} />}
          isLoading={isLoading}
          expanded={open === 'retention'}
          onClick={() => setOpen('retention')}
        />
        <WidgetCard
          title="Ефективність"
          value={`${Math.round(stats.efficiencyRate)}%`}
          label={stats.lostMinutes > 0 ? `${stats.lostMinutes} хв на скасуваннях` : 'Без втрат часу'}
          icon={<Zap className="text-warning" size={18} />}
          isLoading={isLoading}
          expanded={open === 'efficiency'}
          onClick={() => setOpen('efficiency')}
        />
      </div>

      <Sheet open={open === 'occupancy'} onOpenChange={(o) => !o && close()} variant="adaptive" title="Заповненість розкладу" maxWidth="md">
        <OccupancyDetail stats={stats} />
      </Sheet>
      <Sheet open={open === 'forecast'} onOpenChange={(o) => !o && close()} variant="adaptive" title="Прогноз доходу" maxWidth="md">
        <ForecastDetail bookings={bookings} forecast={stats.forecastRevenue} onBooking={goBooking} />
      </Sheet>
      <Sheet open={open === 'retention'} onOpenChange={(o) => !o && close()} variant="adaptive" title="Лояльність клієнтів" maxWidth="md">
        <RetentionDetail bookings={bookings} stats={stats} onClient={goClient} />
      </Sheet>
      <Sheet open={open === 'efficiency'} onOpenChange={(o) => !o && close()} variant="adaptive" title="Ефективність часу" maxWidth="md">
        <EfficiencyDetail bookings={bookings} stats={stats} onBooking={goBooking} />
      </Sheet>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Widget card (button → opens its detail sheet)
// ─────────────────────────────────────────────────────────────────────────────
interface WidgetCardProps {
  title: string;
  value: string | number;
  label: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  expanded?: boolean;
  onClick: () => void;
}

function WidgetCard({ title, value, label, icon, isLoading, expanded, onClick }: WidgetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-label={`${title}: ${value}. Відкрити деталі`}
      className="bento-card p-5 lg:p-7 relative overflow-hidden group text-left w-full transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2 mb-3 lg:mb-4">
        <p className="text-[10px] lg:text-[11px] font-bold text-text-sub leading-tight">{title}</p>
        <ChevronRight size={15} className="shrink-0 -mr-1 text-text-sub group-hover:text-text-sub transition-colors" />
      </div>

      <div className="min-h-[58px] lg:min-h-[66px] flex flex-col justify-end">
        {isLoading ? (
          <div className="space-y-1.5 lg:space-y-2">
            <div className="h-9 lg:h-10 w-24 bg-muted/20 animate-pulse rounded-lg" />
            <div className="h-4 w-16 bg-muted/10 animate-pulse rounded-md" />
          </div>
        ) : (
          <>
            <h3 className="heading-serif text-3xl lg:text-4xl text-foreground leading-tight">{value}</h3>
            <p className="text-[11px] lg:text-[13px] text-text-sub mt-1.5 lg:mt-2 font-medium line-clamp-1">{label}</p>
          </>
        )}
      </div>

      <div className="absolute bottom-4 right-4 opacity-[0.18] group-hover:opacity-[0.30] transition-opacity duration-200">
        {icon}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sheet primitives
// ─────────────────────────────────────────────────────────────────────────────
function StatLine({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm font-medium text-text-sub">{label}</span>
      <span className="text-sm font-bold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</span>
    </div>
  );
}

function NavRow({
  onClick, title, sub, right, dot,
}: { onClick: () => void; title: string; sub?: string; right?: React.ReactNode; dot?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-secondary/40 transition-colors active:scale-[0.99]"
    >
      {dot && <span className="size-2 rounded-full shrink-0" style={{ background: dot }} />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{title}</p>
        {sub && <p className="text-xs text-text-sub truncate mt-0.5">{sub}</p>}
      </div>
      {right}
      <ChevronRight size={16} className="shrink-0 text-text-sub" />
    </button>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text-sub text-center py-8">{children}</p>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Occupancy — aggregate (informational, no navigation)
// ─────────────────────────────────────────────────────────────────────────────
function OccupancyDetail({ stats }: { stats: DashboardStats }) {
  const booked = stats.totalBookedMinutes;
  const working = stats.totalWorkingMinutes;
  const free = Math.max(0, working - booked);
  const pct = Math.round(stats.occupancyRate);
  const activeBookings = stats.totalBookings - stats.cancelledBookings;

  if (working === 0) {
    return <EmptyNote>Робочий графік на цей період ще не заданий, тож заповненість порахувати ніяк.</EmptyNote>;
  }

  return (
    <div className="px-1 pb-2">
      <div className="flex items-end gap-3 mb-4">
        <span className="heading-serif text-4xl text-foreground leading-none">{pct}%</span>
        <span className="text-sm text-text-sub mb-1">робочого часу зайнято</span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary/60 overflow-hidden mb-5">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="divide-y divide-border/60">
        <StatLine label="Зайнято записами" value={formatDurationFull(booked)} />
        <StatLine label="Робочий час" value={formatDurationFull(working)} />
        <StatLine label="Вільно" value={formatDurationFull(free)} />
        <StatLine label="Активних записів" value={String(activeBookings)} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Forecast — upcoming confirmed + pending (each row → booking detail)
// ─────────────────────────────────────────────────────────────────────────────
function ForecastDetail({
  bookings, forecast, onBooking,
}: { bookings: BookingWithServices[]; forecast: number; onBooking: (id: string) => void }) {
  const { upcoming, confirmedSum, pendingSum, confirmedN, pendingN } = useMemo(() => {
    const up = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'pending')
      .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
    const conf = up.filter(b => b.status === 'confirmed');
    const pend = up.filter(b => b.status === 'pending');
    return {
      upcoming: up,
      confirmedSum: conf.reduce((s, b) => s + b.total_price, 0),
      pendingSum: pend.reduce((s, b) => s + b.total_price, 0),
      confirmedN: conf.length,
      pendingN: pend.length,
    };
  }, [bookings]);

  return (
    <div className="px-1 pb-2">
      <div className="flex items-end gap-3 mb-4">
        <span className="heading-serif text-4xl text-foreground leading-none">{forecast.toLocaleString('uk-UA')} ₴</span>
        <span className="text-sm text-text-sub mb-1">очікуваний дохід</span>
      </div>
      <div className="divide-y divide-border/60 mb-4">
        <StatLine label={`Підтверджено · ${confirmedN}`} value={`${formatPrice(confirmedSum)}`} accent={BOOKING_STATUS_CONFIG.confirmed.color} />
        <StatLine label={`Очікує · ${pendingN}`} value={`${formatPrice(pendingSum)}`} accent={BOOKING_STATUS_CONFIG.pending.color} />
      </div>
      {upcoming.length === 0 ? (
        <EmptyNote>Майбутніх записів поки немає.</EmptyNote>
      ) : (
        <div className="-mx-2">
          {upcoming.map(b => (
            <NavRow
              key={b.id}
              onClick={() => onBooking(b.id)}
              dot={BOOKING_STATUS_CONFIG[b.status].color}
              title={b.client_name}
              sub={`${formatDate(b.date)} · ${b.start_time} · ${b.services.map(s => s.name).join(', ') || 'Без послуги'}`}
              right={<span className="text-sm font-bold tabular-nums text-foreground">{formatPrice(b.total_price)}</span>}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Retention — returning clients (each row → client profile)
// ─────────────────────────────────────────────────────────────────────────────
function RetentionDetail({
  bookings, stats, onClient,
}: { bookings: BookingWithServices[]; stats: DashboardStats; onClient: (phone: string) => void }) {
  const returning = useMemo(() => {
    const map = new Map<string, { phone: string; name: string; count: number }>();
    bookings.forEach(b => {
      const cur = map.get(b.client_phone);
      if (cur) cur.count += 1;
      else map.set(b.client_phone, { phone: b.client_phone, name: b.client_name, count: 1 });
    });
    return Array.from(map.values()).filter(c => c.count > 1).sort((a, b) => b.count - a.count);
  }, [bookings]);

  return (
    <div className="px-1 pb-2">
      <div className="flex items-end gap-3 mb-4">
        <span className="heading-serif text-4xl text-foreground leading-none">{Math.round(stats.retentionRate)}%</span>
        <span className="text-sm text-text-sub mb-1">клієнтів повертаються</span>
      </div>
      <div className="divide-y divide-border/60 mb-4">
        <StatLine label="Постійні" value={String(stats.returningClientsCount)} accent="var(--success)" />
        <StatLine label="Нові" value={String(stats.newClientsCount)} />
      </div>
      {returning.length === 0 ? (
        <EmptyNote>Поки немає клієнтів із повторними візитами в цьому періоді.</EmptyNote>
      ) : (
        <div className="-mx-2">
          {returning.map(c => (
            <NavRow
              key={c.phone}
              onClick={() => onClient(c.phone)}
              title={c.name}
              sub={c.phone}
              right={<span className="text-xs font-bold text-text-sub">{c.count} {pluralUk(c.count, 'візит', 'візити', 'візитів')}</span>}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Efficiency — lost time from cancellations (each row → booking detail)
// ─────────────────────────────────────────────────────────────────────────────
function EfficiencyDetail({
  bookings, stats, onBooking,
}: { bookings: BookingWithServices[]; stats: DashboardStats; onBooking: (id: string) => void }) {
  const cancelled = useMemo(
    () =>
      bookings
        .filter(b => b.status === 'cancelled')
        .sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time)),
    [bookings],
  );

  return (
    <div className="px-1 pb-2">
      <div className="flex items-end gap-3 mb-4">
        <span className="heading-serif text-4xl text-foreground leading-none">{Math.round(stats.efficiencyRate)}%</span>
        <span className="text-sm text-text-sub mb-1">часу відпрацьовано без втрат</span>
      </div>
      <div className="divide-y divide-border/60 mb-4">
        <StatLine
          label="Втрачено на скасуваннях"
          value={stats.lostMinutes > 0 ? formatDurationFull(stats.lostMinutes) : 'Немає'}
          accent={stats.lostMinutes > 0 ? 'var(--error)' : undefined}
        />
      </div>
      {cancelled.length === 0 ? (
        <EmptyNote>Скасувань немає, робочий час не втрачено.</EmptyNote>
      ) : (
        <div className="-mx-2">
          {cancelled.map(b => {
            const lost = Math.max(0, toMins(b.end_time) - toMins(b.start_time));
            return (
              <NavRow
                key={b.id}
                onClick={() => onBooking(b.id)}
                dot="var(--error)"
                title={b.client_name}
                sub={`${formatDate(b.date)} · ${b.start_time} · ${b.services.map(s => s.name).join(', ') || 'Без послуги'}`}
                right={
                  <span className="flex items-center gap-1 text-xs font-bold text-error">
                    <CalendarX size={12} />
                    {formatDurationFull(lost)}
                  </span>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
