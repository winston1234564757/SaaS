'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Check, Gift, Users, Share2, Loader2,
  Crown, Zap, Lock, AlertCircle, Clock,
} from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { getOrGenerateReferralCode } from '@/lib/actions/referrals';
import { useMasterContext } from '@/lib/supabase/context';
import {
  calculateBillingDecision,
  computeLifetimeDiscount,
  getLifetimeTierProgress,
  MAX_REFS_COUNTED,
} from '@/lib/billing/pricing';

export interface ReferralHistoryItem {
  refereeId: string;
  refereeName: string;
  joinedAt: string;
  isFirstPaymentMade: boolean;
  bountyAppliedAt?: string | null;
}

interface Props {
  masterId: string;
  referralCode: string;
  referralCount: number;
  activeReferralCount: number;
  lifetimeDiscount: number;
  referralBountiesPending: number;
  discountReserve: number;
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
  history?: ReferralHistoryItem[];
  isDrawer?: boolean;
}

type Tab = 'overview' | 'history';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://bookit.com.ua');

export function ReferralPage({
  masterId,
  referralCode: initialCode,
  referralCount,
  activeReferralCount,
  lifetimeDiscount,
  referralBountiesPending,
  discountReserve,
  subscriptionTier,
  subscriptionExpiresAt,
  history = [],
  isDrawer,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [code, setCode]     = useState(initialCode);
  const [loading, setLoading] = useState(!initialCode);
  const [tab, setTab]       = useState<Tab>('overview');

  const { masterProfile } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('referral', 1, {
    initialSeen: seenTours?.referral ?? false,
    masterId: masterProfile?.id,
  });

  useEffect(() => {
    if (!initialCode) {
      (async () => {
        const res = await getOrGenerateReferralCode(masterId);
        if (res.success && res.code) setCode(res.code);
        setLoading(false);
      })();
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
          text: `Приєднуйся до Bookit за моїм посиланням і отримаєш 14 днів Pro безкоштовно 🎁`,
          url: referralLink,
        });
        return;
      } catch { /* fallback */ }
    }
    handleCopy();
  };

  const isPro       = subscriptionTier === 'pro' || subscriptionTier === 'studio';
  const trialLeft   = subscriptionExpiresAt
    ? Math.max(0, Math.ceil((new Date(subscriptionExpiresAt).getTime() - Date.now()) / 86_400_000))
    : null;

  // Billing decision: total = status + reserve (bounties already baked into reserve)
  const decision      = calculateBillingDecision({ activeRefsCount: activeReferralCount, discountReserve });
  const nextMonthUah  = decision.shouldGrantFree ? 0 : decision.finalKopecks / 100;
  const totalPct      = Math.round(decision.totalDiscount * 100);
  const lifetimePct   = Math.round(lifetimeDiscount * 100);
  const reservePct    = Math.round(discountReserve * 100);
  const newReservePct = Math.round(decision.newReserve * 100);
  const discountPct   = totalPct;

  // Lifetime tier progress
  const tierProgress  = getLifetimeTierProgress(activeReferralCount);
  const atHardCap     = activeReferralCount >= MAX_REFS_COUNTED;
  const currentLTDisc = computeLifetimeDiscount(activeReferralCount);

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      {!isDrawer && (
        <div className={cn(
          'relative bento-card p-5 transition-all duration-500 shadow-sm',
          currentStep === 0 && 'tour-glow z-40 scale-[1.02]'
        )}>
          <AnchoredTooltip
            isOpen={currentStep === 0}
            onClose={closeTour}
            title="Альянс майстрів"
            text="Запрошуйте колег та отримуйте знижки на підписку. Кожен перший платіж реферала — це одноразовий Bounty −10%."
            position="bottom"
            primaryButtonText="Зрозуміло"
            onPrimaryClick={nextStep}
          />
          <h1 className="heading-serif text-xl text-foreground mb-0.5">Реферальна програма</h1>
          <p className="text-sm text-muted-foreground/60">Запрошуй колег — отримуй знижки на Pro</p>
        </div>
      )}

      {/* Referral link */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-5 border-2 border-primary/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/12 flex items-center justify-center flex-shrink-0">
            <Gift size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Твоє реферальне посилання</p>
            <p className="text-xs text-muted-foreground/60">Запрошений отримує 14 днів Pro trial</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center rounded-2xl border border-[#E8D0C8] bg-white/60 overflow-hidden shadow-inner">
              <p className="flex-1 px-4 py-3 text-xs text-foreground truncate font-mono">
                {referralLink.replace(/https?:\/\//, '')}
              </p>
              <button
                onClick={handleCopy}
                className="px-4 py-3 text-primary hover:bg-primary/10 transition-colors flex-shrink-0 border-l border-[#E8D0C8] active:scale-95 transition-all"
              >
                {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              </button>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-[#E8D0C8] text-foreground text-sm font-semibold hover:bg-secondary active:scale-[0.98] transition-all"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Скопійовано!' : 'Копіювати'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-[#6a8988] active:scale-[0.98] transition-all shadow-lg shadow-[#789A99]/20"
              >
                <Share2 size={15} />
                Поділитись
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 280, damping: 24 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'Запрошено', value: referralCount,                  icon: <Users size={15} className="text-muted-foreground" /> },
          { label: 'Активних',  value: activeReferralCount,            icon: <Check size={15} className="text-success" /> },
          { label: 'Запас %',   value: `${reservePct}%`,              icon: <Zap size={15} className="text-warning" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bento-card p-4 flex flex-col items-center gap-1 shadow-sm">
            {icon}
            <p className="text-2xl font-bold text-foreground leading-none mt-1">{value}</p>
            <p className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider text-center pt-0.5">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 p-1 bg-secondary/60 rounded-2xl"
      >
        {(['overview', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
              tab === t
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
            )}
          >
            {t === 'overview' ? 'Огляд' : `Історія${history.length > 0 ? ` (${history.length})` : ''}`}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* ── DISCOUNT BANK block ── */}
            <div className={cn(
              'bento-card p-5 border',
              reservePct > 0
                ? 'bg-warning/5 border-warning/25'
                : 'border-[#E8D0C8]'
            )}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  reservePct > 0 ? 'bg-warning/15' : 'bg-[#E8D0C8]/60'
                )}>
                  <Zap size={16} className={reservePct > 0 ? 'text-warning' : 'text-[#C8B0A8]'} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Банк знижок</p>
                  <p className="text-xs text-muted-foreground/60">Bounties (+10% за першу оплату партнера) + залишок з минулого місяця</p>
                </div>
              </div>

              {reservePct > 0 ? (
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <p className="text-2xl font-bold text-warning">−{reservePct}%</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Накопичено у вашому резерві
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-lg flex-shrink-0">
                    🏦
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/60">
                  Резерв порожній. Запрошуй майстрів — кожен перший платіж реферала додає +10% до банку.
                </p>
              )}
            </div>

            {/* ── LIFETIME STATUS block ── */}
            <div className="bento-card p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  currentLTDisc > 0 ? 'bg-primary/15' : 'bg-[#E8D0C8]/60'
                )}>
                  <Crown size={16} className={currentLTDisc > 0 ? 'text-primary' : 'text-[#C8B0A8]'} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Твій постійний статус</p>
                  <p className="text-xs text-muted-foreground/60">Залежить від кількості активних партнерів</p>
                </div>
              </div>

              {currentLTDisc > 0 && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">−{lifetimePct}%</span>
                  <span className="text-xs text-muted-foreground/60">постійно за {activeReferralCount} активних</span>
                </div>
              )}

              {atHardCap ? (
                <div className="flex items-center gap-2 text-sm text-success font-semibold">
                  <Check size={15} />
                  Максимальний статус — −50% назавжди
                </div>
              ) : tierProgress ? (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground/60 mb-2">
                    <span>
                      {activeReferralCount} / {tierProgress.nextTierRefs} —{' '}
                      ще {tierProgress.refsNeeded}{' '}
                      {pluralUk(tierProgress.refsNeeded, 'партнер', 'партнери', 'партнерів')}{' '}
                      до{' '}
                      <span className="font-semibold text-foreground">
                        −{Math.round(tierProgress.nextDiscount * 100)}% постійно
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#E8D0C8]/50 rounded-full overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${tierProgress.progressPct}%` }}
                      transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-[#789A99] to-[#8FB5B4] rounded-full"
                    />
                  </div>
                </>
              ) : null}

              {/* Tier chips */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { refs: 5,  pct: '5%'  },
                  { refs: 10, pct: '10%' },
                  { refs: 25, pct: '25%' },
                  { refs: 50, pct: '50%' },
                ].map((tier) => {
                  const reached = activeReferralCount >= tier.refs;
                  return (
                    <div
                      key={tier.refs}
                      className={cn(
                        'flex flex-col items-center gap-0.5 p-2 rounded-xl border text-center transition-colors',
                        reached
                          ? 'border-primary/35 bg-primary/8'
                          : 'border-[#E8D0C8] bg-white/40'
                      )}
                    >
                      {reached
                        ? <Check size={11} className="text-primary" />
                        : <Lock  size={11} className="text-[#C8B0A8]" />
                      }
                      <p className={cn(
                        'text-[10px] font-bold leading-tight',
                        reached ? 'text-primary' : 'text-muted-foreground/60'
                      )}>
                        {tier.pct}
                      </p>
                      <p className="text-[9px] text-[#C8B0A8]">{tier.refs} реф.</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Next invoice preview (Pro users) ── */}
            {isPro && (
              decision.shouldGrantFree ? (
                /* Branch A — free month */
                <div className="bento-card p-5 bg-success/8 border-2 border-success/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎉</span>
                    <p className="text-sm font-bold text-success">Наступний місяць безкоштовний!</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Загальна знижка {totalPct}% ≥ 100% — Monobank не списуватиме.
                    Підписка продовжується автоматично.
                  </p>
                  {newReservePct > 0 && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-success/20">
                      <span className="text-muted-foreground/60">Залишок буде збережено у запасі</span>
                      <span className="font-bold text-primary">+{newReservePct}%</span>
                    </div>
                  )}
                  {/* Breakdown */}
                  <div className="mt-3 flex flex-col gap-1 pt-2 border-t border-success/15">
                    {lifetimePct > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground/60">Статус Альянсу</span>
                        <span className="text-primary font-semibold">+{lifetimePct}%</span>
                      </div>
                    )}
                    {reservePct > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground/60">Банк знижок (bounties + залишок)</span>
                        <span className="text-warning font-semibold">+{reservePct}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Branch B — discounted invoice */
                <div className={cn(
                  'bento-card p-5 border',
                  discountPct > 0 ? 'bg-success/5 border-success/20' : 'border-[#E8D0C8]'
                )}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 opacity-60">
                    Наступний платіж
                  </p>

                  {/* Free month progress bar */}
                  {discountPct > 0 && discountPct < 100 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground/60 mb-1">
                        <span>До безкоштовного місяця</span>
                        <span className="font-semibold text-foreground">{discountPct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#E8D0C8]/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${discountPct}%` }}
                          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-[#789A99] to-[#5C9E7A] rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-2 mb-2">
                    <p className="text-3xl font-bold text-foreground">{nextMonthUah} ₴</p>
                    {discountPct > 0 && (
                      <>
                        <p className="text-sm text-muted-foreground/60 line-through mb-1">700 ₴</p>
                        <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full mb-1">
                          -{discountPct}%
                        </span>
                      </>
                    )}
                  </div>
                  {discountPct > 0 && (
                    <div className="flex flex-col gap-1 pt-2 border-t border-[#E8D0C8]/60">
                      {lifetimePct > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground/60">Статус Альянсу</span>
                          <span className="text-primary font-semibold">−{lifetimePct}%</span>
                        </div>
                      )}
                      {reservePct > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground/60">Банк знижок (bounties + залишок)</span>
                          <span className="text-warning font-semibold">−{reservePct}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            )}

            {/* Trial countdown */}
            {isPro && trialLeft !== null && trialLeft > 0 && (
              <div className="bento-card p-4 flex items-center gap-3 border border-warning/20 bg-warning/5">
                <Clock size={16} className="text-warning flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Pro trial: залишилось{' '}
                  <span className="font-semibold text-foreground">
                    {pluralUk(trialLeft, 'день', 'дні', 'днів')}
                  </span>
                </p>
              </div>
            )}

            {/* Hard cap notice */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground/60 px-1">
              <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
              <span>
                Максимум {MAX_REFS_COUNTED} рефералів зараховується для Lifetime Status.
                Якщо партнер перестає платити — він більше не рахується.
              </span>
            </div>
          </motion.div>
        ) : (
          /* ── HISTORY TAB ── */
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {history.length === 0 ? (
              <div className="bento-card p-8 flex flex-col items-center gap-3 text-center">
                <Users size={32} className="text-[#E8D0C8]" />
                <p className="text-sm font-semibold text-muted-foreground">Ще нікого немає</p>
                <p className="text-xs text-muted-foreground/60">
                  Поділись посиланням з колегами — тут з'явиться список тих, хто приєднався
                </p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.refereeId}
                  className="bento-card p-4 flex items-center gap-3"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                    item.isFirstPaymentMade ? 'bg-success/12' : 'bg-[#E8D0C8]/60'
                  )}>
                    {item.isFirstPaymentMade
                      ? <Zap size={15} className="text-success" />
                      : <Clock size={15} className="text-[#C8B0A8]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.refereeName}</p>
                    <p className="text-xs text-muted-foreground/60">
                      Приєднався {new Date(item.joinedAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {item.isFirstPaymentMade ? (
                      <span className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                        Bounty нараховано
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 bg-secondary/80 px-2 py-0.5 rounded-full">
                        Trial
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
