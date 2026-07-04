'use client';

import { Sheet } from '@/components/ui/Sheet';
import { EditorialCover } from '@/components/ui/EditorialCover';
import { Section } from '@/components/ui/Section';
import { Megaphone, Loader2, Users } from 'lucide-react';
import { useBroadcastDeliveryResults } from '@/lib/supabase/hooks/useBroadcasts';
import type { DeliveryResult } from '@/app/(master)/dashboard/marketing/actions';
import {
  ChannelLegend, ChannelSummary, DeliveryRoster, type RosterPerson,
} from '@/components/master/marketing/deliveryReportKit';

interface Props {
  broadcastId: string;
  broadcastTitle: string;
  onClose: () => void;
}

/**
 * DS-MODAL-05 — результати розсилки. Дизайн-мова: темна обкладинка несе охоплення
 * (домінанта — скільки клієнтів отримали + мікс каналів), світле тіло — реєстр доставки.
 * Раніше дублювала заголовок (title у Sheet + власний <h2>) — тепер srTitle, ідентичність у героя.
 */
export function BroadcastDetailSheet({ broadcastId, broadcastTitle, onClose }: Props) {
  const { data: results, isLoading } = useBroadcastDeliveryResults(broadcastId);
  return (
    <Sheet open onOpenChange={(v) => !v && onClose()} srTitle={`Розсилка: ${broadcastTitle}`} maxWidth="md">
      <BroadcastDetailView title={broadcastTitle} isLoading={isLoading} results={results ?? null} />
    </Sheet>
  );
}

// ── Presentational view (props-only → own-eyes прев'ю без auth) ──────────────────

export function BroadcastDetailView({
  title, isLoading, results,
}: {
  title: string;
  isLoading: boolean;
  results: DeliveryResult[] | null;
}) {
  const total = results?.length ?? 0;
  const pushN = results?.filter((r) => r.pushSent).length ?? 0;
  const tgN = results?.filter((r) => r.telegramSent).length ?? 0;
  const smsN = results?.filter((r) => r.smsSent).length ?? 0;

  const people: RosterPerson[] = (results ?? []).map((r) => ({
    id: r.clientId,
    name: r.name,
    subtitle: r.phone,
    channels: [
      { key: 'app', ok: true }, // in-app — усі з профілем
      { key: 'push', ok: r.pushSent },
      { key: 'tg', ok: r.telegramSent },
      { key: 'sms', ok: r.smsSent },
    ],
  }));

  return (
    <div className="flex flex-col gap-5 pb-2">
      {/* ── HERO: темна обкладинка — охоплення ── */}
      <EditorialCover glowColor={total > 0 ? '#6366F1' : undefined}>
        <div className="flex items-center gap-1.5 mb-3 text-white/55">
          <Megaphone size={13} aria-hidden />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Розсилка</span>
        </div>

        <h2 className="heading-serif text-[22px] leading-[1.15] text-white text-balance">{title}</h2>

        <div className="mt-5 pt-4 border-t border-white/10 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="metric-value text-[34px] leading-none text-white">{total}</p>
            <p className="text-[11px] text-white/55 mt-1.5">
              {total === 1 ? 'клієнт отримав сповіщення' : 'клієнтів отримали сповіщення'}
            </p>
          </div>
          {total > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
              {pushN > 0 && <HeroChip label="Push" value={pushN} />}
              {tgN > 0 && <HeroChip label="Telegram" value={tgN} />}
              {smsN > 0 && <HeroChip label="SMS" value={smsN} />}
            </div>
          )}
        </div>
      </EditorialCover>

      {/* ── ТІЛО: реєстр доставки ── */}
      {isLoading ? (
        <Section title="Кому надіслано">
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => <div key={i} className="h-11 rounded-xl bg-secondary/40 animate-pulse" />)}
          </div>
        </Section>
      ) : total > 0 ? (
        <Section title="Кому надіслано" icon={Users}>
          <div className="flex flex-col gap-4">
            <ChannelLegend channels={['app', 'push', 'tg', 'sms']} />
            <ChannelSummary
              cells={[
                { key: 'push', value: pushN, total },
                { key: 'tg', value: tgN, total },
                { key: 'sms', value: smsN, total },
              ]}
            />
            <DeliveryRoster people={people} />
          </div>
        </Section>
      ) : (
        <Section title="Кому надіслано" icon={Users}>
          <p className="text-[13px] text-text-sub leading-relaxed">Немає даних про доставку.</p>
        </Section>
      )}
    </div>
  );
}

function HeroChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/80 bg-white/10 px-2.5 py-1 rounded-full">
      <span className="metric-value tabular-nums">{value}</span>
      <span className="text-white/55">{label}</span>
    </span>
  );
}
