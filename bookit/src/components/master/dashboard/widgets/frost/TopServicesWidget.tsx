'use client';

import Link from 'next/link';
import { Scissors, Zap } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { useTopServices, type TopServicesData } from '../shared/hooks/useTopServices';
import { pluralUk } from '@/lib/utils/pluralUk';

const PRIMARY_STYLE: React.CSSProperties = {
  background: 'var(--accent)',
  color: 'var(--accent-on)',
  boxShadow: '0 3px 10px color-mix(in srgb, var(--accent) 22%, transparent)',
};
const SECONDARY_STYLE: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
  border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
  color: 'var(--text-primary)',
};

/* ─── Рейл: послуги №2/№3, компактні (тихіші за героя) ─── */
function RailRow({ name, count, maxCount }: { name: string; count: number; maxCount: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[13px] truncate text-[var(--text-primary)]">{name}</span>
        <span className="metric-value text-[12px] font-bold tabular-nums flex-shrink-0 text-[var(--text-secondary)]">{count}×</span>
      </div>
      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.round((count / maxCount) * 100)}%`, background: 'var(--border-strong)' }}
        />
      </div>
    </div>
  );
}

/* ─── Презентаційна картка (props-only) — для own-eyes прев'ю без хуків ─── */
export function TopServicesCard({ top, maxCount, monthLabel }: Omit<TopServicesData, 'isLoading'>) {
  const monthTag = <span className="text-[11px] text-text-sub capitalize">{monthLabel}</span>;

  // ── empty: жодного замовлення цього місяця ──
  if (top.length === 0) {
    return (
      <Wrapper action={monthTag}>
        <div className="flex flex-col justify-center flex-1 py-2">
          <p className="heading-serif text-[22px] text-[var(--text-primary)] leading-tight">Ще нема замовлень</p>
          <p className="text-[13px] mt-1.5 text-[var(--text-secondary)] max-w-[34ch]">
            Щойно підуть записи цього місяця, тут буде видно, що замовляють найчастіше.
          </p>
        </div>
      </Wrapper>
    );
  }

  const hero = top[0];
  const rail = top.slice(1);

  return (
    <Wrapper action={monthTag}>
      <div className="flex flex-col flex-1">
        {/* Герой: хіт місяця */}
        <div>
          <p className="text-[11px] text-[var(--text-secondary)] mb-1.5">Найчастіше цього місяця</p>
          <div className="flex items-end justify-between gap-3">
            <span className="heading-serif text-[23px] leading-tight truncate text-[var(--text-primary)]">{hero.name}</span>
            <span className="flex items-baseline gap-1 flex-shrink-0">
              <span className="metric-value text-[1.6rem] font-bold leading-none text-[var(--text-primary)]">{hero.count}</span>
              <span className="text-[13px] text-[var(--text-secondary)]">
                {pluralUk(hero.count, 'запис', 'записи', 'записів')}
              </span>
            </span>
          </div>
          <div className="h-[5px] rounded-full overflow-hidden mt-2" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full" style={{ width: '100%', background: 'var(--accent)' }} />
          </div>
        </div>

        {/* Рейл: решта топ-послуг */}
        {rail.length > 0 && (
          <div className="mt-3.5 space-y-2.5">
            {rail.map(svc => <RailRow key={svc.name} name={svc.name} count={svc.count} maxCount={maxCount} />)}
          </div>
        )}

        {/* Дії */}
        <div className="grid grid-cols-2 gap-2 pt-3 mt-auto" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
          <Link
            href="/dashboard/services"
            className="flex items-center justify-center gap-1.5 h-11 rounded-[14px] font-semibold text-[13px] transition-transform duration-150 active:scale-[0.96]"
            style={SECONDARY_STYLE}
          >
            <Scissors size={14} strokeWidth={1.8} aria-hidden />
            Послуги
          </Link>
          <Link
            href="/dashboard/flash"
            className="flex items-center justify-center gap-1.5 h-11 rounded-[14px] font-semibold text-[13px] transition-transform duration-150 active:scale-[0.96]"
            style={PRIMARY_STYLE}
          >
            <Zap size={14} strokeWidth={1.8} aria-hidden />
            Промо
          </Link>
        </div>
      </div>
    </Wrapper>
  );
}

/* ─── Section-обгортка (спільна для всіх станів) ─── */
function Wrapper({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 h-full">
      <Section title="Топ послуги" icon={Scissors} action={action} className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">
        {children}
      </Section>
    </div>
  );
}

export function TopServicesWidget() {
  const { isLoading, ...data } = useTopServices();

  if (isLoading) {
    return (
      <Wrapper>
        <div className="skeleton-shimmer h-8 w-40 rounded-lg mb-2" />
        <div className="skeleton-shimmer h-[5px] w-full rounded-full mb-4" />
        <div className="space-y-2.5">
          <div className="skeleton-shimmer h-3.5 w-full rounded-full" />
          <div className="skeleton-shimmer h-3.5 w-2/3 rounded-full" />
        </div>
      </Wrapper>
    );
  }

  return <TopServicesCard {...data} />;
}
