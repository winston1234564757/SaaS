'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Sheet } from '@/components/ui/Sheet';

// ── Payload ───────────────────────────────────────────────────────────────────

export interface OverviewDetailRow {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'primary' | 'muted';
}

export interface OverviewDetail {
  title: string;
  eyebrow?: string;
  hero?: { label?: string; value: string };
  rows?: OverviewDetailRow[];
  note?: string;
  cta?: { label: string; href: string };
}

const TONE: Record<NonNullable<OverviewDetailRow['tone']>, string> = {
  success: 'text-success',
  warning: 'text-warning',
  primary: 'text-primary',
  muted: 'text-text-sub',
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Спільний адаптивний Sheet деталей будь-якого елемента Огляду (M-ANL-01).
 * Кожен клікабельний елемент передає payload (розширений огляд / пояснення).
 * Нуль фейк-даних — лише те, що передав викликач.
 */
export function OverviewDetailSheet({
  detail,
  onClose,
}: {
  detail: OverviewDetail | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!detail} onOpenChange={(o) => !o && onClose()} title={detail?.title}>
      {detail && (
        <div className="flex flex-col gap-5 pb-2">
          {detail.eyebrow && (
            <span className="text-[11px] font-semibold text-primary -mt-1">{detail.eyebrow}</span>
          )}

          {detail.hero && (
            <div>
              {detail.hero.label && <p className="text-[13px] text-text-sub mb-1">{detail.hero.label}</p>}
              <p className="metric-value text-4xl font-semibold text-foreground leading-none">{detail.hero.value}</p>
            </div>
          )}

          {detail.rows && detail.rows.length > 0 && (
            <div className="flex flex-col">
              {detail.rows.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
                  <span className="text-sm text-text-sub">{r.label}</span>
                  <span className={cn('metric-value text-sm font-semibold', TONE[r.tone ?? 'muted'] === TONE.muted ? 'text-foreground' : TONE[r.tone!])}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {detail.note && (
            <p className="text-[13px] text-text-sub leading-relaxed">{detail.note}</p>
          )}

          {detail.cta && (
            <Link
              href={detail.cta.href}
              className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-[13px] font-semibold cursor-pointer active:scale-[0.97] transition-transform self-start"
            >
              {detail.cta.label}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      )}
    </Sheet>
  );
}
