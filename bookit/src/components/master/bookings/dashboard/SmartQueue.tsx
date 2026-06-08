'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { BookingCard } from '../BookingCard';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';

interface Props {
  bookings: BookingWithServices[];
}

export function SmartQueue({ bookings }: Props) {
  const todayStr = new Date().toISOString().split('T')[0];

  const groups = useMemo(() => {
    const now = new Date();
    
    const needsAction = bookings.filter(b => b.status === 'pending');
    
    const startingSoon = bookings.filter(b => {
      if (b.status !== 'confirmed') return false;
      if (b.date !== todayStr) return false;
      const startMins = Number(b.start_time.split(':')[0]) * 60 + Number(b.start_time.split(':')[1]);
      const nowMins = now.getHours() * 60 + now.getMinutes();
      return startMins >= nowMins && startMins <= nowMins + 120; // in next 2 hours
    });

    const needsCompletion = bookings.filter(b => {
      if (b.status !== 'confirmed') return false;
      const endMins = Number(b.end_time.split(':')[0]) * 60 + Number(b.end_time.split(':')[1]);
      const nowMins = now.getHours() * 60 + now.getMinutes();
      
      // If it's today and end_time < now
      if (b.date === todayStr) return endMins < nowMins;
      // If it's in the past
      return b.date < todayStr;
    });

    return [
      { id: 'action', title: 'Потребують відповіді', icon: <AlertCircle className="text-warning" size={16} />, items: needsAction },
      { id: 'soon', title: 'Скоро почнуться', icon: <Clock className="text-primary" size={16} />, items: startingSoon },
      { id: 'complete', title: 'Час завершити', icon: <CheckCircle2 className="text-success" size={16} />, items: needsCompletion },
    ].filter(g => g.items.length > 0);
  }, [bookings]);

  if (groups.length === 0) {
    return (
      <div className="bento-card p-10 flex flex-col items-center text-center gap-3">
        <div className="size-16 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-success" />
        </div>
        <p className="text-sm font-semibold text-foreground">Все під контролем!</p>
        <p className="text-xs text-muted-foreground/60">Немає термінових записів, що потребують вашої уваги.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="popLayout">
        {groups.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            layout
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 px-1">
              {group.icon}
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{group.title}</h3>
              <span className="text-[10px] bg-muted/20 px-1.5 py-0.5 rounded-full text-muted-foreground/60">{group.items.length}</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {group.items.map((b, i) => (
                <div key={b.id} className="flex flex-col gap-0.5">
                  {group.id === 'complete' && b.date !== todayStr && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-3">
                      {format(parseISO(b.date), 'd MMMM', { locale: uk })}
                    </span>
                  )}
                  <BookingCard booking={b} index={i} showDate={false} />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
