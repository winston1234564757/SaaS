'use client';

import { Sheet } from '@/components/ui/Sheet';
import { Bell, Send, Phone, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useBroadcastDeliveryResults } from '@/lib/supabase/hooks/useBroadcasts';

interface Props {
  broadcastId: string;
  broadcastTitle: string;
  onClose: () => void;
}

// Frost-consistent channel palette. Telegram keeps a recognizable blue.
const CH = {
  app:  'var(--accent)',
  push: 'var(--success)',
  tg:   '#2563EB',
  sms:  'var(--warning)',
};

export function BroadcastDetailSheet({ broadcastId, broadcastTitle, onClose }: Props) {
  const { data: results, isLoading } = useBroadcastDeliveryResults(broadcastId);

  return (
    <Sheet open={true} onOpenChange={(v) => !v && onClose()} title="Результати розсилки">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0"
        style={{ borderBottom: '1px solid var(--background-deep)' }}
      >
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground text-base">Результати розсилки</h2>
          <p className="text-xs text-text-secondary mt-0.5 truncate max-w-[220px]">{broadcastTitle}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 py-2.5 flex items-center gap-4 shrink-0"
        style={{ borderBottom: '1px solid var(--background-deep)' }}
      >
        <LegendItem icon={<Bell size={12} />} label="In-app" color={CH.app} />
        <LegendItem icon={<Bell size={12} />} label="Push" color={CH.push} />
        <LegendItem icon={<Send size={12} />} label="Telegram" color={CH.tg} />
        <LegendItem icon={<Phone size={12} />} label="SMS" color={CH.sms} />
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-text-secondary">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Завантаження…</span>
          </div>
        )}

        {!isLoading && (!results || results.length === 0) && (
          <div className="text-center py-12 text-sm text-text-secondary">
            Немає даних про доставку
          </div>
        )}

        {!isLoading && results && results.length > 0 && (
          <div className="divide-y divide-[var(--background-deep)]">
            {results.map(r => (
              <div key={r.clientId} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-[11px] text-text-secondary">{r.phone}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* In-app: always delivered (everyone with a profile) */}
                  <ChannelDot color={CH.app} label="App" ok />
                  <ChannelDot color={CH.push} label="Push" ok={r.pushSent} />
                  <ChannelDot color={CH.tg} label="TG" ok={r.telegramSent} />
                  <ChannelDot color={CH.sms} label="SMS" ok={r.smsSent} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary footer */}
      {results && results.length > 0 && (
        <div className="px-5 py-3 shrink-0" style={{ borderTop: '1px solid var(--background-deep)' }}>
          <div className="flex gap-4 text-center">
            <SummaryCell label="Push" value={results.filter(r => r.pushSent).length} total={results.length} />
            <SummaryCell label="Telegram" value={results.filter(r => r.telegramSent).length} total={results.length} />
            <SummaryCell label="SMS" value={results.filter(r => r.smsSent).length} total={results.length} />
            <SummaryCell label="Жоден" value={results.filter(r => !r.pushSent && !r.telegramSent && !r.smsSent).length} total={results.length} dim />
          </div>
        </div>
      )}
    </Sheet>
  );
}

function ChannelDot({ ok, color, label }: { ok: boolean; color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {ok
        ? <CheckCircle size={14} style={{ color }} />
        : <XCircle size={14} style={{ color: 'color-mix(in srgb, var(--accent) 22%, transparent)' }} />}
      <span className="text-[9px] text-text-secondary">{label}</span>
    </div>
  );
}

function LegendItem({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span style={{ color }}>{icon}</span>
      <span className="text-[10px] text-text-secondary">{label}</span>
    </div>
  );
}

function SummaryCell({ label, value, total, dim }: { label: string; value: number; total: number; dim?: boolean }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex-1">
      <p className="text-sm font-bold tabular-nums" style={{ color: dim ? 'var(--error)' : 'var(--foreground)' }}>{value}</p>
      <p className="text-[10px] text-text-secondary mt-0.5">{label} · {pct}%</p>
    </div>
  );
}
