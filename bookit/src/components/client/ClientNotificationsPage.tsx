'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bell, Check, X, Images, CalendarDays, Star, Megaphone, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { approvePortfolioConsent, declinePortfolioConsent } from '@/app/my/portfolio-consent/actions';
import { timeAgo } from '@/lib/utils/dates';
import { ClientPageHero } from './ClientPageHero';

interface ClientNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  relatedBookingId: string | null;
}

interface PortfolioConsent {
  id: string;
  title: string;
  master_name: string;
  master_slug: string;
  cover_url: string | null;
}

interface Props {
  notifications: ClientNotification[];
  portfolioConsents: PortfolioConsent[];
}

const SPRING = { type: 'spring', stiffness: 300, damping: 24 } as const;

function notifDotColor(type: string): string {
  if (type === 'booking_cancelled') return 'bg-destructive';
  if (type === 'broadcast') return 'bg-warning';
  if (type === 'new_booking' || type === 'booking_confirmed' || type === 'booking_created') return 'bg-accent';
  return 'bg-muted-foreground/30';
}

function notifIcon(type: string) {
  if (type === 'new_booking' || type === 'booking_cancelled' || type === 'booking_confirmed' || type === 'booking_created' || type === 'booking_rescheduled' || type === 'booking_completed' || type === 'reminder') return CalendarDays;
  if (type === 'new_review') return Star;
  if (type === 'broadcast') return Megaphone;
  return Bell;
}

function parseBroadcastBody(body: string): { text: string; url: string | null } {
  const lines = body.split('\n');
  const last = lines[lines.length - 1].trim();
  if (last.startsWith('http')) {
    return { text: lines.slice(0, -1).join('\n').trim(), url: last };
  }
  return { text: body, url: null };
}

