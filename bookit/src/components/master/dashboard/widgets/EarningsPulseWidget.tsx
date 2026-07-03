'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { formatCurrency } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';

/** Калібровані тони для дрібного trend-тексту (треба 4.5:1 на periwinkle). Урок DS-DASH-04. */
const TONE = {
  good: '#0B6B2E',       // 5.25:1
  bad:  'var(--error)',  // 5.11:1
} as const;

type Trend = { label: string; color: string; Icon: typeof TrendingUp } | null;

function trendOf(today: number, prev: number): Trend {
  // День ще без доходу → жодного тренду (─100% посеред дня = фальш-доум). Пульс-смуги розкажуть.
  if (today === 0) return null;
  if (prev === 0) return { label: 'Перший дохід', color: TONE.good, Icon: TrendingUp };
  const diff = Math.round(((today - prev) / prev) * 100);
  if (diff === 0) return { label: 'як вчора', color: 'var(--text-secondary)', Icon: Minus };
  if (diff > 0)   return { label: `+${diff}%`, color: TONE.good, Icon: TrendingUp };
  return { label: `${diff}%`, color: TONE.bad, Icon: TrendingDown };
}

function TrendTag({ today, prev }: { today: number; prev: number }) {
  const t = trendOf(today, prev);
  if (!t) return null;
  const { label, color, Icon } = t;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold whitespace-nowrap" style={{ color }}>
      <Icon size={12} strokeWidth={2} aria-hidden />
      {label}
    </span>
  );
}

/* ─── Підтримка: пульс сьогодні проти вчора (2 різні, домінанта primary) ─── */
function PulseBars({ today, prev }: { today: number; prev: number }) {
  const maxVal = Math.max(today, prev, 1);
  const rows = [
    { label: 'Сьогодні', value: today, primary: true },
    { label: 'Вчора',    value: prev,  primary: false },
  ];
  return (
    <div className="space-y-2.5">
      {rows.map(({ label, value, primary }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{label}</span>
            <span
              className="metric-value text-[11px] font-bold tabular-nums"
              style={{ color: primary ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              {formatCurrency(value)}
            </span>
          </div>
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((value / maxVal) * 100)}%`, background: primary ? 'var(--accent)' : 'var(--border-strong)' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface PulseProps {
  todayRevenue: number;
  prevDayRevenue: number;
  todayCount: number;
  todayCompleted: number;
}

/* ─── Презентаційна картка (props-only) — для own-eyes прев'ю без хуків ─── */
export function EarningsPulseCard({ todayRevenue, prevDayRevenue, todayCount, todayCompleted }: PulseProps) {
  const showBars = todayRevenue > 0 || prevDayRevenue > 0;
  return (
    <Wrapper action={<TrendTag today={todayRevenue} prev={prevDayRevenue} />}>
      <div className="flex flex-col flex-1">
        <motion.p
          key={todayRevenue}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
          className="metric-value text-[30px] leading-none text-[var(--text-primary)]"
        >
          {formatCurrency(todayRevenue)}
        </motion.p>

        <p className="text-[12px] mt-2 text-[var(--text-secondary)]">
          {todayCount > 0
            ? <>{todayCount} {pluralUk(todayCount, 'запис', 'записи', 'записів')} · {todayCompleted} завершено</>
            : 'Ще немає записів сьогодні'}
        </p>

        {showBars && (
          <div className="mt-auto pt-4">
            <PulseBars today={todayRevenue} prev={prevDayRevenue} />
          </div>
        )}
      </div>
    </Wrapper>
  );
}

/* ─── Section-обгортка (спільна) ─── */
function Wrapper({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 h-full">
      <Section title="Сьогодні" icon={Wallet} action={action} className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">
        {children}
      </Section>
    </div>
  );
}

export function EarningsPulseWidget() {
  const stats = useDashboardStats();

  if (stats.isLoading) {
    return (
      <Wrapper>
        <div className="skeleton-shimmer h-9 w-36 rounded-xl" />
        <div className="skeleton-shimmer h-3 w-28 rounded-full mt-3" />
        <div className="mt-auto pt-4 space-y-2.5">
          <div className="skeleton-shimmer h-3 w-full rounded-full" />
          <div className="skeleton-shimmer h-3 w-full rounded-full" />
        </div>
      </Wrapper>
    );
  }

  return (
    <EarningsPulseCard
      todayRevenue={stats.todayRevenue}
      prevDayRevenue={stats.prevDayRevenue}
      todayCount={stats.todayCount}
      todayCompleted={stats.todayCompleted}
    />
  );
}
