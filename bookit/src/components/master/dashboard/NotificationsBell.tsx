'use client';

import { useState } from 'react';
import { Bell, X, CalendarDays, XCircle, Star, AlertCircle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, type MasterNotification } from '@/lib/supabase/hooks/useNotifications';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { timeAgo } from '@/lib/utils/dates';

const TYPE_CONFIG: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  new_booking:        { Icon: CalendarDays,   color: 'var(--sage)',        bg: 'color-mix(in srgb, var(--sage) 15%, transparent)'        },
  booking_created:    { Icon: CalendarDays,   color: 'var(--sage)',        bg: 'color-mix(in srgb, var(--sage) 15%, transparent)'        },
  booking_cancelled:  { Icon: XCircle,        color: 'var(--destructive)', bg: 'color-mix(in srgb, var(--destructive) 12%, transparent)' },
  new_review:         { Icon: Star,           color: 'var(--accent)',      bg: 'color-mix(in srgb, var(--accent) 12%, transparent)'      },
  unhandled_booking:  { Icon: AlertCircle,    color: 'var(--accent)',      bg: 'color-mix(in srgb, var(--accent) 12%, transparent)'      },
  support_user_reply: { Icon: MessageCircle,  color: 'var(--sage)',        bg: 'color-mix(in srgb, var(--sage) 15%, transparent)'        },
};
const DEFAULT_TYPE = TYPE_CONFIG.new_booking;

export function NotificationsBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleOpen() {
    setOpen(true);
    markAllRead();
  }

  function handleClick(n: MasterNotification) {
    setOpen(false);
    if (n.type === 'support_user_reply') {
      router.push('/dashboard/support/chat');
      return;
    }
    if (n.type === 'new_review') {
      router.push('/dashboard/reviews');
      return;
    }
    
    if (n.bookingId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('bookingId', n.bookingId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    } else {
      router.push('/dashboard/bookings');
    }
  }

  return (
    <>
      <button type="button"
        onClick={handleOpen}
        className="relative size-9 flex items-center justify-center rounded-xl bg-secondary/60 border border-border text-muted-foreground hover:bg-secondary transition-colors active:scale-95 transition-all"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 size-4 rounded-full bg-warning text-white text-[9px] font-bold flex items-center justify-center leading-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px] z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[55] max-h-[78dvh] flex flex-col rounded-t-[28px] overflow-hidden"
              style={{ background: 'rgba(255, 248, 244, 0.97)', backdropFilter: 'blur(32px)' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 bg-secondary/80 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <p className="text-base font-semibold text-foreground">Сповіщення</p>
                <button type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Закрити"
                  className="size-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-peach/60 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-5 pb-8">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell size={32} className="mx-auto text-secondary/80 mb-3" />
                    <p className="text-sm font-semibold text-foreground">Сповіщень поки немає</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Тут з'являться нові записи та відгуки</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {notifications.map((n, i) => {
                      const cfg = TYPE_CONFIG[n.type] ?? DEFAULT_TYPE;
                      const { Icon } = cfg;
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <button type="button"
                            onClick={() => handleClick(n)}
                            className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors w-full text-left ${
                            n.isRead
                                ? 'bg-secondary/40 hover:bg-secondary/70'
                                : 'bg-secondary/80 hover:bg-secondary shadow-sm'
                            } disabled:cursor-default`}
                          >
                            <div
                              className="size-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: cfg.bg }}
                            >
                              <Icon size={16} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <p className={`text-sm font-semibold truncate ${n.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                                  {n.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 flex-shrink-0 mt-0.5">
                                  {timeAgo(n.createdAt)}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground leading-tight mt-0.5">{n.body}</p>
                            </div>
                            {!n.isRead && (
                              <div className="size-2 rounded-full bg-warning flex-shrink-0 mt-1.5" />
                            )}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
