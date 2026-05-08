'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { toMins, fromMins } from '@/lib/utils/smartSlots';
import { type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { BookingCard } from '../BookingCard';
import { Plus } from 'lucide-react';

interface Props {
  bookings: BookingWithServices[];
  date: string;
  workStart?: string;
  workEnd?: string;
  onOpportunityClick?: (time: string) => void;
}

const HOUR_HEIGHT = 100; // px
const START_HOUR = 8;
const END_HOUR = 22;

export function VerticalTimeline({ bookings, date, workStart = '09:00', workEnd = '20:00', onOpportunityClick }: Props) {
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const timelineBookings = useMemo(() => {
    return bookings
      .filter(b => b.date === date && b.status !== 'cancelled')
      .map(b => {
        const startMin = toMins(b.start_time);
        const endMin = toMins(b.end_time);
        const duration = endMin - startMin;
        const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
        const height = (duration / 60) * HOUR_HEIGHT;
        return { ...b, top, height };
      });
  }, [bookings, date]);

  // Logic to find empty gaps > 30 mins
  const gaps = useMemo(() => {
    const sorted = [...timelineBookings].sort((a, b) => a.top - b.top);
    const foundGaps: { top: number; height: number; time: string }[] = [];
    
    let lastEnd = toMins(workStart);
    const workEndMin = toMins(workEnd);

    sorted.forEach(b => {
      const bStart = toMins(b.start_time);
      if (bStart - lastEnd >= 30) {
        const top = ((lastEnd - START_HOUR * 60) / 60) * HOUR_HEIGHT;
        const height = ((bStart - lastEnd) / 60) * HOUR_HEIGHT;
        foundGaps.push({ top, height, time: fromMins(lastEnd) });
      }
      lastEnd = Math.max(lastEnd, toMins(b.end_time));
    });

    if (workEndMin - lastEnd >= 30) {
      const top = ((lastEnd - START_HOUR * 60) / 60) * HOUR_HEIGHT;
      const height = ((workEndMin - lastEnd) / 60) * HOUR_HEIGHT;
      foundGaps.push({ top, height, time: fromMins(lastEnd) });
    }

    return foundGaps;
  }, [timelineBookings, workStart, workEnd]);

  return (
    <div className="relative bg-white/40 rounded-3xl border border-white/60 overflow-hidden" style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}>
      {/* 1. Time Grid Labels */}
      <div className="absolute inset-0 pointer-events-none">
        {hours.map(h => (
          <div 
            key={h} 
            className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/10 flex items-start"
            style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
          >
            <span className="text-[10px] font-medium text-muted-foreground/40 ml-2 mt-1">
              {String(h).padStart(2, '0')}:00
            </span>
          </div>
        ))}
      </div>

      {/* 2. Gaps / Opportunities */}
      {gaps.map((gap, i) => (
        <motion.button
          key={`gap-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => onOpportunityClick?.(gap.time)}
          className="absolute left-14 right-4 rounded-2xl bg-primary/5 border border-dashed border-primary/20 flex items-center justify-center group hover:bg-primary/10 transition-colors"
          style={{ top: gap.top + 4, height: gap.height - 8 }}
        >
          <div className="flex items-center gap-2 text-primary/40 group-hover:text-primary/60 transition-colors">
            <Plus size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Вільне вікно</span>
          </div>
        </motion.button>
      ))}

      {/* 3. Bookings */}
      <div className="absolute inset-0 left-14 right-4">
        {timelineBookings.map((b, i) => (
          <div 
            key={b.id} 
            className="absolute left-0 right-0"
            style={{ top: b.top, height: b.height }}
          >
            <div className="h-full py-1">
              <BookingCard 
                booking={b} 
                compact 
                hideTime 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
