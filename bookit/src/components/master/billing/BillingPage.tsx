'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Building2, Zap, Loader2, X, PartyPopper, CreditCard } from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { createBillingInvoice, createMonoInvoice } from '@/app/(master)/dashboard/billing/actions';

type PaymentProvider = 'wayforpay' | 'mono';

type Tier = 'starter' | 'pro' | 'studio';

const PLANS = [
  {
    key: 'starter' as Tier,
    name: 'Starter',
    price: '0',
    period: 'назавжди',
    icon: Zap,
    color: '#789A99',
    features: [
      'До 30 записів на місяць',
      'Публічна сторінка',
      'Онлайн-запис клієнтів',
      'Базова аналітика',
      'Водяний знак Bookit',
    ],
  },
  {
    key: 'pro' as Tier,
    name: 'Pro',
    price: '700',
    period: '/ місяць',
    icon: Crown,
    color: '#D4935A',
    popular: true,
    features: [
      'Необмежені записи',
      'Публічна сторінка без watermark',
      'Розширена аналітика за 6 місяців',
      'Топ-послуги та CRM',
      'Авто-нагадування клієнтам',
      'Кастомна тема оформлення',
      'CSV-експорт записів',
      'Пріоритетна підтримка',
    ],
  },
  {
    key: 'studio' as Tier,
    name: 'Studio',
    price: '299',
    period: '/ майстер/місяць',
    icon: Building2,
    color: '#5C9E7A',
    features: [
      'Все з Pro для кожного майстра',
      'Мін. 2 майстри',
      'Єдиний кабінет адміна',
      'Спільна аналітика по студії',
      'Кастомний брендинг',
    ],
  },
];

