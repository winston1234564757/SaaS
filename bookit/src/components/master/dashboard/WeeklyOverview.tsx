'use client';

import { motion } from 'framer-motion';
import { Tooltip } from '@/components/ui/Tooltip';
import { useWeeklyOverview, type DayData } from '@/lib/supabase/hooks/useWeeklyOverview';

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const DAYS_FULL  = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота', 'Неділя'];
const BAR_MAX_PX = 72;

function getTodayIdx() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1; // 0=Пн
}

function BarTooltipContent({ dayFull, bookings, revenue, isToday, isPast }: {
  dayFull: string; bookings: number; revenue: number; isToday: boolean; isPast: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[130px]">
      <p className="text-xs font-bold text-[#2C1A14] flex items-center gap-1.5">
        {dayFull}
        {isToday && (
          <span className="text-[10px] font-semibold text-[#789A99] bg-[#789A99]/12 px-1.5 py-0.5 rounded-full">
            сьогодні
          </span>
        )}
      </p>
      <div className="h-px bg-[#F5E8E3]" />
      {bookings === 0 ? (
        <p className="text-[11px] text-[#A8928D]">Записів немає</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-[#6B5750]">Записів</span>
            <span className="text-[11px] font-semibold text-[#2C1A14]">{bookings}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-[#6B5750]">Виручка</span>
            <span className="text-[11px] font-semibold text-[#789A99]">
              {revenue > 0 ? revenue.toLocaleString('uk-UA') + ' ₴' : '—'}
            </span>
          </div>
          {isPast && !isToday && (
            <p className="text-[10px] text-[#A8928D]">Завершений день</p>
          )}
        </>
      )}
    </div>
  );
}

export function WeeklyOverview() {
  const { data: _weekData, isLoading } = useWeeklyOverview();
  const weekData: DayData[] = _weekData ?? [];
  const todayIdx = getTodayIdx();
  const maxBookings = Math.max(...weekData.map(d => d.bookings), 1);
  const totalRevenue  = weekData.reduce((s, d) => s + d.revenue,   0);
  const totalBookings = weekData.reduce((s, d) => s + d.bookings, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, type: 'spring', stiffness: 280, damping: 24 }}
      className="bento-card p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="heading-serif text-base text-[#2C1A14]">Цей тиждень</h2>
        <span className="text-xs text-[#A8928D]">{totalBookings} записів</span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2" style={{ height: BAR_MAX_PX + 4 }}>
        {weekData.map((day, i) => {
          const barH    = day.bookings === 0 ? 4 : Math.round((day.bookings / maxBookings) * BAR_MAX_PX);
          const isToday = i === todayIdx;
          const isPast  = i < todayIdx;

          return (
            <Tooltip
              key={i}
              position="top"
              delay={120}
              className="flex-1 flex flex-col items-center justify-end h-full"
              content={
                <BarTooltipContent
                  dayFull={DAYS_FULL[i]}
                  bookings={day.bookings}
                  revenue={day.revenue}
                  isToday={isToday}
                  isPast={isPast}
                />
              }
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: isLoading ? 4 : barH }}
                transition={{ delay: 0.4 + i * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
                style={{
                  borderRadius: '5px 5px 3px 3px',
                  background: isToday
                    ? '#789A99'
                    : isPast
                    ? 'rgba(120, 154, 153, 0.4)'
                    : 'rgba(120, 154, 153, 0.18)',
                  cursor: 'default',
                  width: '100%',
                }}
                whileHover={{ background: isToday ? '#5C7E7D' : isPast ? 'rgba(120,154,153,0.6)' : 'rgba(120,154,153,0.35)' }}
              />
            </Tooltip>
          );
        })}
      </div>

      {/* Day labels */}
      <div className="flex gap-2 mt-2">
        {DAYS_SHORT.map((day, i) => (
          <div key={day} className="flex-1 text-center">
            <span className={`text-[11px] font-medium ${
              i === todayIdx ? 'text-[#789A99] font-bold' : 'text-[#A8928D]'
            }`}>
              {day}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-[#F5E8E3]/60 flex items-center justify-between">
        <span className="text-xs text-[#A8928D]">Виручка за тиждень</span>
        <span className="text-sm font-bold text-[#2C1A14]">
          {totalRevenue.toLocaleString('uk-UA')} ₴
        </span>
      </div>
    </motion.div>
  );
}
