'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bell, Check, X, Images, CalendarDays, Star, Megaphone, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { approvePortfolioConsent, declinePortfolioConsent } from '@/app/my/portfolio-consent/actions';
import { timeAgo } from '@/lib/utils/dates';

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

function notifIcon(type: string) {
  if (type === 'new_booking' || type === 'booking_cancelled') return CalendarDays;
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
  const isEmpty = notifications.length === 0 && activeConsents.length === 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-foreground">Сповіщення</h1>

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center">
            <Bell size={28} className="text-[#C8B8B2]" />
          </div>
          <p className="text-base font-bold text-foreground">Поки порожньо</p>
          <p className="text-sm text-muted-foreground">Тут з'являться сповіщення про записи та інші події</p>
        </div>
      )}

      {/* ── Pending portfolio consent requests ── */}
      {activeConsents.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-warning uppercase tracking-wide">Потребує відповіді</p>
          {activeConsents.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-3xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(212,147,90,0.25)', boxShadow: '0 2px 16px rgba(44,26,20,0.08)' }}
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
                  <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Images size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {item.master_name} відмітив вас у портфоліо
                    </p>
                    {!item.cover_url && (
                      <p className="text-xs text-muted-foreground mt-0.5">«{item.title}»</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Підтвердіть або відхиліть участь</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecline(item.id)}
                    disabled={pending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold text-destructive border border-destructive/30 hover:bg-destructive/8 transition-colors disabled:opacity-50"
                  >
                    <X size={15} /> Відхилити
                  </button>
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={pending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{ background: '#789A99' }}
                  >
                    <Check size={15} /> Підтвердити
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── General notifications feed ── */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {activeConsents.length > 0 && (
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wide">Решта</p>
          )}
          {notifications
            .filter(n => n.type !== 'portfolio_consent_request')
            .map((notif, i) => {
              const Icon = notifIcon(notif.type);
              const isBroadcast = notif.type === 'broadcast';
              const broadcast = isBroadcast ? parseBroadcastBody(notif.body) : null;

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => {
                    if (isBroadcast && broadcast?.url) {
                      window.location.href = broadcast.url;
                    } else if (notif.relatedBookingId || notif.type === 'new_booking' || notif.type === 'booking_cancelled' || notif.type === 'reminder') {
                      router.push('/my/bookings');
                    }
                  }}
                  className={`rounded-3xl p-4 flex items-start gap-3 ${(isBroadcast && broadcast?.url) || notif.relatedBookingId || ['new_booking', 'booking_cancelled', 'reminder'].includes(notif.type) ? 'cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all' : ''}`}
                  style={{
                    background: notif.isRead ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.78)',
                    border: isBroadcast
                      ? '1px solid rgba(120,154,153,0.25)'
                      : '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: isBroadcast ? 'rgba(120,154,153,0.12)' : '#F5E8E3' }}
                  >
                    <Icon size={16} style={{ color: isBroadcast ? '#789A99' : '#A8928D' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                    {isBroadcast && broadcast ? (
                      <>
                        {broadcast.text && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{broadcast.text}</p>
                        )}
                        {broadcast.url && (
                          <a
                            href={broadcast.url}
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-85"
                            style={{ background: '#789A99' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Перейти <ExternalLink size={11} />
                          </a>
                        )}
                      </>
                    ) : (
                      notif.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>
                      )
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}
    </div>
  );
}
