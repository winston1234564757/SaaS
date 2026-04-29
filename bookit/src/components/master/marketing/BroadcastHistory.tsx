'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Clock, Users, MousePointerClick, CalendarCheck,
  Percent, ChevronRight, Trash2, Loader2, BarChart3, ListChecks,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dates';
import { useBroadcasts, useBroadcastAnalytics, useBroadcastMutations } from '@/lib/supabase/hooks/useBroadcasts';
import { BroadcastDetailSheet } from './BroadcastDetailSheet';
import type { Broadcast } from '@/types/database';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:   { label: 'Чернетка', color: '#A8928D', bg: '#A8928D15' },
  sending: { label: 'Відправка', color: '#D4935A', bg: '#D4935A15' },
  sent:    { label: 'Відправлено', color: '#5C9E7A', bg: '#5C9E7A15' },
  failed:  { label: 'Помилка', color: '#C05B5B', bg: '#C05B5B15' },
};

export function BroadcastHistory() {
  const { data: broadcasts, isLoading } = useBroadcasts();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const detailBroadcast = broadcasts?.find(b => b.id === detailId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.5)' }} />
        ))}
      </div>
    );
  }

  if (!broadcasts || broadcasts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(120,154,153,0.12)' }}
        >
          <BarChart3 size={24} className="text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">Розсилок ще немає</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Створіть першу розсилку — і тут з&apos;явиться аналітика</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-4">
        {broadcasts.map(b => (
          <BroadcastCard
            key={b.id}
            broadcast={b as Broadcast}
            expanded={expanded === b.id}
            onToggle={() => setExpanded(prev => prev === b.id ? null : b.id)}
            onDetail={() => setDetailId(b.id)}
          />
        ))}
      </div>

      <AnimatePresence>
        {detailId && detailBroadcast && (
          <BroadcastDetailSheet
            key={detailId}
            broadcastId={detailId}
            broadcastTitle={detailBroadcast.title}
            onClose={() => setDetailId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function BroadcastCard({
  broadcast: b, expanded, onToggle, onDetail,
}: { broadcast: Broadcast; expanded: boolean; onToggle: () => void; onDetail: () => void }) {
  const status = STATUS_MAP[b.status] ?? STATUS_MAP.draft;
  const { remove } = useBroadcastMutations();
  const { data: analytics } = useBroadcastAnalytics(expanded && b.status === 'sent' ? b.id : null);

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.4)' }}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:scale-95 transition-all"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: status.color, background: status.bg }}
            >
              {status.label}
            </span>
            {b.discount_percent && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-primary bg-[#789A9915]">
                -{b.discount_percent}%
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{b.title}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            {b.status === 'sent' && b.sent_at
              ? `${formatDate(new Date(b.sent_at))} · ${b.recipients_count} клієнтів`
              : formatDate(new Date(b.created_at))}
          </p>
        </div>
        <ChevronRight
          size={16}
          className="text-muted-foreground/60 shrink-0 transition-transform"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Expanded analytics */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-secondary"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Message preview */}
              <div>
                <p className="text-[10px] text-muted-foreground/60 mb-1">Повідомлення</p>
                <p className="text-xs text-foreground leading-relaxed bg-secondary/60 rounded-xl px-3 py-2">
                  {b.message_template}
                </p>
              </div>

              {/* Analytics grid */}
              {b.status === 'sent' && (
                <div>
                  <p className="text-[10px] text-muted-foreground/60 mb-2">Аналітика</p>
                  {analytics ? (
                    <div className="grid grid-cols-2 gap-2">
                      <StatCard icon={<Send size={13} />} label="Відправлено" value={analytics.sent} />
                      <StatCard icon={<MousePointerClick size={13} />} label="Клікнуло" value={analytics.clicked} />
                      <StatCard icon={<CalendarCheck size={13} />} label="Записалось" value={analytics.booked} highlight />
                      <StatCard icon={<Percent size={13} />} label="Конверсія" value={`${analytics.conversion_pct}%`} highlight />
                      <StatCard icon={<Clock size={13} />} label="Push" value={analytics.push_sent} />
                      <StatCard icon={<Users size={13} />} label="Telegram" value={analytics.telegram_sent} />
                      {analytics.discount_used > 0 && (
                        <StatCard icon={<Percent size={13} />} label="Знижку використано" value={analytics.discount_used} />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                      <Loader2 size={13} className="animate-spin" />
                      Завантаження аналітики...
                    </div>
                  )}
                </div>
              )}

              {/* Per-client results */}
              {b.status === 'sent' && (
                <button
                  onClick={onDetail}
                  className="flex items-center gap-1.5 text-xs text-primary font-medium hover:opacity-70 transition-opacity active:scale-95 transition-all"
                >
                  <ListChecks size={13} />
                  Деталі по клієнтах
                </button>
              )}

              {/* Delete draft */}
              {b.status === 'draft' && (
                <button
                  onClick={() => remove.mutate(b.id)}
                  disabled={remove.isPending}
                  className="flex items-center gap-1.5 text-xs text-destructive hover:opacity-70 transition-opacity"
                >
                  {remove.isPending
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Trash2 size={13} />}
                  Видалити чернетку
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, highlight,
}: { icon: React.ReactNode; label: string; value: number | string; highlight?: boolean }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 flex items-center gap-2"
      style={{
        background: highlight ? 'rgba(92,158,122,0.08)' : 'rgba(255,232,220,0.6)',
        border: highlight ? '1px solid rgba(92,158,122,0.2)' : '1px solid rgba(255,255,255,0.3)',
      }}
    >
      <span style={{ color: highlight ? '#5C9E7A' : '#A8928D' }}>{icon}</span>
      <div>
        <p className="text-[10px]" style={{ color: highlight ? '#5C9E7A' : '#A8928D' }}>{label}</p>
        <p className="text-sm font-bold" style={{ color: highlight ? '#5C9E7A' : '#2C1A14' }}>{value}</p>
      </div>
    </div>
  );
}
