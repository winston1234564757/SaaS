'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, MousePointerClick, CalendarCheck,
  ChevronRight, Trash2, Loader2, BarChart3, ListChecks,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dates';
import { useBroadcasts, useBroadcastAnalytics, useBroadcastMutations } from '@/lib/supabase/hooks/useBroadcasts';
import type { Broadcast } from '@/types/database';
import { BroadcastDetailSheet } from './BroadcastDetailSheet';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:   { label: 'Чернетка',    color: 'var(--text-secondary)' },
  sending: { label: 'Відправка',   color: 'var(--warning)' },
  sent:    { label: 'Відправлено', color: 'var(--success)' },
  failed:  { label: 'Помилка',     color: 'var(--error)' },
};

export function BroadcastHistory() {
  const { data: broadcasts, isLoading } = useBroadcasts();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ id: string; title: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[72px] rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
        ))}
      </div>
    );
  }

  if (!broadcasts || broadcasts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="size-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--accent-light)' }}
        >
          <BarChart3 size={24} className="text-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Розсилок ще немає</p>
        <p className="text-xs text-text-secondary mt-1">Створіть першу розсилку — і тут зʼявиться аналітика</p>
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
            onDetail={() => setDetail({ id: b.id, title: b.title })}
          />
        ))}
      </div>

      {detail && (
        <BroadcastDetailSheet
          broadcastId={detail.id}
          broadcastTitle={detail.title}
          onClose={() => setDetail(null)}
        />
      )}
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
      className="rounded-2xl overflow-hidden border border-white/40"
      style={{ background: 'var(--surface)' }}
    >
      {/* Header row */}
      <button type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors hover:bg-surface-hover"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: status.color, background: `color-mix(in srgb, ${status.color} 14%, transparent)` }}
            >
              {status.label}
            </span>
            {b.discount_percent && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-foreground"
                style={{ background: 'var(--accent-light)' }}
              >
                −{b.discount_percent}%
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{b.title}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            {b.status === 'sent' && b.sent_at
              ? `${formatDate(new Date(b.sent_at))} · ${b.recipients_count} клієнтів`
              : formatDate(new Date(b.created_at))}
          </p>
        </div>
        <ChevronRight
          size={16}
          className="text-text-secondary shrink-0 transition-transform"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Expanded analytics */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
            style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}
          >
            <div className="px-4 py-4 space-y-4">
              {/* Message preview */}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-text-secondary mb-1.5">Повідомлення</p>
                <p className="text-xs text-foreground leading-relaxed rounded-xl px-3 py-2.5"
                  style={{ background: 'color-mix(in srgb, var(--accent) 5%, transparent)' }}
                >
                  {b.message_template}
                </p>
              </div>

              {/* Analytics — de-nested: two outcomes + quiet secondary row */}
              {b.status === 'sent' && (
                analytics ? (
                  <div className="space-y-3">
                    {/* Hero outcomes */}
                    <div className="grid grid-cols-2 gap-3">
                      <Outcome
                        icon={<CalendarCheck size={14} />}
                        label="Записалось"
                        value={analytics.booked}
                      />
                      <Outcome
                        icon={<MousePointerClick size={14} />}
                        label="Конверсія"
                        value={`${analytics.conversion_pct}%`}
                      />
                    </div>
                    {/* Secondary metrics — divided row, no boxes */}
                    <div className="flex items-stretch rounded-xl overflow-hidden"
                      style={{ background: 'color-mix(in srgb, var(--accent) 4%, transparent)' }}
                    >
                      <Metric label="Відправлено" value={analytics.sent} />
                      <Metric label="Клікнуло" value={analytics.clicked} />
                      <Metric label="Push" value={analytics.push_sent} />
                      <Metric label="Telegram" value={analytics.telegram_sent} />
                      {analytics.discount_used > 0 && (
                        <Metric label="Знижку взято" value={analytics.discount_used} />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Loader2 size={13} className="animate-spin" />
                    Завантаження аналітики…
                  </div>
                )
              )}

              {/* Per-client results → inline Sheet */}
              {b.status === 'sent' && (
                <button type="button"
                  onClick={onDetail}
                  className="flex items-center gap-1.5 text-xs text-foreground font-semibold transition-opacity hover:opacity-70 active:scale-95"
                >
                  <ListChecks size={13} />
                  Деталі по клієнтах
                </button>
              )}

              {/* Delete draft */}
              {b.status === 'draft' && (
                <button type="button"
                  onClick={() => remove.mutate(b.id)}
                  disabled={remove.isPending}
                  className="flex items-center gap-1.5 text-xs text-destructive transition-opacity hover:opacity-70"
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

// ── Outcome (hero stat) ─────────────────────────────────────────────────────────

function Outcome({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-xl px-3.5 py-3"
      style={{ background: 'var(--accent-light)' }}
    >
      <div className="flex items-center gap-1.5 text-text-secondary mb-1">
        <span className="text-foreground">{icon}</span>
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground tabular-nums leading-none">{value}</p>
    </div>
  );
}

// ── Metric (quiet secondary) ────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex-1 px-2 py-2.5 text-center border-r last:border-r-0"
      style={{ borderColor: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}
    >
      <p className="text-sm font-bold text-foreground tabular-nums leading-none">{value}</p>
      <p className="text-[9px] text-text-secondary mt-1 leading-tight">{label}</p>
    </div>
  );
}
