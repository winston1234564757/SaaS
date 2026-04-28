'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Bell, Check, X, Images, CalendarDays, Star } from 'lucide-react';
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
  return Bell;
}

export function ClientNotificationsPage({ notifications, portfolioConsents }: Props) {
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
      <h1 className="text-xl font-bold text-[#2C1A14]">Сповіщення</h1>

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#F5E8E3] flex items-center justify-center">
            <Bell size={28} className="text-[#C8B8B2]" />
          </div>
          <p className="text-base font-bold text-[#2C1A14]">Поки порожньо</p>
          <p className="text-sm text-[#6B5750]">Тут з'являться сповіщення про записи та інші події</p>
        </div>
      )}

      {/* ── Pending portfolio consent requests ── */}
      {activeConsents.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-[#D4935A] uppercase tracking-wide">Потребує відповіді</p>
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
                  <div className="w-9 h-9 rounded-2xl bg-[#789A99]/15 flex items-center justify-center shrink-0">
                    <Images size={16} className="text-[#789A99]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#2C1A14]">
                      {item.master_name} відмітив вас у портфоліо
                    </p>
                    {!item.cover_url && (
                      <p className="text-xs text-[#6B5750] mt-0.5">«{item.title}»</p>
                    )}
                    <p className="text-xs text-[#A8928D] mt-0.5">Підтвердіть або відхиліть участь</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecline(item.id)}
                    disabled={pending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold text-[#C05B5B] border border-[#C05B5B]/30 hover:bg-[#C05B5B]/8 transition-colors disabled:opacity-50"
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
            <p className="text-xs font-bold text-[#A8928D] uppercase tracking-wide">Решта</p>
          )}
          {notifications
            .filter(n => n.type !== 'portfolio_consent_request')
            .map((notif, i) => {
              const Icon = notifIcon(notif.type);
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-3xl p-4 flex items-start gap-3"
                  style={{
                    background: notif.isRead ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.78)',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  <div className="w-9 h-9 rounded-2xl bg-[#F5E8E3] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-[#A8928D]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2C1A14]">{notif.title}</p>
                    {notif.body && (
                      <p className="text-xs text-[#6B5750] mt-0.5 leading-relaxed">{notif.body}</p>
                    )}
                    <p className="text-[10px] text-[#A8928D] mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}
    </div>
  );
}
