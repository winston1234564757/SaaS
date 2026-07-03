'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarX, Send, Zap } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Sheet } from '@/components/ui/Sheet';
import { useCancellationRate, type CancelledEntry, type CancellationRateData } from '../shared/hooks/useCancellationRate';
import { timeAgo } from '@/lib/utils/dates';
import { pluralUk } from '@/lib/utils/pluralUk';
import { cn } from '@/lib/utils/cn';

/** Нижче цього обсягу valid-записів % — статистичний шум → веде подія, не відсоток. */
const DENSE_THRESHOLD = 5;

/**
 * Статус-тони для ДРІБНОГО тексту (12px, weight 500 → normal, потрібно 4.5:1).
 * Токени --success/--warning відтюнено під більший розмір і провалюють 4.5 на periwinkle-картці
 * (≈3.95:1). Ці відтінки дають ≥5:1 на --surface. --error (#B91C1C) уже 5.1:1 — беремо токен.
 */
const TONE = {
  good: '#0B6B2E',        // 5.3:1 на картці
  warn: '#9A4508',        // 5.1:1
  bad:  'var(--error)',   // #B91C1C, 5.1:1
} as const;

type CtaSpec = { href: string; label: string; Icon: typeof Send };
const CTA_BROADCAST: CtaSpec = { href: '/dashboard/marketing',                  label: 'Розсилка',   Icon: Send };
const CTA_OFFER: CtaSpec     = { href: '/dashboard/revenue?drawer=flash_deals', label: 'Пропозиція', Icon: Zap  };

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

function verdictOf(rate: number): { label: string; color: string } {
  if (rate <= 10) return { label: 'Низький',  color: TONE.good };
  if (rate <= 25) return { label: 'Помірний', color: TONE.warn };
  return { label: 'Високий', color: TONE.bad };
}

function Cta({ cta, primary }: { cta: CtaSpec; primary: boolean }) {
  const { href, label, Icon } = cta;
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-2 h-12 rounded-[14px] font-semibold text-[13px] transition-transform duration-150 active:scale-[0.96]"
      style={primary ? PRIMARY_STYLE : SECONDARY_STYLE}
    >
      <Icon size={15} strokeWidth={1.8} aria-hidden />
      {label}
    </Link>
  );
}

/* ─── Рядок скасування у Sheet: свіжий — багатший featured, старіші — компактні ─── */
function CancelledRow({ entry, featured }: { entry: CancelledEntry; featured?: boolean }) {
  const when = entry.when ?? entry.bookingDate;
  return (
    <div
      className={cn('flex items-center gap-3', featured ? 'py-4' : 'py-3')}
      style={{ borderBottom: '1px solid color-mix(in srgb, var(--accent) 8%, transparent)' }}
    >
      <span
        className={cn('flex items-center justify-center rounded-full flex-shrink-0', featured ? 'size-11' : 'size-10')}
        style={{ background: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--error)' }}
      >
        <CalendarX size={featured ? 20 : 18} strokeWidth={1.8} aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn('truncate text-[var(--text-primary)]', featured ? 'heading-serif text-[18px]' : 'text-[14px] font-semibold')}>
          {entry.clientName}
        </p>
        {entry.service && (
          <p className="text-[12px] text-[var(--text-secondary)] truncate">{entry.service}</p>
        )}
      </div>
      <div className="flex flex-col items-end flex-shrink-0 text-right">
        <span className="text-[12px] text-[var(--text-secondary)]">{timeAgo(when)}</span>
        <span className="text-[11px] text-[var(--text-secondary)]">
          {entry.by === 'client' ? 'Скасував клієнт' : 'Скасували ви'}
        </span>
      </div>
    </div>
  );
}

/* ─── Свіже скасування як featured-подія в тілі картки (тап → повний список) ─── */
function FreshEvent({
  entry, open, onOpen,
}: { entry: CancelledEntry; open: boolean; onOpen: () => void }) {
  const when = entry.when ?? entry.bookingDate;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label="Деталі скасувань цього тижня"
      className="w-full text-left flex items-center gap-3 rounded-xl -mx-2 px-2 py-2 transition-colors active:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
    >
      <span
        className="flex items-center justify-center size-11 rounded-full flex-shrink-0"
        style={{ background: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--error)' }}
      >
        <CalendarX size={20} strokeWidth={1.8} aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <p className="heading-serif text-[18px] text-[var(--text-primary)] truncate leading-tight">{entry.clientName}</p>
        {entry.service && <p className="text-[12px] text-[var(--text-secondary)] truncate">{entry.service}</p>}
        <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
          {timeAgo(when)} · {entry.by === 'client' ? 'скасував клієнт' : 'скасували ви'}
        </p>
      </div>
    </button>
  );
}

