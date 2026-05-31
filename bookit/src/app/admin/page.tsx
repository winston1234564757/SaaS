import { createClient } from '@/lib/supabase/server';
import { AdminOverviewCharts } from '@/components/admin/AdminOverviewCharts';
import { formatCurrency } from '@/lib/utils/currency';
import { Users, Calendar, Banknote, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const { data: statsRaw, error } = await supabase.rpc('get_admin_overview_stats');

  if (error || !statsRaw) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6">
        <ShieldAlert className="size-10 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-lg font-semibold text-slate-800">Помилка завантаження аналітики</h2>
        <p className="text-sm mt-1">{error?.message || 'Не вдалося отримати дані з бази'}</p>
      </div>
    );
  }

  const stats = statsRaw as {
    total_masters: number;
    total_bookings: number;
    total_revenue: number;
    starter_subscriptions: number;
    pro_subscriptions: number;
    studio_subscriptions: number;
    recent_bookings: { date: string; count: number }[];
  };

  const subsData = [
    { name: 'Starter', value: Number(stats.starter_subscriptions) },
    { name: 'Pro', value: Number(stats.pro_subscriptions) },
    { name: 'Studio', value: Number(stats.studio_subscriptions) },
  ];

  const bentoMetrics = [
    {
      title: 'Всього майстрів',
      value: stats.total_masters,
      desc: 'Зареєстровані профілі',
      icon: Users,
      colorClass: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      title: 'Всього записів',
      value: stats.total_bookings,
      desc: 'Кількість букінгів',
      icon: Calendar,
      colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Виручка платформи',
      value: formatCurrency(stats.total_revenue),
      desc: 'Завершені візити',
      icon: Banknote,
      colorClass: 'bg-slate-900 text-slate-50 border-slate-950',
    },
  ];

  return (
    <div className="space-y-8 flex flex-col">
      {/* Top Header */}
      <div>
        <h1 className="heading-serif text-3xl font-bold tracking-tight text-slate-950">Огляд платформи</h1>
        <p className="text-sm text-slate-500 mt-1">Основні фінансові та операційні метрики BookIT SaaS</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {bentoMetrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={i}
              className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-6 shadow-sm flex items-center justify-between transition hover:shadow-md"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.title}</span>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">{m.value}</div>
                <p className="text-[11px] text-slate-400 font-medium">{m.desc}</p>
              </div>
              <div className={`size-12 rounded-2xl flex items-center justify-center border ${m.colorClass}`}>
                <Icon className="size-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <AdminOverviewCharts recentBookings={stats.recent_bookings} subs={subsData} />
    </div>
  );
}
