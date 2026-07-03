'use client';

import Link from 'next/link';
import { CalendarDays, Sparkles, Zap } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { useNextFreeDays, type FreeDay, type NextFreeDaysData } from '../shared/hooks/useNextFreeDays';

/** ≥ цієї частки вільних робочих днів → календар вважається відкритим (founder-реальність). */
const OPEN_THRESHOLD = 0.7;

type CtaSpec = { href: string; label: string; Icon: typeof Zap };
const CTA_STORIES: CtaSpec = { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс', Icon: Sparkles };
const CTA_FLASH: CtaSpec   = { href: '/dashboard/revenue?drawer=flash_deals', label: 'Flash',  Icon: Zap };

const PRIMARY_STYLE: React.CSSProperties = {
  background: 'var(--accent)',
  color: 'var(--accent-on)',
  boxShadow: '0 3px 10px color-mix(in srgb, var(--accent) 22%, transparent)',
};
const SECONDARY_STYLE: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
  border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
  color: 'var(--text-primary)',
};
const PILL_STYLE: React.CSSProperties = {
  borderRadius: '10px',
  border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
  background: 'var(--surface)',
};

function Cta({ cta, primary }: { cta: CtaSpec; primary: boolean }) {
  const { href, label, Icon } = cta;
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-2 h-11 rounded-[14px] font-semibold text-[13px] transition-transform duration-150 active:scale-[0.96]"
      style={primary ? PRIMARY_STYLE : SECONDARY_STYLE}
    >
      <Icon size={14} strokeWidth={1.8} aria-hidden />
      {label}
    </Link>
  );
}

/* ─── Герой: найближче вільне вікно (домінанта-зірка) ─── */
function HeroWindow({ day, eyebrow, onDayClick }: { day: FreeDay; eyebrow: string; onDayClick?: (iso: string) => void }) {
  const inner = (
    <>
      <p className="text-[11px] text-[var(--text-secondary)] mb-1">{eyebrow}</p>
      <p className="leading-none">
        <span className="heading-serif text-[26px] text-[var(--text-primary)]">{day.dayFull}</span>
        <span className="metric-value text-[16px] ml-2 text-[var(--accent)]">{day.dateLabel}</span>
      </p>
    </>
  );
  return onDayClick ? (
    <button
      type="button"
      onClick={() => onDayClick(day.iso)}
      aria-label={`Слоти: ${day.dayFull}, ${day.dateLabel}`}
      className="w-full text-left rounded-xl -mx-2 px-2 py-1.5 transition-colors active:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
    >
      {inner}
    </button>
  ) : (
    <div className="px-0 py-1.5">{inner}</div>
  );
}

/* ─── Рейл: решта вільних днів, компактні (тихіші за героя) ─── */
function RailPill({ day, onDayClick }: { day: FreeDay; onDayClick?: (iso: string) => void }) {
  const inner = (
    <>
      <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--text-secondary)]">{day.dayLabel}</span>
      <span className="metric-value text-[14px] font-bold tabular-nums text-[var(--text-primary)]">{day.dateLabel.split(' ')[0]}</span>
      <span className="text-[9px] text-[var(--text-secondary)]">{day.dateLabel.split(' ')[1]}</span>
    </>
  );
  return onDayClick ? (
    <button
      type="button"
      onClick={() => onDayClick(day.iso)}
      aria-label={`Слоти: ${day.dayFull}, ${day.dateLabel}`}
      className="flex-1 flex flex-col items-center py-2 gap-[2px] transition-opacity duration-150 active:scale-[0.95] hover:opacity-70"
      style={PILL_STYLE}
    >
      {inner}
    </button>
  ) : (
    <span className="flex-1 flex flex-col items-center py-2 gap-[2px]" style={PILL_STYLE}>{inner}</span>
  );
}

/* ─── Презентаційна картка (props-only) — для own-eyes прев'ю без хуків ─── */
export function NextFreeDaysCard({
  freeDays, freeCount, workingDays, onDayClick,
}: Omit<NextFreeDaysData, 'isLoading'> & { onDayClick?: (iso: string) => void }) {
  // ── win-стан: 0 вільних днів → все розписано (латає діру desktop-гріда замість return null) ──
  if (freeCount === 0) {
    return (
      <Section title="Вільні дні" icon={CalendarDays} className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">
        <div className="flex flex-col justify-center flex-1 py-1">
          <span className="flex items-center gap-2">
            <span className="heading-serif text-[24px] text-[var(--text-primary)] leading-none">Усе розписано</span>
            <span className="inline-flex size-2 rounded-full" style={{ background: 'var(--success)' }} aria-hidden />
          </span>
          <p className="text-[13px] mt-2.5 text-[var(--text-secondary)]">Найближчі два тижні зайняті</p>
        </div>
      </Section>
    );
  }

  const openness = workingDays > 0 ? freeCount / workingDays : 0;
  const eyebrow = openness >= OPEN_THRESHOLD ? 'Багато вільних вікон' : 'Найближче вільне вікно';
  const hero = freeDays[0];
  const rail = freeDays.slice(1);

  return (
    <Section title="Вільні дні" icon={CalendarDays} className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">
      {hero && <HeroWindow day={hero} eyebrow={eyebrow} onDayClick={onDayClick} />}

      {rail.length > 0 && (
        <div className="flex gap-2 mt-3">
          {rail.map(day => <RailPill key={day.iso} day={day} onDayClick={onDayClick} />)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-3 mt-auto" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
        <Cta cta={CTA_FLASH} primary={false} />
        <Cta cta={CTA_STORIES} primary />
      </div>
    </Section>
  );
}

interface NextFreeDaysWidgetProps {
  onDayClick?: (date: string) => void;
}

export function NextFreeDaysWidget({ onDayClick }: NextFreeDaysWidgetProps) {
  const { isLoading, ...data } = useNextFreeDays();

  if (isLoading) {
    return (
      <Section title="Вільні дні" icon={CalendarDays} className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">
        <div className="skeleton-shimmer h-9 w-40 rounded-lg mb-3" />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton-shimmer flex-1 h-12 rounded-[10px]" />)}
        </div>
      </Section>
    );
  }

  return <NextFreeDaysCard {...data} onDayClick={onDayClick} />;
}