/* ─── Презентаційна картка (props-only) — для own-eyes прев'ю без хуків ─── */
export function CancellationCard({
  thisRate, delta, thisTotal, cancelledList,
}: Omit<CancellationRateData, 'isLoading' | 'lastRate' | 'improved'>) {
  const [open, setOpen] = useState(false);
  const count = cancelledList.length;
  const isDense = thisTotal >= DENSE_THRESHOLD;
  const fresh = cancelledList[0];

  // ── Стан 1: жодного valid-запису → рейт не має сенсу ──
  if (thisTotal === 0) {
    return (
      <Wrapper open={open} setOpen={setOpen} list={cancelledList}>
        <div className="flex flex-col justify-center flex-1 py-2">
          <p className="heading-serif text-[22px] text-[var(--text-primary)] leading-tight">Ще немає записів</p>
          <p className="text-[12px] mt-1.5 text-[var(--text-secondary)] max-w-[34ch]">
            Рейт скасувань зʼявиться, щойно підуть записи цього тижня.
          </p>
        </div>
      </Wrapper>
    );
  }

  // ── Стан 2: записи є, скасувань нуль → win-стан ──
  if (count === 0) {
    return (
      <Wrapper open={open} setOpen={setOpen} list={cancelledList}>
        <div className="flex flex-col justify-center flex-1 py-1">
          <span className="flex items-center gap-2">
            <span className="heading-serif text-[24px] text-[var(--text-primary)] leading-none">Без скасувань</span>
            <span className="inline-flex size-2 rounded-full" style={{ background: 'var(--success)' }} aria-hidden />
          </span>
          <p className="text-[13px] mt-2.5 text-[var(--text-secondary)]">
            <span className="metric-value font-semibold text-[var(--text-primary)]">{thisTotal}</span>{' '}
            {pluralUk(thisTotal, 'запис', 'записи', 'записів')} утримано цього тижня
          </p>
          {delta !== null && delta < 0 && (
            <p className="text-[12px] mt-1.5 font-medium" style={{ color: TONE.good }}>
              Чистіше, ніж минулого тижня
            </p>
          )}
        </div>
      </Wrapper>
    );
  }

  // ── Стан 3: мало даних (< поріг) → веде ПОДІЯ, % — шум → чесний «N з M» ──
  if (!isDense) {
    return (
      <Wrapper open={open} setOpen={setOpen} list={cancelledList}>
        <div className="flex flex-col flex-1">
          <p className="text-[12px] text-[var(--text-secondary)]">
            <span className="metric-value font-semibold text-[var(--text-primary)]">{count}</span>{' '}
            {pluralUk(count, 'скасування', 'скасування', 'скасувань')} · {count} з {thisTotal} записів
          </p>
          <div className="mt-3">
            {fresh && <FreshEvent entry={fresh} open={open} onOpen={() => setOpen(true)} />}
          </div>
          {count > 1 && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="self-start mt-1 -mx-2 px-2 py-1 text-[12px] font-semibold text-[var(--accent)] active:scale-[0.98] transition-transform"
            >
              Переглянути всі {count} →
            </button>
          )}
          <div className="mt-auto pt-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
            <Cta cta={CTA_OFFER} primary />
          </div>
        </div>
      </Wrapper>
    );
  }

  // ── Стан 4: обсяг достатній → домінанта = % + вердикт + тренд ──
  const verdict = verdictOf(thisRate ?? 0);
  const trend =
    delta === null ? null
    : delta < 0 ? { text: `Краще на ${Math.abs(delta)}% за тиждень`, color: TONE.good }
    : delta > 0 ? { text: `Гірше на ${delta}% за тиждень`, color: TONE.bad }
    : { text: 'Без змін за тиждень', color: 'var(--text-secondary)' };

  return (
    <Wrapper open={open} setOpen={setOpen} list={cancelledList} action={
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="text-[12px] font-semibold text-[var(--accent)] active:scale-[0.98] transition-transform whitespace-nowrap"
      >
        Усі {count} →
      </button>
    }>
      <div className="flex flex-col flex-1">
        <div className="flex items-end gap-3">
          <span className="metric-value text-[2.4rem] font-bold leading-[0.9] text-[var(--text-primary)]">{thisRate}%</span>
          <div className="flex flex-col pb-1 min-w-0">
            <span className="heading-serif text-[19px] leading-none" style={{ color: verdict.color }}>{verdict.label}</span>
            {trend && <span className="text-[12px] mt-1 font-medium" style={{ color: trend.color }}>{trend.text}</span>}
          </div>
        </div>

        <div className="mt-4">
          {fresh && <FreshEvent entry={fresh} open={open} onOpen={() => setOpen(true)} />}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto pt-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
          <Cta cta={CTA_BROADCAST} primary={false} />
          <Cta cta={CTA_OFFER} primary />
        </div>
      </div>
    </Wrapper>
  );
}

/* ─── Section-обгортка + Sheet повного списку (спільна для всіх станів) ─── */
function Wrapper({
  children, open, setOpen, list, action,
}: {
  children: React.ReactNode;
  open: boolean;
  setOpen: (v: boolean) => void;
  list: CancelledEntry[];
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 h-full">
      <Section title="Скасування" icon={CalendarX} action={action} className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">
        {children}
      </Section>

      <Sheet open={open} onOpenChange={setOpen} variant="adaptive" title="Скасування цього тижня" maxWidth="md">
        {list.length > 0 ? (
          <div className="flex flex-col">
            {list.map((entry, i) => (
              <CancelledRow key={entry.id} entry={entry} featured={i === 0} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <span
              className="flex items-center justify-center size-14 rounded-full mb-4"
              style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', color: 'var(--text-secondary)' }}
            >
              <CalendarX size={26} strokeWidth={1.6} aria-hidden />
            </span>
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Цього тижня скасувань немає</p>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1 max-w-[260px]">
              Коли запис скасують, тут буде видно хто і коли.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}

export function CancellationRateWidget() {
  const { isLoading, ...data } = useCancellationRate();

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 h-full">
        <Section title="Скасування" icon={CalendarX} className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">
          <div className="skeleton-shimmer rounded-xl flex-1" style={{ minHeight: 120 }} />
        </Section>
      </div>
    );
  }

  return <CancellationCard {...data} />;
}
