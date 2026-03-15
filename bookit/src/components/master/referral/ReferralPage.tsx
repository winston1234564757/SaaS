'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Gift, Users, Sparkles, Crown } from 'lucide-react';

interface Props {
  referralCode: string;
  referralCount: number;
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
}

export function ReferralPage({ referralCode, referralCount, subscriptionTier, subscriptionExpiresAt }: Props) {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://bookit.com.ua/register?ref=${referralCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Bookit — онлайн-запис для майстрів',
        text: `Приєднуйся до Bookit — персональна сторінка запису для майстрів. Реєструйся за моїм посиланням і отримаємо обидва місяць Pro безкоштовно 🎁`,
        url: referralLink,
      });
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
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Реферальна програма</h1>
        <p className="text-sm text-[#A8928D]">Запрошуй колег — отримуйте бонуси разом</p>
      </div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-5"
      >
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-4">Як це працює</p>
        <div className="flex flex-col gap-3">
          {[
            { icon: '🔗', title: 'Поділись посиланням', desc: 'Надішли своє реферальне посилання колезі-майстру' },
            { icon: '✅', title: 'Колега реєструється', desc: 'Вони створюють акаунт за твоїм посиланням' },
            { icon: '🎁', title: 'Обидва отримують бонус', desc: 'По 30 днів Pro безкоштовно — тобі і новому майстру' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#789A99]/10 flex items-center justify-center text-lg flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2C1A14]">{step.title}</p>
                <p className="text-xs text-[#A8928D] mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Referral link */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-5"
      >
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-3">Твоє посилання</p>

        {/* Link display */}
        <div className="flex items-center rounded-2xl border border-white/80 bg-white/60 overflow-hidden mb-3">
          <p className="flex-1 px-4 py-3 text-sm text-[#2C1A14] truncate font-mono">
            bookit.com.ua/register?ref=<span className="font-bold text-[#789A99]">{referralCode}</span>
          </p>
          <button
            onClick={handleCopy}
            className="px-4 py-3 text-[#789A99] hover:bg-[#789A99]/10 transition-colors flex-shrink-0 border-l border-white/80"
          >
            {copied ? <Check size={16} className="text-[#5C9E7A]" /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#789A99]/10 text-[#789A99] text-sm font-semibold hover:bg-[#789A99]/20 transition-colors"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Скопійовано!' : 'Копіювати'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#5C7E7D] transition-colors"
          >
            <Sparkles size={15} />
            Поділитись
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 24 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bento-card p-4 flex flex-col items-center gap-1">
          <Users size={18} className="text-[#789A99]" />
          <p className="text-2xl font-bold text-[#2C1A14]">{referralCount}</p>
          <p className="text-xs text-[#A8928D] text-center">Запрошено майстрів</p>
        </div>
        <div className="bento-card p-4 flex flex-col items-center gap-1">
          <Gift size={18} className="text-[#D4935A]" />
          <p className="text-2xl font-bold text-[#2C1A14]">{referralCount * 30}</p>
          <p className="text-xs text-[#A8928D] text-center">Днів Pro зароблено</p>
        </div>
      </motion.div>

      {/* Current bonus status */}
      {isTrialFromReferral && trialDaysLeft !== null && trialDaysLeft > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 24 }}
          className="bento-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D4935A]/15 flex items-center justify-center flex-shrink-0">
              <Crown size={20} className="text-[#D4935A]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2C1A14]">Pro активний</p>
              <p className="text-xs text-[#A8928D]">Залишилось {trialDaysLeft} {trialDaysLeft === 1 ? 'день' : trialDaysLeft < 5 ? 'дні' : 'днів'} Pro доступу</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-[#F5E8E3] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4935A]/60 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.round((trialDaysLeft / 30) * 100))}%` }}
            />
          </div>
        </motion.div>
      )}

      {/* Invite message preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-5"
      >
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-3">Текст для запрошення</p>
        <div className="p-4 rounded-2xl bg-white/50 border border-white/70">
          <p className="text-sm text-[#2C1A14] leading-relaxed">
            Привіт! 👋 Я використовую Bookit для онлайн-запису клієнтів — дуже зручно. Спробуй теж, за моїм посиланням обидва отримаємо місяць Pro безкоштовно 🎁{'\n\n'}
            {referralLink}
          </p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(
            `Привіт! 👋 Я використовую Bookit для онлайн-запису клієнтів — дуже зручно. Спробуй теж, за моїм посиланням обидва отримаємо місяць Pro безкоштовно 🎁\n\n${referralLink}`
          )}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-[#789A99]/30 text-[#789A99] text-xs font-semibold hover:bg-[#789A99]/8 transition-colors"
        >
          <Copy size={13} />
          Копіювати текст
        </button>
      </motion.div>
    </div>
  );
}
