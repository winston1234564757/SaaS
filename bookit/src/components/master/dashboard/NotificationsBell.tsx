'use client';

import { useState } from 'react';
import { Bell, X, CalendarDays, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, type BookingNotification } from '@/lib/supabase/hooks/useNotifications';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { formatDate, timeAgo, pluralize } from '@/lib/utils/dates';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Очікує',       color: '#D4935A' },
  confirmed: { label: 'Підтверджено', color: '#5C9E7A' },
  completed: { label: 'Завершено',    color: '#A8928D' },
  cancelled: { label: 'Скасовано',    color: '#C05B5B' },
  no_show:   { label: 'Не прийшов',   color: '#8B7AB5' },
};

export function NotificationsBell() {
  const { notifications, unreadCount, markAllRead }: { notifications: BookingNotification[]; unreadCount: number; markAllRead: () => void } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleOpen() {
    setOpen(true);
    markAllRead();
  }

  function openBooking(bookingId: string) {
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set('bookingId', bookingId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-2xl bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4935A] text-white text-[9px] font-bold flex items-center justify-center leading-none"
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
              className="fixed inset-0 bg-[#2C1A14]/20 backdrop-blur-[2px] z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[78dvh] flex flex-col rounded-t-[28px] overflow-hidden"
              style={{ background: 'rgba(255, 248, 244, 0.97)', backdropFilter: 'blur(32px)' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 bg-[#E8D5CF] rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <div>
                  <p className="text-base font-semibold text-[#2C1A14]">Сповіщення</p>
                  {notifications.length > 0 && (
                    <p className="text-xs text-[#A8928D]">{pluralize(notifications.length, ['запис', 'записи', 'записів'])}</p>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5E8E3] text-[#6B5750] hover:bg-[#EDD9D1] transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-5 pb-8">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-4xl mb-3">🔔</p>
                    <p className="text-sm font-semibold text-[#2C1A14]">Сповіщень поки немає</p>
                    <p className="text-xs text-[#A8928D] mt-1">Тут з'являться нові записи від клієнтів</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {notifications.map((n, i) => {
                      const cfg = STATUS_CONFIG[n.status] ?? STATUS_CONFIG.pending;
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <button
                            onClick={() => openBooking(n.id)}
                            className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/60 hover:bg-white/90 transition-colors w-full text-left"
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                              style={{ background: 'rgba(255, 210, 194, 0.5)' }}
                            >
                              📅
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <p className="text-sm font-semibold text-[#2C1A14] truncate">{n.clientName}</p>
                                <p className="text-[10px] text-[#A8928D] flex-shrink-0 mt-0.5">{timeAgo(n.createdAt)}</p>
                              </div>
                              <p className="text-xs text-[#6B5750] whitespace-normal break-words leading-tight">{n.services}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1">
                                  <CalendarDays size={10} className="text-[#A8928D]" />
                                  <span className="text-[11px] text-[#A8928D]">{formatDate(n.date)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock size={10} className="text-[#A8928D]" />
                                  <span className="text-[11px] text-[#A8928D]">{n.startTime}</span>
                                </div>
                              </div>
                            </div>
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                              style={{ color: cfg.color, background: `${cfg.color}18` }}
                            >
                              {cfg.label}
                            </span>
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
