'use client';

import { useNotifications } from '@/lib/supabase/hooks/useNotifications';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { 
  PlusCircle, CheckCircle2, XCircle, Star, MessageSquare, 
  Calendar, Zap, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ICON_MAP: Record<string, any> = {
  new_booking: { icon: PlusCircle, color: 'text-success', bg: 'bg-success/10' },
  booking_completed: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
  booking_cancelled: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  new_review: { icon: Star, color: 'text-warning', bg: 'bg-warning/10' },
  marketing_tip: { icon: Zap, color: 'text-warning', bg: 'bg-warning/10' },
};

export function ActivityWidget() {
  const { notifications, unreadCount } = useNotifications();

  const recent = notifications.slice(0, 5);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Активність</h3>
        </div>
        {unreadCount > 0 && (
          <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-4 ring-primary/10">
            {unreadCount} нових
          </span>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {recent.length > 0 ? (
            recent.map((n, i) => {
              const cfg = ICON_MAP[n.type] || { icon: Calendar, color: 'text-muted-foreground', bg: 'bg-secondary/40' };
              const Icon = cfg.icon;
              
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 group"
                >
                  <div className={cn("w-9 h-9 rounded-xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110", cfg.bg)}>
                    <Icon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0 border-b border-secondary/30 pb-3 group-last:border-0">
                    <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-muted-foreground truncate flex-1">{n.body}</p>
                      <span className="text-[9px] text-muted-foreground/40 whitespace-nowrap">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: uk })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-4">
              <Calendar size={32} strokeWidth={1} className="mb-2" />
              <p className="text-xs font-medium">Поки що тихо...</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
