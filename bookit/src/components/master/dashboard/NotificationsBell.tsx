'use client';

import { useState, useRef, useEffect, type ElementType } from 'react';
import { Bell, X, CalendarDays, XCircle, Star, AlertCircle, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils/cn';
import { useNotifications, type MasterNotification } from '@/lib/supabase/hooks/useNotifications';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { timeAgo } from '@/lib/utils/dates';

const TYPE_CONFIG: Record<string, { Icon: ElementType; color: string; bg: string }> = {
  new_booking:        { Icon: CalendarDays,   color: 'var(--accent)',      bg: 'color-mix(in srgb, var(--accent) 12%, transparent)'      },
  booking_created:    { Icon: CalendarDays,   color: 'var(--accent)',      bg: 'color-mix(in srgb, var(--accent) 12%, transparent)'      },
  booking_cancelled:  { Icon: XCircle,        color: 'var(--destructive)', bg: 'color-mix(in srgb, var(--destructive) 12%, transparent)' },
  new_review:         { Icon: Star,           color: 'var(--accent)',      bg: 'color-mix(in srgb, var(--accent) 12%, transparent)'      },
  unhandled_booking:  { Icon: AlertCircle,    color: 'var(--accent)',      bg: 'color-mix(in srgb, var(--accent) 12%, transparent)'      },
  support_user_reply: { Icon: MessageCircle,  color: 'var(--accent)',      bg: 'color-mix(in srgb, var(--accent) 12%, transparent)'      },
};
const DEFAULT_TYPE = TYPE_CONFIG.new_booking;

export function NotificationsBell({ mobileNav = false, fab = false }: { mobileNav?: boolean; fab?: boolean }) {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const bellIcon = (
    <motion.div
      animate={shaking ? { rotate: [0, -15, 15, -15, 15, -8, 8, 0] } : { rotate: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <Bell size={mobileNav ? 22 : fab ? 20 : 16} strokeWidth={2} />
    </motion.div>
  );

  return (
    <>
      {mobileNav ? (
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-2 transition-colors duration-150 active:scale-90',
            unreadCount > 0 ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]',
          )}
        >
          <div className="relative">
            {bellIcon}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 size-4 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className={cn('text-[10px] font-semibold leading-none', unreadCount > 0 ? 'opacity-100' : 'opacity-40')}>
            Сповіщення
          </span>
          <div
            className="mt-0.5 rounded-full transition-[opacity,transform] duration-300"
            style={{ width: '3px', height: '3px', background: 'var(--accent)', opacity: unreadCount > 0 ? 1 : 0, transform: unreadCount > 0 ? 'scale(1)' : 'scale(0)' }}
          />
        </button>
      ) : fab ? (
        <button
          type="button"
          onClick={handleOpen}
          className="relative size-11 flex items-center justify-center rounded-full active:scale-[0.92] transition-transform duration-150"
          style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border-strong)',
            color: unreadCount > 0 ? 'var(--accent)' : 'var(--text-tertiary)',
            boxShadow: '0 4px 20px color-mix(in srgb, var(--text-primary) 8%, transparent)',
          }}
        >
          {bellIcon}
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 size-4 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="relative size-9 flex items-center justify-center rounded-xl bg-secondary/60 border border-border text-muted-foreground hover:bg-secondary transition-colors duration-150 active:scale-95"
        >
          {bellIcon}
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 size-4 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </button>
      )}

      <Drawer.Root
        open={open}
        onOpenChange={setOpen}
        shouldScaleBackground={false}
        repositionInputs={false}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[140] bg-foreground/20 backdrop-blur-[2px]" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-[150] max-h-[78dvh] flex flex-col rounded-t-[28px] outline-none bg-secondary/95 backdrop-blur-3xl will-change-transform"
          >
            <Drawer.Title className="sr-only">Сповіщення</Drawer.Title>

            {/* Handle */}
            <div
              role="presentation"
              aria-hidden="true"
              className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
              <p className="text-base font-semibold text-foreground">Сповіщення</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрити"
                className="size-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/60 transition-colors duration-150"
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
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
