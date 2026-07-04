'use client';

import type { LucideIcon } from 'lucide-react';
import { Bell, Smartphone, Send, Phone, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Спільний kit «Звіту про доставку» — база для FlashDealDetailSheet (DS-MODAL-04) та
 * BroadcastDetailSheet (DS-MODAL-05). Дизайн-мова: темний герой володіє драмою (охоплення /
 * заброньовано), а тут — тихе біле тіло: легенда каналів + чесний реєстр отримувачів.
 *
 * Реєстр — легітимно однорідний список (люди, як фото-грід): рівність тут не «ретрофіт»,
 * бо асиметрію несе герой. Кольори калібровані під Frost `--surface` (не сирі статус-токени).
 */

export type ChannelKey = 'app' | 'push' | 'tg' | 'sms';

const CH_META: Record<ChannelKey, { label: string; short: string; Icon: LucideIcon }> = {
  app:  { label: 'У застосунку', short: 'App',  Icon: Bell },
  push: { label: 'Push',         short: 'Push', Icon: Smartphone },
  tg:   { label: 'Telegram',     short: 'TG',   Icon: Send },
  sms:  { label: 'SMS',          short: 'SMS',  Icon: Phone },
};

// Калібровано під `--surface` (periwinkle L≈0.86): доставлено = емералд 5.25:1, ні = тихий контур.
const OK_COLOR = '#0B6B2E';

export interface RosterChannel { key: ChannelKey; ok: boolean }
export interface RosterPerson { id: string; name: string; subtitle?: string; channels: RosterChannel[] }

/** Легенда каналів — тиха, під eyebrow Section. */
export function ChannelLegend({ channels }: { channels: ChannelKey[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {channels.map((key) => {
        const { label, Icon } = CH_META[key];
        return (
          <span key={key} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-sub">
            <Icon size={12} aria-hidden />
            {label}
          </span>
        );
      })}
    </div>
  );
}

/** Один канал у рядку отримувача: доставлено = емералд-галочка, ні = тихий контур. */
function ChannelDot({ ch }: { ch: RosterChannel }) {
  const { label, short } = CH_META[ch.key];
  return (
    <div className="flex flex-col items-center gap-1 w-9" aria-label={`${label}: ${ch.ok ? 'доставлено' : 'не доставлено'}`}>
      <span
        className={cn(
          'size-5 rounded-full flex items-center justify-center',
          ch.ok ? '' : 'border border-[var(--border-strong)]',
        )}
        style={ch.ok ? { background: `${OK_COLOR}1A` } : undefined}
      >
        {ch.ok
          ? <Check size={12} strokeWidth={3} style={{ color: OK_COLOR }} aria-hidden />
          : <span className="size-1 rounded-full bg-[var(--text-tertiary)]" aria-hidden />}
      </span>
      <span className="text-[9px] font-semibold text-text-sub tabular-nums">{short}</span>
    </div>
  );
}

/**
 * Реєстр отримувачів. Порожній/один/багато — той самий рядок; драма живе в герої.
 * Перший рядок трохи багатший (featured) — тонка диференціація, як у C-CLI-01.
 */
export function DeliveryRoster({ people }: { people: RosterPerson[] }) {
  return (
    <div className="flex flex-col">
      {people.map((p, i) => (
        <div
          key={p.id}
          className={cn(
            'flex items-center gap-3 py-3 border-b border-border/40 last:border-0',
            i === 0 && 'pt-0',
          )}
        >
          <div className="flex-1 min-w-0">
            <p className={cn('font-semibold text-foreground truncate', i === 0 ? 'text-sm' : 'text-[13px]')}>{p.name}</p>
            {p.subtitle && <p className="text-[11px] text-text-sub truncate tabular-nums mt-0.5">{p.subtitle}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {p.channels.map((ch) => <ChannelDot key={ch.key} ch={ch} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Підсумковий рядок каналів — differentiated summary у хедері реєстру. */
export function ChannelSummary({
  cells,
}: {
  cells: { key: ChannelKey; value: number; total: number }[];
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map(({ key, value, total }) => {
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <div key={key} className="rounded-xl bg-secondary/50 px-2.5 py-2.5 text-center">
            <p className="metric-value text-lg text-foreground leading-none">{value}</p>
            <p className="text-[10px] font-semibold text-text-sub mt-1 truncate">
              {CH_META[key].label} · {pct}%
            </p>
          </div>
        );
      })}
    </div>
  );
}
