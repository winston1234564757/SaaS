'use client';

import { Sheet } from '@/components/ui/Sheet';
import { Bell, Send, Smartphone, CheckCircle, XCircle, Loader2, Zap, Hand, Check } from 'lucide-react';
import { useFlashDealStats } from '@/lib/supabase/hooks/useFlashDeals';

interface Props {
  dealId: string | null;
  serviceName: string;
  onClose: () => void;
}

/**
 * M-REV-03: detail + delivery stats for one flash deal. Mirrors BroadcastDetailSheet
 * (legend, per-recipient channel dots, summary footer) and adds origin + claimed.
 */
export function FlashDealDetailSheet({ dealId, serviceName, onClose }: Props) {
  const { data: stats, isLoading } = useFlashDealStats(dealId);

  return (
    <Sheet
      open={!!dealId}
      onOpenChange={(v) => !v && onClose()}
      title="Деталі акції"
      maxWidth="md"
    >
      <div className="flex flex-col gap-5 pb-4">
        {/* Hero: service + origin badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground truncate">{serviceName}</p>
            {stats && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.origin === 'auto'
                  ? 'Створено автоматично після скасування'
                  : 'Створено вручну'}
              </p>
            )}
          </div>
          {stats && (
            <span
              className={
                stats.origin === 'auto'
                  ? 'flex items-center gap-1 shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700'
                  : 'flex items-center gap-1 shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/12 text-primary'
              }
            >
              {stats.origin === 'auto' ? <Zap size={12} /> : <Hand size={12} />}
              {stats.origin === 'auto' ? 'Авто' : 'Вручну'}
            </span>
          )}
        </div>

        {/* Claimed status */}
        {stats && (
          <div
            className={
              stats.claimed
                ? 'flex items-center gap-2 px-3.5 py-3 rounded-2xl bg-success/10 text-success'
                : 'flex items-center gap-2 px-3.5 py-3 rounded-2xl bg-secondary/60 text-muted-foreground'
            }
          >
            <Check size={15} className="shrink-0" />
            <p className="text-sm font-medium">
              {stats.claimed
                ? `Заброньовано${stats.claimedByName ? `: ${stats.claimedByName}` : ''}`
                : 'Ще не заброньовано'}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground/60">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Завантаження...</span>
          </div>
        )}

        {/* Empty state — old deals that never tracked delivery */}
        {!isLoading && stats && stats.recipients.length === 0 && (
          <div className="text-center py-8 px-4 text-sm text-muted-foreground/70">
            Доставку для цієї акції не відстежували.
          </div>
        )}

        {/* Recipients list */}
        {!isLoading && stats && stats.recipients.length > 0 && (
          <div className="flex flex-col gap-3">
            {/* Legend */}
            <div className="flex items-center gap-4">
              <LegendItem icon={<Bell size={12} />} label="In-app" />
              <LegendItem icon={<Smartphone size={12} />} label="Push" />
              <LegendItem icon={<Send size={12} />} label="Telegram" />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Кого сповістили</h3>
              <span className="text-xs text-muted-foreground tabular-nums">{stats.notifiedCount}</span>
            </div>

            <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {stats.recipients.map((r) => (
                <div key={r.clientId} className="px-4 py-3 flex items-center gap-3">
                  <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">{r.name}</p>
                  <div className="flex items-center gap-3 shrink-0">
                    <ChannelDot ok={r.inAppSent} label="App" />
                    <ChannelDot ok={r.pushSent} label="Push" />
                    <ChannelDot ok={r.telegramSent} label="TG" />
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex gap-3 pt-1">
              <SummaryCell label="Сповіщено" value={stats.notifiedCount} total={stats.notifiedCount} />
              <SummaryCell label="Push" value={stats.pushCount} total={stats.notifiedCount} />
              <SummaryCell label="Telegram" value={stats.telegramCount} total={stats.notifiedCount} />
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function ChannelDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {ok
        ? <CheckCircle size={14} className="text-success" />
        : <XCircle size={14} className="text-muted-foreground/30" />}
      <span className="text-[9px] text-muted-foreground/60">{label}</span>
    </div>
  );
}

function LegendItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      {icon}
      <span className="text-[10px]">{label}</span>
    </div>
  );
}

function SummaryCell({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex-1 text-center">
      <p className="text-base font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground/60">{label} · {pct}%</p>
    </div>
  );
}
