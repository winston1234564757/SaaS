'use client';

import { motion } from 'framer-motion';
import { Clock, Calendar, ChevronRight, Moon, Sun, Coffee, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { format, startOfWeek, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { Schedule, DayKey } from '../hooks/useSettingsForm';
import { DAYS_ORDER } from '../hooks/useSettingsForm';

interface ScheduleWidgetProps {
  schedule: Schedule;
  bufferTime: number;
  breaksCount: number;
  onClick: () => void;
  occupancyData?: number[]; // [sun, mon, tue, wed, thu, fri, sat] from analytics
}

const DAYS_UA_SHORT: Record<DayKey, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд'
};

export function ScheduleWidget({
  schedule,
  bufferTime,
  breaksCount,
  onClick,
  occupancyData
}: ScheduleWidgetProps) {
  const now = new Date();
  const currentDayKey = format(now, 'eee', { locale: uk }).toLowerCase() as DayKey;
  const currentTime = format(now, 'HH:mm');
  
  // Normalized day key check
  const dayIndex = now.getDay(); // 0 is Sunday
  const normalizedDayKey = dayIndex === 0 ? 'sun' : DAYS_ORDER[dayIndex - 1];
  
  const todaySchedule = schedule[normalizedDayKey] || schedule['mon'];
  const isWorkingToday = todaySchedule.is_working;
  const isWorkingNow = isWorkingToday && 
    currentTime >= todaySchedule.start_time && 
    currentTime <= todaySchedule.end_time;

  // Generate week dates
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDates = DAYS_ORDER.map((_, i) => addDays(weekStart, i));

  // Calculate max bookings for normalization if we have real data
  const maxBookings = occupancyData ? Math.max(...occupancyData, 1) : 1;

  return (
    <div 
      onClick={onClick}
      className="widget-card p-6 h-full flex flex-col cursor-pointer active:scale-[0.98] transition-all group relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-9 h-9 rounded-2xl flex items-center justify-center transition-all shadow-md",
            isWorkingNow ? "bg-success text-white" : "bg-warning text-white"
          )}>
            <Clock size={18} />
          </div>
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-widest text-text-mute leading-none mb-1">Графік роботи</h3>
            <p className={cn("text-[10px] font-bold uppercase tracking-tighter", isWorkingNow ? "text-success" : "text-warning")}>
              {isWorkingNow ? "Зараз працюю" : "Зараз перерва"}
            </p>
          </div>
        </div>
        <div className="w-9 h-9 rounded-2xl bg-white border border-white/80 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Main Status Area */}
      <div className="flex-1 flex flex-col justify-center mb-8">
        <div className="flex items-center gap-3">
           <h2 className="text-3xl font-bold tracking-tight text-text-primary">
             {isWorkingToday ? todaySchedule.start_time : '—'}
           </h2>
           <div className="w-8 h-[2px] bg-muted/40 rounded-full" />
           <h2 className="text-3xl font-bold tracking-tight text-text-primary">
             {isWorkingToday ? todaySchedule.end_time : '—'}
           </h2>
        </div>
        <p className="text-[11px] font-bold text-text-mute uppercase tracking-widest mt-2 flex items-center gap-1.5">
           <Calendar size={12} className="text-accent" />
           {isWorkingToday ? "Робочий день" : "Сьогодні вихідний"}
        </p>
      </div>

      {/* Week Visualization */}
      <div className="grid grid-cols-7 gap-1.5 px-0.5">
        {DAYS_ORDER.map((day, i) => {
          const isWorking = schedule[day].is_working;
          const isToday = day === normalizedDayKey;
          
          // Map day string to JS day index (mon=1...sun=0)
          const jsDayIndex = i === 6 ? 0 : i + 1;
          const bookings = occupancyData ? occupancyData[jsDayIndex] : 0;
          
          // Normalized occupancy logic (relative to max in current month/period)
          const occupancy = isWorking ? (occupancyData ? Math.round((bookings / maxBookings) * 100) : 10) : 0; 
          const fillLevel = `${Math.max(occupancy, isWorking ? 5 : 0)}%`;
          const statusColor = occupancy > 80 ? 'bg-error' : occupancy > 50 ? 'bg-warning' : 'bg-success';
          
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-2">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-tighter",
                isToday ? "text-accent" : "text-text-mute/30"
              )}>
                {DAYS_UA_SHORT[day]}
              </span>
              <div className={cn(
                "w-full aspect-[4/8] rounded-full flex flex-col items-end justify-end border transition-all shadow-inner-sm relative overflow-hidden",
                isWorking 
                  ? "bg-white border-white/80" 
                  : "bg-muted/10 border-transparent opacity-30",
                isToday && "ring-2 ring-accent ring-offset-2 scale-110 z-10 shadow-lg shadow-accent/10"
              )}>
                {isWorking && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: fillLevel }}
                    className={cn("absolute bottom-0 inset-x-0 opacity-20", statusColor)}
                  />
                )}
                {isWorking && occupancy > 0 && (
                   <div className={cn("w-1.5 h-1.5 rounded-full mb-2 mr-1.5 relative z-10", statusColor)} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip / Explain */}
      <div className="mt-6 flex items-center gap-3 p-3 rounded-2xl bg-muted/20 text-[10px] text-text-mute font-medium leading-snug">
        <Info size={14} className="shrink-0 text-accent/60" />
        <p>Колір та рівень заповнення овалів вказують на вашу завантаженість за даними BookIT Analytics.</p>
      </div>
    </div>
  );
}
