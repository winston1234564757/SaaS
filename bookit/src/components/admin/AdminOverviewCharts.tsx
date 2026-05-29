'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface AdminOverviewChartsProps {
  recentBookings: { date: string; count: number }[];
  subs: { name: string; value: number }[];
}

export function AdminOverviewCharts({ recentBookings, subs }: AdminOverviewChartsProps) {
  const chartData = [...recentBookings]
    .reverse()
    .map(b => ({
      ...b,
      formattedDate: new Date(b.date).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' })
    }));

  const COLORS = ['#94A3B8', '#6366F1', '#4F46E5'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Area Chart - Booking Dynamic */}
      <div className="lg:col-span-2 rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-serif text-lg font-semibold text-slate-900">Динаміка бронювань</h3>
          <p className="text-xs text-slate-500 mt-1">Останні 10 днів активності на платформі</p>
        </div>
        <div className="h-64 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="formattedDate" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '1rem',
                  fontSize: '12px'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                name="Бронювання"
                stroke="#6366F1" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Subscription Distribution */}
      <div className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-serif text-lg font-semibold text-slate-900">Розподіл підписок</h3>
          <p className="text-xs text-slate-500 mt-1">Кількість майстрів по тарифних планах</p>
        </div>
        <div className="h-64 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subs} margin={{ bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748B', fontSize: 11 }} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748B', fontSize: 11 }} 
                allowDecimals={false} 
              />
              <Tooltip
                cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '1rem',
                  fontSize: '12px'
                }} 
              />
              <Bar dataKey="value" name="Кількість" radius={[8, 8, 0, 0]}>
                {subs.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
