'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { TrendingUp, Users, Clock, Calendar } from 'lucide-react';
import { type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { cn } from '@/lib/utils/cn';

interface Props {
  bookings: BookingWithServices[];
  days: Date[];
  onDayClick: (date: Date) => void;
}

export function PeriodAnalyticsView({ bookings, days, onDayClick }: Props) {
  const dayStats = useMemo(() => {
    return days.map(day => {
      const dateStr = day.toISOString().split('T')[0];
      const dayBookings = bookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
      
      const revenue = dayBookings.reduce((acc, b) => acc + b.total_price, 0);
      const count = dayBookings.length;
      
      // Assume 8 hours work day = 480 mins
      const totalWorkMins = 480; 
      const occupiedMins = dayBookings.reduce((acc, b) => {
        const start = b.start_time.split(':').map(Number);
        const end = b.end_time.split(':').map(Number);
        return acc + ((end[0] * 60 + end[1]) - (start[0] * 60 + start[1]));
      }, 0);
      
      const occupancy = Math.min(Math.round((occupiedMins / totalWorkMins) * 100), 100);

      return {
        date: day,
        dateStr,
        revenue,
        count,
        occupancy,
        bookings: dayBookings
      };
    });
  }, [bookings, days]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {dayStats.map((stat, i) => (
        <motion.button
          key={stat.dateStr}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, type: 'spring', stiffness: 260, damping: 28 }}
          onClick={() => onDayClick(stat.date)}
          className="p-5 lg:p-7 flex flex-col gap-6 lg:gap-8 text-left group transition-all active:scale-[0.98] border border-border-strong/40 rounded-[var(--card-radius)] bg-[var(--surface)] lg:bg-secondary/10 lg:shadow-none lg:border-border/30 hover:border-primary/40 hover:translate-y-[-2px] lg:hover:bg-secondary/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] lg:text-[11px] font-bold uppercase text-muted-foreground/70 tracking-[0.2em] mb-1">
                {format(stat.date, 'EEEE', { locale: uk })}
              </span>
              <span className="text-lg lg:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {format(stat.date, 'd MMMM', { locale: uk })}
              </span>
            </div>
            <div className={cn(
              "size-10 rounded-2xl flex items-center justify-center transition-colors",
              stat.count > 0 ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted-foreground/40"
            )}>
              <Calendar size={18} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
              <span>Завантаженість</span>
              <span>{stat.occupancy}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stat.occupancy}%` }}
                className={cn(
                  "h-full rounded-full transition-colors",
                  stat.occupancy > 80 ? "bg-error" : stat.occupancy > 50 ? "bg-warning" : "bg-success"
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                <TrendingUp size={10} />
                <span>Виручка</span>
              </div>
              <span className="text-xs font-bold text-foreground">{formatPrice(stat.revenue)}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                <Users size={10} />
                <span>Записи</span>
              </div>
              <span className="text-xs font-bold text-foreground">{stat.count}</span>
            </div>
          </div>

          {stat.bookings.length > 0 && (
            <div className="mt-2 pt-3 border-t border-muted/5 flex -space-x-2 overflow-hidden">
              {stat.bookings.slice(0, 4).map((b, j) => (
                <div 
                  key={b.id} 
                  className="size-7 rounded-full bg-white border-2 border-peach flex items-center justify-center text-[10px] font-bold text-primary shadow-sm"
                  title={b.client_name}
                >
                  {b.client_name[0]}
                </div>
              ))}
              {stat.count > 4 && (
                <div className="size-7 rounded-full bg-muted/20 border-2 border-peach flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                  +{stat.count - 4}
                </div>
              )}
            </div>
          )}
        </motion.button>
      ))}
    </div>
  );
}
