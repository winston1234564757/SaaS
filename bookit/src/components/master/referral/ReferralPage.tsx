'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Gift, Users, Sparkles, Crown, Share2, Loader2 } from 'lucide-react';
import { pluralize } from '@/lib/utils/dates';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { getOrGenerateReferralCode } from '@/lib/actions/referrals';

interface Props {
  masterId: string;
  referralCode: string;
  referralCount: number;
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://bookit.com.ua');

export function ReferralPage({ masterId, referralCode: initialCode, referralCount, subscriptionTier, subscriptionExpiresAt }: Props) {
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(!initialCode);
  const { currentStep, nextStep, closeTour } = useTour('referral', 1);

  // Автоматична генерація коду, якщо його немає
  useEffect(() => {
    if (!initialCode) {
      async function ensureCode() {
        const res = await getOrGenerateReferralCode(masterId);
        if (res.success && res.code) setCode(res.code);
        setLoading(false);
      }
      ensureCode();
    }
  }, [initialCode, masterId]);

  const referralLink = `${SITE_URL}/invite/${code}`;

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!code) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bookit — онлайн-запис для майстрів',
          text: `Приєднуйся до Bookit — найкраща платформа для б'юті-майстрів. Реєструйся за моїм посиланням і отримаємо обидва 30 днів Pro безкоштовно 🎁`,
          url: referralLink,
        });
      } catch (e) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const isPro = subscriptionTier === 'pro' || subscriptionTier === 'studio';
  const isTrialFromReferral = isPro && subscriptionExpiresAt;
  const trialDaysLeft = subscriptionExpiresAt
    ? Math.max(0, Math.ceil((new Date(subscriptionExpiresAt).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className={cn(
        'relative bento-card p-5 transition-all duration-500 shadow-sm',
        currentStep === 0 && 'tour-glow z-40 scale-[1.02]'
      )}>
        <AnchoredTooltip
          isOpen={currentStep === 0}
          onClose={closeTour}
          title="🤝 Амбасадори бренду"
          text="Запрошуйте колег та отримуйте бонуси разом. Це найпростіший спосіб подовжити вашу Pro-підписку безкоштовно."
          position="bottom"
          primaryButtonText="Зрозуміло"
          onPrimaryClick={nextStep}
        />
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Реферальна програма</h1>
        <p className="text-sm text-[#A8928D]">Запрошуй колег — отримуйте по 30 днів Pro разом</p>
      </div>

      {/* Main Referral Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-5 border-2 border-[#789A99]/20"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#789A99]/12 flex items-center justify-center flex-shrink-0">
            <Gift size={18} className="text-[#789A99]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2C1A14]">Твоє особисте посилання</p>
            <p className="text-xs text-[#A8928D]">Скопіюй та надішли колезі-майстру</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin text-[#789A99]" size={24} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Link display */}
            <div className="flex items-center rounded-2xl border border-[#E8D0C8] bg-white/60 overflow-hidden shadow-inner">
              <p className="flex-1 px-4 py-3 text-xs text-[#2C1A14] truncate font-mono">
                {referralLink.replace(/https?:\/\//, '')}
              </p>
              <button
                onClick={handleCopy}
                className="px-4 py-3 text-[#789A99] hover:bg-[#789A99]/10 transition-colors flex-shrink-0 border-l border-[#E8D0C8]"
              >
                {copied ? <Check size={16} className="text-[#5C9E7A]" /> : <Copy size={16} />}
              </button>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-[#E8D0C8] text-[#2C1A14] text-sm font-semibold hover:bg-[#F5E8E3] active:scale-[0.98] transition-all"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Скопійовано!' : 'Копіювати'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#6a8988] active:scale-[0.98] transition-all shadow-lg shadow-[#789A99]/20"
              >
                <Share2 size={15} />
                Поділитись
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bento-card p-4 flex flex-col items-center gap-1 shadow-sm">
          <Users size={18} className="text-[#6B5750]" />
          <p className="text-2xl font-bold text-[#2C1A14] leading-none mt-1">{referralCount}</p>
          <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wider text-center pt-1">Запрошено</p>
        </div>
        <div className="bento-card p-4 flex flex-col items-center gap-1 shadow-sm">
          <Sparkles size={18} className="text-[#D4935A]" />
          <p className="text-2xl font-bold text-[#2C1A14] leading-none mt-1">{referralCount * 30}</p>
          <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wider text-center pt-1">Днів Pro бонусом</p>
        </div>
      </motion.div>

      {/* Current bonus status */}
      {isTrialFromReferral && trialDaysLeft !== null && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 24 }}
          className="bento-card p-5 bg-[#D4935A]/5 border border-[#D4935A]/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4935A]/15 flex items-center justify-center flex-shrink-0">
              <Crown size={20} className="text-[#D4935A]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2C1A14]">Активні бонуси Pro</p>
              <p className="text-xs text-[#A8928D]">
                {trialDaysLeft > 0 
                  ? `Залишилось ${pluralize(trialDaysLeft, ['день', 'дні', 'днів'])} доступу`
                  : 'Сьогодні останній день'}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-[#E8D0C8]/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.round((trialDaysLeft / 30) * 100))}%` }}
              className="h-full bg-[#D4935A] rounded-full shadow-sm shadow-[#D4935A]/20"
            />
          </div>
        </motion.div>
      )}

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-5"
      >
        <p className="text-xs font-bold text-[#6B5750] uppercase tracking-widest mb-5 opacity-60">Як отримати бонус</p>
        <div className="flex flex-col gap-4">
          {[
            { icon: '🔗', title: 'Надішли посилання', desc: 'Поділись інвайтом з колегою-майстром' },
            { icon: '🚀', title: 'Колега реєструється', desc: 'Він створює акаунт за твоїм посиланням' },
            { icon: '💎', title: 'Отримайте Pro', desc: 'Вам обом автоматично нараховується 30 днів Pro' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#E8D0C8] flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                {step.icon}
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-[#2C1A14]">{step.title}</p>
                <p className="text-xs text-[#A8928D] leading-relaxed mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
