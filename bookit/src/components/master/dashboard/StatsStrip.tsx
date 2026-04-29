'use client';

import { motion } from 'framer-motion';
import { CalendarDays, TrendingUp, Users, Zap, Sparkles } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { useMonthlyBookingCount } from '@/lib/supabase/hooks/useBookings';
import { useMasterContext } from '@/lib/supabase/context';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const TRIAL_LIMIT_KOP = 100_000;

function fmt(n: number) { return n.toLocaleString('uk-UA') + ' ₴'; }

export function StatsStrip() {
  const s = useDashboardStats();
  const { masterProfile } = useMasterContext();
  const { count: monthCount } = useMonthlyBookingCount();
  const isStarter = (masterProfile?.subscription_tier ?? 'starter') === 'starter';
  const showProNudge = isStarter && monthCount >= 15;
  const extraEarned = masterProfile?.dynamic_pricing_extra_earned ?? 0;
  const showDpTrial = isStarter && extraEarned > 0 && extraEarned < TRIAL_LIMIT_KOP;
  const dpPct = Math.min(100, Math.round((extraEarned / TRIAL_LIMIT_KOP) * 100));
  const dpEarnedUah = Math.round(extraEarned / 100);
  const dpLimitUah = TRIAL_LIMIT_KOP / 100;

  if (s.isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 items-stretch">
        {[0, 1, 2].map(i => (
          <div key={i} className="bento-card p-4 flex flex-col justify-between gap-3">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-full mt-1.5" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Записів сьогодні',
      value: String(s.todayCount),
      sub: s.todayCount === 0 ? 'Ще немає' : `${s.todayConfirmed} підтверджено, ${s.todayPending} очікує`,
      subPositive: s.todayCount > 0,
      icon: CalendarDays,
      color: '#789A99',
      bg: 'rgba(120, 154, 153, 0.12)',
      tooltip: (
        <div className="flex flex-col gap-1 min-w-[150px]">
          <p className="text-xs font-bold text-foreground">Записи сьогодні</p>
          <div className="h-px bg-secondary" />
          <div className="flex justify-between gap-4"><span className="text-[11px] text-muted-foreground">Підтверджено</span><span className="text-[11px] font-semibold text-success">{s.todayConfirmed}</span></div>
          <div className="flex justify-between gap-4"><span className="text-[11px] text-muted-foreground">Очікують</span><span className="text-[11px] font-semibold text-warning">{s.todayPending}</span></div>
          <div className="flex justify-between gap-4"><span className="text-[11px] text-muted-foreground">Завершено</span><span className="text-[11px] font-semibold text-muted-foreground/60">{s.todayCompleted}</span></div>
        </div>
      ),
    },
    {
      label: 'Виручка сьогодні',
      value: fmt(s.todayRevenue),
      sub: s.todayCompleted > 0 ? `${s.todayCompleted} завершено` : 'Завершених немає',
      subPositive: s.todayRevenue > 0,
      icon: TrendingUp,
      color: '#5C9E7A',
      bg: 'rgba(92, 158, 122, 0.12)',
      tooltip: (
        <div className="flex flex-col gap-1 min-w-[150px]">
          <p className="text-xs font-bold text-foreground">Виручка сьогодні</p>
          <div className="h-px bg-secondary" />
          <div className="flex justify-between gap-4"><span className="text-[11px] text-muted-foreground">З завершених</span><span className="text-[11px] font-semibold text-foreground">{fmt(s.todayRevenue)}</span></div>
          <div className="flex justify-between gap-4"><span className="text-[11px] text-muted-foreground">Записів завершено</span><span className="text-[11px] font-semibold text-primary">{s.todayCompleted}</span></div>
        </div>
      ),
    },
    {
      label: 'Клієнтів тиждень',
      value: String(s.weekClients),
      sub: s.weekClients > 0 ? 'активних цього тижня' : 'Ще немає',
      subPositive: s.weekClients > 0,
      icon: Users,
      color: '#D4935A',
      bg: 'rgba(212, 147, 90, 0.12)',
      tooltip: (
        <div className="flex flex-col gap-1 min-w-[150px]">
          <p className="text-xs font-bold text-foreground">Клієнти цього тижня</p>
          <div className="h-px bg-secondary" />
          <div className="flex justify-between gap-4"><span className="text-[11px] text-muted-foreground">Унікальних</span><span className="text-[11px] font-semibold text-warning">{s.weekClients}</span></div>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">з підтверджених та завершених</p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
    <div className="grid grid-cols-3 gap-3 items-stretch">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
            className="h-full"
          >
            <Tooltip content={stat.tooltip} position="bottom">
              <div className="bento-card p-4 flex flex-col justify-between w-full h-full cursor-default">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: stat.bg }}>
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground leading-none">{stat.value}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1.5 leading-tight">{stat.label}</p>
                </div>
                <p className="text-xs font-semibold" style={{ color: stat.subPositive ? '#5C9E7A' : '#A8928D' }}>
                  {stat.sub}
                </p>
              </div>
            </Tooltip>
          </motion.div>
        );
      })}
    </div>
    {showDpTrial && (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <Link href="/dashboard/pricing" className="block px-4 py-3 rounded-2xl bg-warning/8 border border-warning/20 hover:bg-warning/12 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0">
              <Sparkles size={13} style={{ color: '#D4935A' }} />
            </div>
            <p className="text-xs font-semibold text-foreground flex-1">Динамічне ціноутворення — тріал</p>
            <span className="text-[11px] font-bold text-warning">{dpEarnedUah} / {dpLimitUah} ₴</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(212, 147, 90, 0.15)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${dpPct}%`, background: '#D4935A' }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Залишилось {dpLimitUah - dpEarnedUah} ₴ до кінця тріалу → перейдіть на Pro
          </p>
        </Link>
      </motion.div>
    )}
    {showProNudge && (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 24 }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/8 border border-primary/20"
      >
        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Zap size={14} className="text-primary" />
        </div>
        <p className="text-xs text-muted-foreground flex-1 leading-relaxed">
          Ви вже активний майстер — <span className="font-semibold text-foreground">Pro</span> розблокує аналітику, CRM та автоматичні нагадування
        </p>
        <Link href="/dashboard/billing?plan=pro"
          className="flex-shrink-0 text-[11px] font-semibold text-primary hover:text-primary/90 transition-colors whitespace-nowrap">
          Спробувати →
        </Link>
      </motion.div>
    )}
    </div>
  );
}
