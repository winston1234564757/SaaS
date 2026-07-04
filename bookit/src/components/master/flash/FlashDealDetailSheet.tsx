'use client';

import { Sheet } from '@/components/ui/Sheet';
import { EditorialCover } from '@/components/ui/EditorialCover';
import { Section } from '@/components/ui/Section';
import { Zap, Hand, Check, Hourglass, Loader2, Radio } from 'lucide-react';
import { useFlashDealStats } from '@/lib/supabase/hooks/useFlashDeals';
import type { FlashDealStats } from '@/app/(master)/dashboard/flash/actions';
import {
  ChannelLegend, ChannelSummary, DeliveryRoster, type RosterPerson,
} from '@/components/master/marketing/deliveryReportKit';

interface Props {
  dealId: string | null;
  serviceName: string;
  onClose: () => void;
}

/**
 * DS-MODAL-04 — деталі флеш-акції. Дизайн-мова: темна обкладинка-герой володіє драмою
 * (заброньовано чи чекає — з відповідним glow), світле тіло — тихий звіт про доставку.
 * Реюз C-CLI-01 (EditorialCover + Section + Sheet srTitle) та deliveryReportKit з розсилкою.
 */
export function FlashDealDetailSheet({ dealId, serviceName, onClose }: Props) {
  const { data: stats, isLoading } = useFlashDealStats(dealId);
  return (
    <Sheet
      open={!!dealId}
      onOpenChange={(v) => !v && onClose()}
      srTitle={`Акція: ${serviceName}`}
      maxWidth="md"
    >
      <FlashDealDetailView serviceName={serviceName} isLoading={isLoading} stats={stats ?? null} />
    </Sheet>
  );
}

// ── Presentational view (props-only → own-eyes прев'ю без auth) ──────────────────

export function FlashDealDetailView({
  serviceName, isLoading, stats,
}: {
  serviceName: string;
  isLoading: boolean;
  stats: FlashDealStats | null;
}) {
  const claimed = !!stats?.claimed;
  const glow = claimed ? '#34D399' : stats ? '#FB923C' : undefined;
  const people: RosterPerson[] = (stats?.recipients ?? []).map((r) => ({
    id: r.clientId,
    name: r.name,
    channels: [
      { key: 'app', ok: r.inAppSent },
      { key: 'push', ok: r.pushSent },
      { key: 'tg', ok: r.telegramSent },
    ],
  }));

  return (
    <div className="flex flex-col gap-5 pb-2">
      {/* ── HERO: темна обкладинка — акція + її доля ── */}
      <EditorialCover glowColor={glow}>
        <div className="flex items-center gap-2 mb-3">
          {stats?.origin === 'auto' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-200 bg-amber-300/15 px-2.5 py-1 rounded-full">
              <Zap size={12} /> Авто після скасування
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
              <Hand size={12} /> Створено вручну
            </span>
          )}
        </div>

        <h2 className="heading-serif text-[26px] leading-[1.1] text-white text-balance">{serviceName}</h2>

        {/* Доля акції — домінанта-зірка */}
        <div className="mt-4 pt-4 border-t border-white/10">
          {isLoading && !stats ? (
            <div className="flex items-center gap-3">
              <span className="size-10 rounded-2xl bg-white/10 animate-pulse shrink-0" />
              <span className="h-4 w-36 rounded-full bg-white/10 animate-pulse" />
            </div>
          ) : claimed ? (
            <div className="flex items-center gap-3">
              <span className="size-10 rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/25 flex items-center justify-center shrink-0">
                <Check size={20} className="text-emerald-200" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold text-emerald-200 leading-tight">Заброньовано</p>
                {stats?.claimedByName && (
                  <p className="text-sm text-white/70 truncate mt-0.5">{stats.claimedByName}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="size-10 rounded-2xl bg-amber-300/12 ring-1 ring-amber-200/20 flex items-center justify-center shrink-0">
                <Hourglass size={18} className="text-amber-200" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold text-white leading-tight">Чекає на клієнта</p>
                <p className="text-sm text-white/55 mt-0.5">
                  {stats && stats.notifiedCount > 0
                    ? `Сповіщено ${stats.notifiedCount}`
                    : 'Ще нікого не сповіщено'}
                </p>
              </div>
            </div>
          )}
        </div>
      </EditorialCover>

      {/* ── ТІЛО: звіт про доставку ── */}
      {isLoading ? (
        <Section title="Кого сповістили">
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => <div key={i} className="h-11 rounded-xl bg-secondary/40 animate-pulse" />)}
          </div>
        </Section>
      ) : people.length > 0 ? (
        <Section title="Кого сповістили" icon={Radio} action={<span className="metric-value text-sm text-text-sub">{stats!.notifiedCount}</span>}>
          <div className="flex flex-col gap-4">
            <ChannelLegend channels={['app', 'push', 'tg']} />
            <ChannelSummary
              cells={[
                { key: 'push', value: stats!.pushCount, total: stats!.notifiedCount },
                { key: 'tg', value: stats!.telegramCount, total: stats!.notifiedCount },
              ]}
            />
            <DeliveryRoster people={people} />
          </div>
        </Section>
      ) : (
        <Section title="Кого сповістили" icon={Radio}>
          <p className="text-[13px] text-text-sub leading-relaxed">
            Доставку для цієї акції не відстежували.
          </p>
        </Section>
      )}
    </div>
  );
}
