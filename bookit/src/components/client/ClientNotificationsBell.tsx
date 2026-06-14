'use client';

import { useState, useRef, useEffect, type ElementType } from 'react';
import { Bell, X, CalendarDays, XCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils/cn';
import { useClientNotifications, type ClientNotification } from '@/lib/supabase/hooks/useClientNotifications';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/lib/utils/dates';

const TYPE_CONFIG: Record<string, { Icon: ElementType; color: string; bg: string }> = {
  booking_confirmed: { Icon: CalendarDays,  color: 'var(--accent)',      bg: 'color-mix(in srgb, var(--accent) 12%, transparent)'      },
  booking_created:   { Icon: CalendarDays,  color: 'var(--accent)',      bg: 'color-mix(in srgb, var(--accent) 12%, transparent)'      },
  booking_cancelled: { Icon: XCircle,       color: 'var(--destructive)', bg: 'color-mix(in srgb, var(--destructive) 12%, transparent)' },
  booking_reminder:  { Icon: AlertCircle,   color: 'var(--accent)',      bg: 'color-mix(in srgb, var(--accent) 12%, transparent)'      },
  support_reply:     { Icon: MessageCircle, color: 'var(--accent)',      bg: 'color-mix(in srgb, var(--accent) 12%, transparent)'      },
};
const DEFAULT_TYPE = TYPE_CONFIG.booking_confirmed;

export function ClientNotificationsBell({ userId }: { userId: string }) {
  const { notifications, unreadCount, markAllRead } = useClientNotifications(userId);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const prevUnreadRef = useRef(unreadCount);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  function handleClick(n: ClientNotification) {
    setOpen(false);
    if (n.bookingId) {
      router.push(`/my/bookings?bookingId=${n.bookingId}`);
    } else {
      router.push('/my/notifications');
    }
  }

  return (
    <div className="hidden md:inline-flex">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Сповіщення"
        className={cn(
          'relative size-9 flex items-center justify-center rounded-xl bg-secondary/60 border border-border hover:bg-secondary transition-colors duration-150 active:scale-95',
          unreadCount > 0 ? 'text-accent' : 'text-muted-foreground',
        )}
      >
        <motion.div
          animate={shaking ? { rotate: [0, -15, 15, -15, 15, -8, 8, 0] } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <Bell size={16} strokeWidth={2} />
        </motion.div>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 z-10 size-4 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center leading-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <Drawer.Root
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) markAllRead();
        }}
        shouldScaleBackground={false}
        repositionInputs={false}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[140] bg-foreground/20 backdrop-blur-[2px]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[150] max-h-[78dvh] flex flex-col rounded-t-[28px] outline-none bg-secondary/95 backdrop-blur-3xl will-change-transform">
            <Drawer.Title className="sr-only">Сповіщення</Drawer.Title>

            <div
              role="presentation"
              aria-hidden="true"
              className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
              <p className="text-base font-semibold text-foreground">Сповіщення</p>
              <button
                type="button"
                onClick={() => { markAllRead(); setOpen(false); }}
                aria-label="Закрити"
                className="size-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/60 transition-colors duration-150"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell size={32} className="mx-auto text-secondary/80 mb-3" />
                  <p className="text-sm font-semibold text-foreground">Сповіщень поки немає</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Тут з'являться підтвердження та нагадування</p>
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
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      >
                        <button
                          type="button"
                          onClick={() => handleClick(n)}
                          className={cn(
                            'flex items-start gap-3 p-3.5 rounded-xl transition-colors duration-150 w-full text-left',
                            n.isRead
                              ? 'bg-secondary/40 hover:bg-secondary/70'
                              : 'bg-secondary/80 hover:bg-secondary shadow-sm',
                          )}
                        >
                          <div
                            className="size-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: cfg.bg }}
                          >
                            <Icon size={16} style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className={cn('text-sm font-semibold truncate', n.isRead ? 'text-muted-foreground' : 'text-foreground')}>
                                {n.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 flex-shrink-0 mt-0.5">
                                {timeAgo(n.createdAt)}
                              </p>
                            </div>
                            <p className={cn('text-xs leading-tight mt-0.5', n.isRead ? 'text-muted-foreground/50' : 'text-muted-foreground')}>
                              {n.body}
                            </p>
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
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
