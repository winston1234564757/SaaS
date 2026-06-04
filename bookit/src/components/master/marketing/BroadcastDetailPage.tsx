'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Bell, Send, Phone, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useBroadcasts, useBroadcastDeliveryResults } from '@/lib/supabase/hooks/useBroadcasts';

interface Props {
  broadcastId: string;
}

export function BroadcastDetailPage({ broadcastId }: Props) {
  const router = useRouter();
  const { data: broadcasts } = useBroadcasts();
  const { data: results, isLoading } = useBroadcastDeliveryResults(broadcastId);

  const broadcast = broadcasts?.find(b => b.id === broadcastId);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button type="button"
          onClick={() => router.back()}
          aria-label="Назад"
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors active:scale-95 transition-all"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-foreground truncate">
            {broadcast?.title ?? 'Розсилка'}
          </h1>
          <p className="text-xs text-muted-foreground/60">Результати по клієнтах</p>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-b border-secondary flex items-center gap-4">
        <LegendItem icon={<Bell size={12} />} label="In-app" color="#789A99" />
        <LegendItem icon={<Bell size={12} />} label="Push" color="#5C9E7A" />
        <LegendItem icon={<Send size={12} />} label="Telegram" color="#4A9BE0" />
        <LegendItem icon={<Phone size={12} />} label="SMS" color="#D4935A" />
      </div>

      {/* List */}
      <div>
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground/60">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Завантаження...</span>
          </div>
        )}

        {!isLoading && (!results || results.length === 0) && (
          <div className="text-center py-16 text-sm text-muted-foreground/60">
            Немає даних про доставку
          </div>
        )}

        {!isLoading && results && results.length > 0 && (
          <div className="divide-y divide-secondary">
            {results.map(r => (
              <div key={r.clientId} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground/60">{r.phone}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ChannelDot color="#789A99" label="App" ok />
                  <ChannelDot color="#5C9E7A" label="Push" ok={r.pushSent} />
                  <ChannelDot color="#4A9BE0" label="TG"  ok={r.telegramSent} />
                  <ChannelDot color="#D4935A" label="SMS" ok={r.smsSent} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary footer */}
      {results && results.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t border-secondary bg-background">
          <div className="flex gap-4 text-center">
            <SummaryCell label="Push" value={results.filter(r => r.pushSent).length} total={results.length} />
            <SummaryCell label="Telegram" value={results.filter(r => r.telegramSent).length} total={results.length} />
            <SummaryCell label="SMS" value={results.filter(r => r.smsSent).length} total={results.length} />
            <SummaryCell label="Жоден" value={results.filter(r => !r.pushSent && !r.telegramSent && !r.smsSent).length} total={results.length} dim />
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelDot({ ok, color, label }: { ok: boolean; color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {ok
        ? <CheckCircle size={14} style={{ color }} />
        : <XCircle size={14} className="text-[#E8D5CC]" />}
      <span className="text-[9px] text-muted-foreground/60">{label}</span>
    </div>
  );
}

function LegendItem({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span style={{ color }}>{icon}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function SummaryCell({ label, value, total, dim }: { label: string; value: number; total: number; dim?: boolean }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex-1">
      <p className="text-xs font-bold" style={{ color: dim ? '#C05B5B' : '#2C1A14' }}>{value}</p>
      <p className="text-[10px] text-muted-foreground/60">{label} · {pct}%</p>
    </div>
  );
}
