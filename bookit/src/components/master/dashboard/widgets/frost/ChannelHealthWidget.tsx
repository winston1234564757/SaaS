'use client';

import Link from 'next/link';
import { Send, Bell, Users, ArrowRight } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { useChannelHealth } from '../shared/hooks/useChannelHealth';
import type { ChannelHealth } from '@/app/(master)/dashboard/actions';
import { pluralUk } from '@/lib/utils/pluralUk';

/** Нижче цього обсягу клієнтів % — шум → веде чесна дробина «N з M», а не відсоток. */
const SPARSE_THRESHOLD = 5;
/** Telegram — первинний канал (deep-links); Push — вторинний. Пороги «здоров'я». */
const TG_HEALTHY = 60;
const PUSH_HEALTHY = 40;

/** Калібровані тони для дрібного вердикт-тексту (треба 4.5:1 на periwinkle). Урок DS-DASH-04. */
const TONE = {
  good: '#0B6B2E',       // 5.3:1
  warn: '#9A4508',       // 5.1:1
  bad:  'var(--error)',  // 5.1:1
} as const;

function pct(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

function verdictOf(tgPct: number): { label: string; color: string } {
  if (tgPct >= TG_HEALTHY) return { label: 'Сильний',  color: TONE.good };
  if (tgPct >= 30)         return { label: 'Помірний', color: TONE.warn };
  return { label: 'Слабкий', color: TONE.bad };
}

/* ─── Підтримка: Push окремим тихим рядком (тихіший за TG-героя) ─── */
function PushRow({ push, total, dense }: { push: number; total: number; dense: boolean }) {
  const pshPct = pct(push, total);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-primary)]">
          <Bell size={13} strokeWidth={1.8} className="text-[var(--text-secondary)]" aria-hidden />
          Push
        </span>
        <span className="metric-value text-[13px] font-bold tabular-nums text-[var(--text-secondary)]">
          {dense ? `${pshPct}%` : `${push} з ${total}`}
        </span>
      </div>
      {dense && (
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pshPct}%`, background: 'var(--border-strong)' }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Презентаційна картка (props-only) — для own-eyes прев'ю без хуків ─── */
export function ChannelHealthCard({ total, tg, push }: ChannelHealth) {
  // ── empty: ще нема клієнтів → нема кого сповіщати ──
  if (total === 0) {
    return (
      <Wrapper>
        <div className="flex flex-col justify-center flex-1 py-2">
          <p className="heading-serif text-[22px] text-[var(--text-primary)] leading-tight">Ще нема кого сповіщати</p>
          <p className="text-[13px] mt-1.5 text-[var(--text-secondary)] max-w-[34ch]">
            Щойно зʼявляться клієнти, тут буде видно, скільки з них отримують нагадування.
          </p>
          <Link
            href="/dashboard/clients"
            className="mt-4 self-start inline-flex items-center gap-1.5 h-10 px-4 rounded-[14px] font-semibold text-[13px] transition-transform duration-150 active:scale-[0.96]"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
          >
            <Users size={14} strokeWidth={1.8} aria-hidden />
            До клієнтів
          </Link>
        </div>
      </Wrapper>
    );
  }

  const dense = total >= SPARSE_THRESHOLD;
  const tgPct = pct(tg, total);
  const pshPct = pct(push, total);
  const verdict = verdictOf(tgPct);
  const showNudge = tgPct < TG_HEALTHY || pshPct < PUSH_HEALTHY;

  return (
    <Wrapper>
      <div className="flex flex-col flex-1">
        {/* Герой: досяжність у Telegram */}
        <div>
          <p className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] mb-1">
            <Send size={12} strokeWidth={1.8} aria-hidden />
            Досяжні в Telegram
          </p>

          {dense ? (
            <span className="flex items-end gap-3">
              <span className="metric-value text-[2.4rem] font-bold leading-[0.9] text-[var(--text-primary)]">{tgPct}%</span>
              <span className="flex flex-col pb-1 min-w-0">
                <span className="heading-serif text-[19px] leading-none" style={{ color: verdict.color }}>{verdict.label}</span>
                <span className="text-[12px] mt-1 text-[var(--text-secondary)]">
                  {tg} із {total} {pluralUk(total, 'клієнта', 'клієнтів', 'клієнтів')}
                </span>
              </span>
            </span>
          ) : (
            <>
              <span className="flex items-baseline gap-1.5">
                <span className="metric-value text-[2.4rem] font-bold leading-[0.9] text-[var(--text-primary)]">{tg}</span>
                <span className="text-[16px] text-[var(--text-secondary)]">з {total}</span>
              </span>
              <p className="text-[12px] mt-1.5 text-[var(--text-secondary)]">
                {pluralUk(total, 'клієнт', 'клієнти', 'клієнтів')} у Telegram
              </p>
            </>
          )}
        </div>

        {/* Push + нудж — притиснуті донизу */}
        <div className="mt-auto pt-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
          <PushRow push={push} total={total} dense={dense} />
          {showNudge && (
            <Link
              href="/dashboard/clients"
              className="mt-3 flex items-center justify-between rounded-xl -mx-2 px-2 py-2 text-[12px] font-semibold text-[var(--accent)] transition-colors active:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
            >
              Хто ще не підключив канали
              <ArrowRight size={14} strokeWidth={2} aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

/* ─── Section-обгортка (спільна для всіх станів) ─── */
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 h-full">
      <Section title="Зв'язок з клієнтами" icon={Send} className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">
        {children}
      </Section>
    </div>
  );
}

export function ChannelHealthWidget() {
  const data = useChannelHealth();

  if (!data) {
    return (
      <Wrapper>
        <div className="skeleton-shimmer h-11 w-28 rounded-xl" />
        <div className="mt-auto pt-3 space-y-2">
          <div className="skeleton-shimmer h-3.5 w-full rounded-full" />
          <div className="skeleton-shimmer h-3 w-2/3 rounded-full" />
        </div>
      </Wrapper>
    );
  }

  return <ChannelHealthCard {...data} />;
}