export function BillingPage() {
  const { masterProfile, refresh } = useMasterContext();
  const router = useRouter();
  const currentTier = (masterProfile?.subscription_tier ?? 'starter') as Tier;
  const searchParams = useSearchParams();

  const [payingTier, setPayingTier] = useState<Tier | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>('wayforpay');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Detect return from WayForPay or intended plan from landing
  useEffect(() => {
    if (searchParams.get('paid') === '1') {
      setShowSuccess(true);
      refresh();
      window.history.replaceState({}, '', '/dashboard/billing');
      return;
    }
    if (searchParams.get('plan')) {
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, [searchParams]);

  function handleUpgrade(tier: Tier) {
    setError(null);
    setPayingTier(tier);
    startTransition(async () => {
      try {
        const result = provider === 'mono'
          ? await createMonoInvoice(tier as 'pro' | 'studio')
          : await createBillingInvoice(tier as 'pro' | 'studio');
        if ('invoiceUrl' in result) {
          window.location.href = result.invoiceUrl;
        } else {
          setError(result.error);
          setPayingTier(null);
        }
      } catch {
        setError('Помилка з\'єднання. Спробуйте ще раз.');
        setPayingTier(null);
      }
    });
  }

  const isLoading = isPending;

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Тариф та оплата</h1>
        <p className="text-sm text-[#A8928D]">Керуйте підпискою та доступом до функцій</p>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bento-card p-4 flex items-center gap-3"
            style={{ borderColor: '#5C9E7A40', background: 'rgba(92,158,122,0.08)' }}
          >
            <div className="w-10 h-10 rounded-2xl bg-[#5C9E7A]/15 flex items-center justify-center flex-shrink-0">
              <PartyPopper size={18} className="text-[#5C9E7A]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#2C1A14]">Оплата успішна! 🎉</p>
              <p className="text-xs text-[#6B5750]">Ваш тариф оновлено. Всі функції вже активні.</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="text-[#A8928D] hover:text-[#6B5750]">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bento-card p-4 flex items-center gap-3"
            style={{ borderColor: '#C05B5B40', background: 'rgba(192,91,91,0.08)' }}
          >
            <p className="text-sm text-[#C05B5B] flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-[#A8928D]">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current plan */}
      <div className="bento-card p-4">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-2">Поточний тариф</p>
        <div className="flex items-center gap-3">
          {(() => {
            const plan = PLANS.find(p => p.key === currentTier);
            const PlanIcon = plan?.icon ?? Zap;
            return (
              <>
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: `${plan?.color ?? '#789A99'}18` }}
                >
                  <PlanIcon size={18} style={{ color: plan?.color ?? '#789A99' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#2C1A14]">
                    {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                  </p>
                  <p className="text-xs text-[#A8928D]">
                    {currentTier === 'starter'
                      ? 'Безкоштовний план'
                      : masterProfile?.subscription_expires_at
                        ? `Діє до ${new Date(masterProfile.subscription_expires_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}`
                        : 'Активна підписка'
                    }
                  </p>
                </div>
                <span
                  className="ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ color: plan?.color, background: `${plan?.color}15` }}
                >
                  Активний
                </span>
              </>
            );
          })()}
        </div>
      </div>

      {/* Payment provider toggle */}
      <div className="bento-card p-4">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-3">Спосіб оплати</p>
        <div className="flex gap-2">
          {([
            { key: 'wayforpay' as PaymentProvider, label: 'WayForPay', logo: '💳' },
            { key: 'mono' as PaymentProvider, label: 'Monobank', logo: '🍋' },
          ]).map(p => (
            <button
              key={p.key}
              onClick={() => setProvider(p.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-sm font-medium transition-all ${
                provider === p.key
                  ? 'bg-[#789A99]/12 border-[#789A99]/40 text-[#5C7E7D]'
                  : 'bg-white/60 border-white/80 text-[#6B5750] hover:bg-white/80'
              }`}
            >
              <span>{p.logo}</span>
              {p.label}
              {provider === p.key && <CreditCard size={13} className="text-[#789A99]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide px-1">Доступні плани</p>

      {PLANS.map((plan, i) => {
        const PlanIcon = plan.icon;
        const isCurrent = plan.key === currentTier;
        const isThisPaying = payingTier === plan.key && isLoading;

        return (
          <motion.div
            key={plan.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 24 }}
            className="bento-card p-5 relative overflow-hidden"
          >
            {plan.popular && !isCurrent && (
              <div
                className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: plan.color, background: `${plan.color}18` }}
              >
                Популярний
              </div>
            )}
            {isCurrent && (
              <div
                className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: plan.color, background: `${plan.color}18` }}
              >
                Ваш план
              </div>
            )}

            {/* Plan header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${plan.color}18` }}
              >
                <PlanIcon size={18} style={{ color: plan.color }} />
              </div>
              <div>
                <p className="text-base font-bold text-[#2C1A14]">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold" style={{ color: plan.color }}>
                    {plan.price === '0' ? 'Безкоштовно' : `${plan.price} ₴`}
                  </span>
                  {plan.price !== '0' && (
                    <span className="text-xs text-[#A8928D]">{plan.period}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-col gap-2 mb-4">
              {plan.features.map(f => (
                <div key={f} className="flex items-start gap-2">
                  <Check size={13} className="flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                  <span className="text-xs text-[#6B5750]">{f}</span>
                </div>
              ))}
            </div>

            {/* Studio breakeven hint */}
            {plan.key === 'studio' && (
              <div className="mb-4 px-3 py-2.5 rounded-2xl bg-[#5C9E7A]/8 border border-[#5C9E7A]/20">
                <p className="text-[11px] font-semibold text-[#2C1A14] mb-1.5">Коли Studio вигідніше Pro?</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-[#A8928D]">2 майстри</p>
                    <p className="text-xs font-bold text-[#5C9E7A]">598 ₴/міс</p>
                  </div>
                  <div className="text-[10px] text-[#A8928D]">vs</div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-[#A8928D]">2 × Pro</p>
                    <p className="text-xs font-bold text-[#D4935A]">1400 ₴/міс</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#6B5750] mt-1.5 leading-relaxed">
                  Якщо ти один — <span className="font-semibold">Pro за 700 ₴</span> вигідніше
                </p>
              </div>
            )}

            {/* CTA */}
            {isCurrent ? (
              <div
                className="w-full py-3 rounded-2xl text-center text-sm font-semibold"
                style={{ background: `${plan.color}12`, color: plan.color }}
              >
                Поточний план
              </div>
            ) : currentTier !== 'starter' && plan.key === 'starter' ? (
              <button
                className="w-full py-3 rounded-2xl text-sm font-semibold bg-white/70 border border-white/80 text-[#A8928D]"
                disabled
              >
                Дауноград недоступний
              </button>
            ) : (
              <button
                disabled={isLoading}
                onClick={() => handleUpgrade(plan.key)}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: plan.color, boxShadow: `0 4px 16px ${plan.color}40` }}
              >
                {isThisPaying ? (
                  <><Loader2 size={15} className="animate-spin" /> Перенаправлення...</>
                ) : (
                  `Перейти на ${plan.name}`
                )}
              </button>
            )}
          </motion.div>
        );
      })}

      {/* Referral promo */}
      <div className="bento-card p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#789A99]/12 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🎁</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2C1A14]">Запроси колегу — отримай місяць безкоштовно</p>
            <p className="text-xs text-[#A8928D] mt-0.5">За кожного зареєстрованого майстра за твоїм посиланням — 1 місяць Pro в подарунок</p>
            <button
              className="mt-2 text-xs font-semibold text-[#789A99] hover:text-[#5C7E7D] transition-colors"
              onClick={() => router.push('/dashboard/referral')}
            >
              Перейти до реферальної програми →
            </button>
          </div>
        </div>
      </div>

      {/* Payment info */}
      <p className="text-center text-xs text-[#A8928D] px-4">
        {provider === 'mono'
          ? 'Оплата через Monobank Acquiring — захищено SSL. Підписка активується автоматично.'
          : 'Оплата через WayForPay — захищено SSL. Підписка активується автоматично після оплати.'
        }
      </p>
    </div>
  );
}
