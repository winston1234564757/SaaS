'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { EditorialCover } from '@/components/ui/EditorialCover';

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

// Калібровано під Frost `--surface`: сирі `--success`/`--warning` провалюють 4.5:1 на дрібному тексті.
const TONE_HEX: Record<'success' | 'warning', string> = { success: '#0B6B2E', warning: '#9A4508' };

function rowValueStyle(tone?: OverviewDetailRow['tone']): React.CSSProperties {
  if (tone === 'success' || tone === 'warning') return { color: TONE_HEX[tone] };
  if (tone === 'primary') return { color: 'var(--accent)' };
  return { color: 'var(--foreground)' };
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * DS-MODAL-07 — спільний адаптивний Sheet деталей будь-якого елемента Огляду (M-ANL-01).
 * Дизайн-мова: коли є hero-число — темна обкладинка несе домінанту; рядки — тихе біле тіло
 * з каліброваними тонами; CTA — kit-primary. Нуль фейк-даних: лише payload викликача.
 */
export function OverviewDetailSheet({
  detail,
  onClose,
}: {
  detail: OverviewDetail | null;
  onClose: () => void;
}) {
  const hasHero = !!detail?.hero;
  return (
    <Sheet
      open={!!detail}
      onOpenChange={(o) => !o && onClose()}
      title={hasHero ? undefined : detail?.title}
      srTitle={detail?.title}
    >
      {detail && <OverviewDetailBody detail={detail} />}
    </Sheet>
  );
}

// ── Presentational body (props-only → own-eyes прев'ю без auth) ──────────────────

export function OverviewDetailBody({ detail }: { detail: OverviewDetail }) {
  const hasHero = !!detail.hero;
  return (
        <div className="flex flex-col gap-5 pb-2">
          {hasHero && (
            <EditorialCover>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                {detail.eyebrow || detail.title}
              </p>
              <p className="metric-value text-[38px] leading-none text-white mt-2.5">{detail.hero!.value}</p>
              {detail.hero!.label && <p className="text-[12px] text-white/70 mt-2">{detail.hero!.label}</p>}
            </EditorialCover>
          )}

          {!hasHero && detail.eyebrow && (
            <span className="text-[11px] font-bold text-primary uppercase tracking-[0.14em] -mt-1">{detail.eyebrow}</span>
          )}

          {detail.rows && detail.rows.length > 0 && (
            <div className="flex flex-col">
              {detail.rows.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
                  <span className="text-sm text-text-sub">{r.label}</span>
                  <span className="metric-value text-sm font-semibold" style={rowValueStyle(r.tone)}>{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {detail.note && <p className="text-[13px] text-text-sub leading-relaxed">{detail.note}</p>}

          {detail.cta && (
            <Link
              href={detail.cta.href}
              className="group inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-sm font-bold shadow-sm cursor-pointer active:scale-[0.97] transition-transform self-start"
            >
              {detail.cta.label}
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}
        </div>
  );
}
