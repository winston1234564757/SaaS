'use client';

import { motion } from 'framer-motion';
import { X, Bell, Send, Phone, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useBroadcastDeliveryResults } from '@/lib/supabase/hooks/useBroadcasts';

interface Props {
  broadcastId: string;
  broadcastTitle: string;
  onClose: () => void;
}

export function BroadcastDetailSheet({ broadcastId, broadcastTitle, onClose }: Props) {
  const { data: results, isLoading } = useBroadcastDeliveryResults(broadcastId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={onClose}
      />

      <motion.div
        className="relative w-full sm:max-w-lg max-h-[85dvh] overflow-hidden rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{ background: 'rgba(255,232,220,0.98)', backdropFilter: 'blur(20px)' }}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-secondary shrink-0">
          <div>
            <h2 className="font-semibold text-foreground text-base">Результати розсилки</h2>
            <p className="text-xs text-muted-foreground/60 mt-0.5 truncate max-w-[220px]">{broadcastTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors active:scale-95 transition-all">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-5 py-2.5 border-b border-secondary flex items-center gap-4 shrink-0">
          <LegendItem icon={<Bell size={12} />} label="In-app" color="#789A99" />
          <LegendItem icon={<Bell size={12} />} label="Push" color="#5C9E7A" />
          <LegendItem icon={<Send size={12} />} label="Telegram" color="#4A9BE0" />
          <LegendItem icon={<Phone size={12} />} label="SMS" color="#D4935A" />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground/60">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Завантаження...</span>
            </div>
          )}

          {!isLoading && (!results || results.length === 0) && (
            <div className="text-center py-12 text-sm text-muted-foreground/60">
              Немає даних про доставку
            </div>
          )}

          {!isLoading && results && results.length > 0 && (
            <div className="divide-y divide-[#F5E8E3]">
              {results.map(r => (
                <div key={r.clientId} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground/60">{r.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* In-app: always green (sent to all who have profiles) */}
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
          <div className="px-5 py-3 border-t border-secondary shrink-0">
            <div className="flex gap-4 text-center">
              <SummaryCell label="Push" value={results.filter(r => r.pushSent).length} total={results.length} />
              <SummaryCell label="Telegram" value={results.filter(r => r.telegramSent).length} total={results.length} />
              <SummaryCell label="SMS" value={results.filter(r => r.smsSent).length} total={results.length} />
              <SummaryCell label="Жоден" value={results.filter(r => !r.pushSent && !r.telegramSent && !r.smsSent).length} total={results.length} dim />
            </div>
          </div>
        )}
      </motion.div>
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
