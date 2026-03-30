import { motion } from 'framer-motion';
import { CalendarDays, TrendingUp, Users } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';

function fmt(n: number) { return n.toLocaleString('uk-UA') + ' ₴'; }

export function StatsStrip() {
  const s = useDashboardStats();

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
          <p className="text-xs font-bold text-[#2C1A14]">Записи сьогодні</p>
          <div className="h-px bg-[#F5E8E3]" />
          <div className="flex justify-between gap-4"><span className="text-[11px] text-[#6B5750]">Підтверджено</span><span className="text-[11px] font-semibold text-[#5C9E7A]">{s.todayConfirmed}</span></div>
          <div className="flex justify-between gap-4"><span className="text-[11px] text-[#6B5750]">Очікують</span><span className="text-[11px] font-semibold text-[#D4935A]">{s.todayPending}</span></div>
          <div className="flex justify-between gap-4"><span className="text-[11px] text-[#6B5750]">Завершено</span><span className="text-[11px] font-semibold text-[#A8928D]">{s.todayCompleted}</span></div>
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
          <p className="text-xs font-bold text-[#2C1A14]">Виручка сьогодні</p>
          <div className="h-px bg-[#F5E8E3]" />
          <div className="flex justify-between gap-4"><span className="text-[11px] text-[#6B5750]">З завершених</span><span className="text-[11px] font-semibold text-[#2C1A14]">{fmt(s.todayRevenue)}</span></div>
          <div className="flex justify-between gap-4"><span className="text-[11px] text-[#6B5750]">Записів завершено</span><span className="text-[11px] font-semibold text-[#789A99]">{s.todayCompleted}</span></div>
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
          <p className="text-xs font-bold text-[#2C1A14]">Клієнти цього тижня</p>
          <div className="h-px bg-[#F5E8E3]" />
          <div className="flex justify-between gap-4"><span className="text-[11px] text-[#6B5750]">Унікальних</span><span className="text-[11px] font-semibold text-[#D4935A]">{s.weekClients}</span></div>
          <p className="text-[10px] text-[#A8928D] mt-0.5">з підтверджених та завершених</p>
        </div>
      ),
    },
  ];

  return (
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
            <Tooltip content={stat.tooltip} position="bottom" className="w-full h-full">
              <div className="bento-card p-4 flex flex-col justify-between w-full h-full cursor-default">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: stat.bg }}>
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#2C1A14] leading-none">{stat.value}</p>
                  <p className="text-xs text-[#A8928D] mt-1.5 leading-tight">{stat.label}</p>
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
  );
}