function groupByDate(notifications: ClientNotification[]): Array<{ label: string; items: ClientNotification[] }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = new Map<string, ClientNotification[]>();

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);

    let label: string;
    if (d.getTime() === today.getTime()) {
      label = 'Сьогодні';
    } else if (d.getTime() === yesterday.getTime()) {
      label = 'Вчора';
    } else {
      label = d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(n);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1" aria-hidden="true">
      <div className="h-px flex-1 bg-border/50" />
      <span className="text-[10px] font-medium text-text-sub uppercase tracking-wide">{label}</span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

export function ClientNotificationsPage({ notifications, portfolioConsents }: Props) {
  const router = useRouter();
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const handleApprove = (itemId: string) => {
    startTransition(async () => {
      await approvePortfolioConsent(itemId);
      setResolvedIds(prev => new Set([...prev, itemId]));
    });
  };

  const handleDecline = (itemId: string) => {
    startTransition(async () => {
      await declinePortfolioConsent(itemId);
      setResolvedIds(prev => new Set([...prev, itemId]));
    });
  };

  const activeConsents = portfolioConsents.filter(c => !resolvedIds.has(c.id));
  const feedNotifs = notifications.filter(n => n.type !== 'portfolio_consent_request');
  const isEmpty = feedNotifs.length === 0 && activeConsents.length === 0;
  const groups = groupByDate(feedNotifs);
  const unread = feedNotifs.filter(n => !n.isRead).length + activeConsents.length;

  return (
    <div className="flex flex-col gap-4">
      <ClientPageHero
        title="Сповіщення"
        metric={unread}
        metricLabel="нових"
        subtitle={isEmpty ? 'Поки порожньо' : unread === 0 ? 'Усе прочитано' : undefined}
      />

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="size-16 rounded-xl bg-secondary flex items-center justify-center">
            <Bell size={28} className="text-text-sub" />
          </div>
          <p className="text-base font-bold text-foreground">Поки порожньо</p>
          <p className="text-sm text-text-sub">Тут з'являться сповіщення про записи та інші події</p>
        </div>
      )}

      {/* Portfolio consent requests */}
      {activeConsents.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-warning uppercase tracking-wide px-1">Потребує відповіді</p>
          {activeConsents.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ...SPRING }}
              className="rounded-xl overflow-hidden bg-secondary/80 border border-accent/20 shadow-sm"
            >
              {item.cover_url && (
                <div className="relative w-full h-36">
                  <Image src={item.cover_url} alt={item.title} fill className="object-cover" sizes="512px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <p className="absolute bottom-3 left-4 text-sm font-bold text-white">{item.title}</p>
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                    <Images size={16} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {item.master_name} відмітив вас у портфоліо
                    </p>
                    {!item.cover_url && (
                      <p className="text-xs text-text-sub mt-0.5">«{item.title}»</p>
                    )}
                    <p className="text-xs text-text-sub mt-0.5">Підтвердіть або відхиліть участь</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecline(item.id)}
                    disabled={pending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-destructive border border-destructive/30 hover:bg-destructive/8 active:scale-[0.97] transition-all duration-100 disabled:opacity-50 cursor-pointer min-h-[44px]"
                  >
                    <X size={15} /> Відхилити
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(item.id)}
                    disabled={pending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-accent-foreground bg-accent hover:opacity-90 active:scale-[0.97] transition-all duration-100 disabled:opacity-50 cursor-pointer min-h-[44px]"
                  >
                    <Check size={15} /> Підтвердити
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Notifications feed — date-grouped */}
      {groups.length > 0 && (
        <div className="flex flex-col gap-1">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <DateSeparator label={label} />
              <div className="flex flex-col gap-1.5 mt-1">
                {items.map((notif, i) => {
                  const Icon = notifIcon(notif.type);
                  const isBroadcast = notif.type === 'broadcast';
                  const broadcast = isBroadcast ? parseBroadcastBody(notif.body) : null;
                  const isClickable = (isBroadcast && !!broadcast?.url) ||
                    notif.type === 'support_user_reply' ||
                    !!notif.relatedBookingId ||
                    ['new_booking', 'booking_cancelled', 'booking_created', 'booking_confirmed', 'booking_rescheduled', 'booking_completed', 'reminder'].includes(notif.type);

                  return (
                    <motion.button
                      type="button"
                      key={notif.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, ...SPRING }}
                      onClick={() => {
                        if (isBroadcast && broadcast?.url) {
                          window.location.href = broadcast.url;
                        } else if (notif.type === 'support_user_reply') {
                          router.push('/my/support/chat');
                        } else if (notif.relatedBookingId || ['new_booking', 'booking_cancelled', 'booking_created', 'booking_confirmed', 'booking_rescheduled', 'booking_completed', 'reminder'].includes(notif.type)) {
                          router.push('/my/bookings');
                        }
                      }}
                      className={[
                        'text-left w-full rounded-xl p-4 flex items-start gap-3 border transition-all duration-100',
                        notif.isRead ? 'bg-secondary/40' : 'bg-accent/5 border-accent/10',
                        !notif.isRead ? '' : 'border-border/60',
                        isClickable ? 'cursor-pointer hover:opacity-90 active:scale-[0.98]' : 'cursor-default',
                      ].join(' ')}
                    >
                      {/* Type dot */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0 mt-1.5">
                        <div className={`size-2 rounded-full ${notifDotColor(notif.type)}`} />
                      </div>

                      {/* Icon */}
                      <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${isBroadcast ? 'bg-accent/12 text-accent' : 'bg-secondary/60 text-text-sub'}`}>
                        <Icon size={16} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${notif.isRead ? 'text-foreground/80' : 'text-foreground'}`}>
                          {notif.title}
                        </p>

                        {isBroadcast && broadcast ? (
                          <>
                            {broadcast.text && (
                              <p className="text-xs text-text-sub mt-0.5 leading-relaxed">{broadcast.text}</p>
                            )}
                            {broadcast.url && (
                              <a
                                href={broadcast.url}
                                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-accent-foreground bg-accent active:scale-[0.97] cursor-pointer transition-all duration-100 hover:opacity-90"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Перейти <ExternalLink size={11} />
                              </a>
                            )}
                          </>
                        ) : (
                          notif.body && (
                            <p className="text-xs text-text-sub mt-0.5 leading-relaxed">{notif.body}</p>
                          )
                        )}

                        <p className="text-[10px] text-text-sub mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
