'use client';
// src/components/shared/wizard/BookingSuccess.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Share2, Copy } from 'lucide-react';
import { addMinutes, parse as parseFns, format as formatFns } from 'date-fns';
import { pluralUk } from '@/lib/utils/pluralUk';
import { PostBookingAuth } from '@/components/public/PostBookingAuth';
import { PushPrompt } from './PushPrompt';
import { MONTH_S, fmt, slide } from './helpers';
import type { WizardService, CartItem } from './types';
import { getOrCreateReferralLink } from '@/lib/actions/referrals';
import { PostBookingPartnersBlock } from '@/components/public/PostBookingPartnersBlock';
import type { TrustedPartner } from '@/components/public/TrustedPartnersBlock';
import { Button } from '@/components/ui/Button';

interface BookingSuccessProps {
  selectedServices: WizardService[];
  selectedDate: Date | null;
  selectedTime: string | null;
  totalDuration: number;
  cart: CartItem[];
  clientUserId: string | null;
  createdBookingId: string | null;
  clientPhone: string;
  masterName: string;
  masterId?: string;
  masterC2cEnabled?: boolean;
  masterC2cDiscountPct?: number | null;
  flashDeal?: { id: string; discountPct: number; serviceName: string } | null;
  finalTotal: number;
  direction: number;
  onClose: () => void;
  partners?: TrustedPartner[];
}

export function BookingSuccess({
  selectedServices,
  selectedDate,
  selectedTime,
  totalDuration,
  cart,
  clientUserId,
  createdBookingId,
  clientPhone,
  masterName,
  masterId,
  masterC2cEnabled,
  masterC2cDiscountPct,
  finalTotal,
  direction,
  onClose,
  partners = [],
}: BookingSuccessProps) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!clientUserId || !masterId || !masterC2cEnabled) return;
    getOrCreateReferralLink(clientUserId, 'client', 'C2C', masterId).then(res => {
      if (res.success) setShareLink(res.link);
    });
  }, [clientUserId, masterId, masterC2cEnabled]);

  const handleShare = async () => {
    if (!shareLink) return;
    const pct = masterC2cDiscountPct ?? 10;
    const text = `Я записалась до ${masterName}! Тобі −${pct}% на перший візит за моїм посиланням:`;
    if (navigator.share) {
      navigator.share({ title: `Знижка від ${masterName}`, text, url: shareLink }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text} ${shareLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopy = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div key="success" custom={direction} variants={slide}
      initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.22, ease: 'easeOut' }}
      data-testid="wizard-success"
      className="flex flex-col gap-5 py-2">

      {/* Темна success-обкладинка — печатка чеку (галочка + намір + сума on-dark) */}
      <div className="editorial-cover relative overflow-hidden rounded-2xl px-5 pt-5 pb-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-52 rounded-full blur-3xl"
          style={{ background: 'rgba(52,211,153,0.22)' }}
        />
        <div className="relative flex items-start gap-4">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.05, type: 'spring' as const, stiffness: 300, damping: 18 }}
            className="size-12 rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/30 flex items-center justify-center shrink-0">
            <Check size={24} className="text-emerald-300" strokeWidth={2.5} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <h2 className="heading-serif text-[26px] leading-[1.05] text-white">Запис підтверджено</h2>
            <p className="text-sm text-white/70 mt-1.5 leading-snug">
              {selectedServices.length === 1 ? selectedServices[0].name : pluralUk(selectedServices.length, 'послуга', 'послуги', 'послуг')}
              {selectedDate && ` — ${selectedDate.getDate()} ${MONTH_S[selectedDate.getMonth()]}`}
              {selectedTime && (() => {
                const endTime = formatFns(addMinutes(parseFns(selectedTime, 'HH:mm', new Date()), totalDuration), 'HH:mm');
                return <span className="text-white font-medium">{`, ${selectedTime} – ${endTime}`}</span>;
              })()}
            </p>
            {cart.length > 0 && (
              <p className="metric-value text-lg text-white mt-2 tabular-nums">{fmt(finalTotal)}</p>
            )}
            {masterName && (
              <p className="text-xs text-white/55 mt-2">Очікуй підтвердження від {masterName}</p>
            )}
          </div>
        </div>
      </div>

      {masterC2cEnabled && shareLink && clientUserId && (
        <div className="w-full bento-card p-4 flex flex-col gap-3 text-left">
          <div>
            <p className="text-sm font-semibold text-foreground">Поділись з подругою</p>
            <p className="text-xs text-text-sub mt-0.5">
              Вона отримає −{masterC2cDiscountPct ?? 10}% на перший візит · Ти накопиш +{masterC2cDiscountPct ?? 10}% бонус
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button"
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-xs font-semibold hover:opacity-90 active:scale-[0.95] transition-all cursor-pointer"
            >
              <Share2 size={13} /> Поділитись
            </button>
            <button type="button"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-secondary border border-border text-xs font-medium text-foreground hover:bg-secondary/80 active:scale-[0.95] transition-all cursor-pointer"
            >
              <Copy size={13} /> {copied ? 'Скопійовано!' : 'Копіювати'}
            </button>
          </div>
        </div>
      )}

      <PostBookingPartnersBlock partners={partners} />

      {!clientUserId && createdBookingId ? (
        <div className="w-full border-t border-border pt-5">
          <PostBookingAuth
            bookingId={createdBookingId}
            clientPhone={clientPhone.trim()}
            onSkip={onClose}
            masterId={masterId}
            masterC2cEnabled={masterC2cEnabled}
            masterC2cDiscountPct={masterC2cDiscountPct}
          />
        </div>
      ) : (
        <div className="w-full flex flex-col gap-3">
          <PushPrompt />
          <Button variant="primary" size="lg" fullWidth onClick={onClose}>
            Готово
          </Button>
        </div>
      )}
    </motion.div>
  );
}
