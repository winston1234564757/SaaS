'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Crown, Building2, Zap, Loader2, X, PartyPopper,
  Gift, Lock, ShieldCheck, CreditCard, CalendarClock, ArrowRight,
} from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { createMonoInvoice, recoverCardToken, cancelSubscription, submitBetaRequest } from '@/app/(master)/dashboard/billing/actions';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/utils/cn';

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
      'До 40 записів на місяць',
      'Публічна сторінка',
      'Telegram-сповіщення',
      'Нагадування клієнтам',
      'Базова аналітика',
      'CRM клієнтів',
      'Флеш-акції (до 5 на місяць)',
      'Розсилки (до 3 на місяць)',
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
      'Сторінка без брендингу Bookit',
      'Smart Slots + флеш-акції без ліміту',
      'Програма лояльності',
      'Магазин товарів',
      'Розширена аналітика (6 місяців)',
      'CSV-експорт',
      'Кастомна тема оформлення',
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
    wip: true,
    features: [
      'Все з Pro для кожного майстра',
      'Мін. 2 майстри',
      'Єдиний кабінет адміна',
      'Спільна аналітика по студії',
      'Кастомний брендинг',
    ],
  },
] as const;

const STUDIO_SIZES = [
  { key: '1',   label: '1 майстер' },
  { key: '2-5', label: '2–5 майстрів' },
  { key: '5+',  label: '5+ майстрів' },
] as const;

const SLATE = '#0F172A';

/** Повний перелік можливостей Pro для героя (детально, не скорочено) */
const PRO_FEATURES = [
  'Необмежені записи',
  'Сторінка без брендингу Bookit',
  'Smart Slots + флеш-акції без ліміту',
  'Програма лояльності',
  'Магазин товарів',
  'Розширена аналітика (6 місяців)',
  'CSV-експорт',
  'Кастомна тема оформлення',
  'Пріоритетна підтримка',
] as const;

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
}

/** Офіційний monobank-логотип (SVG), інвертований у біле для чорної панелі */
function MonoWordmark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/monobank-logo.svg"
      alt="Monobank"
      className="h-5 w-auto [filter:brightness(0)_invert(1)] select-none"
    />
  );
}

export function BillingPage() {
  const { masterProfile, subscription, refresh, profile } = useMasterContext();
  const router = useRouter();
  const currentTier = (masterProfile?.subscription_tier ?? 'starter') as Tier;
  const searchParams = useSearchParams();

  const [payingTier, setPayingTier] = useState<Tier | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Beta request form state
  const [showBetaSheet, setShowBetaSheet] = useState(false);
  const [betaName, setBetaName] = useState('');
  const [betaContact, setBetaContact] = useState('');
  const [betaSize, setBetaSize] = useState<'1' | '2-5' | '5+'>('2-5');
  const [betaSubmitting, setBetaSubmitting] = useState(false);
  const [betaSubmitted, setBetaSubmitted] = useState(false);

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

  useEffect(() => {
    if (currentTier !== 'starter') {
      recoverCardToken().then(result => {
        if ('error' in result) {
          console.warn('[BillingPage] recoverCardToken error:', result.error);
        } else if ('ok' in result && result.found) {
          refresh();
        }
      });
    }
  }, [currentTier, refresh]);

  // Pre-fill contact from profile phone
  useEffect(() => {
    if (profile?.phone) setBetaContact(prev => prev || profile.phone!);
  }, [profile?.phone]);

  function handleUpgrade(tier: Tier) {
    setError(null);
    setPayingTier(tier);
    startTransition(async () => {
      try {
        const result = await createMonoInvoice(tier as 'pro' | 'studio');
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

  async function handleBetaSubmit() {
    if (!betaName.trim() || !betaContact.trim()) return;
    setBetaSubmitting(true);
    setError(null);
    try {
      const result = await submitBetaRequest({
        name: betaName.trim(),
        contact: betaContact.trim(),
        studio_size: betaSize,
      });
      if ('error' in result) {
        setError(result.error);
      } else {
        setBetaSubmitted(true);
      }
    } catch {
      setError('Помилка надсилання. Спробуйте ще раз.');
    } finally {
      setBetaSubmitting(false);
    }
  }

  async function handleCancelSubscription() {
    setIsCanceling(true);
    setError(null);
    try {
      const result = await cancelSubscription();
      if ('error' in result) {
        setError(result.error);
      } else {
        await refresh();
        setShowCancelModal(false);
      }
    } catch {
      setError('Не вдалося скасувати підписку. Спробуйте пізніше.');
    } finally {
      setIsCanceling(false);
    }
  }

  const isLoading = isPending || isCanceling;

  // ── Стан підписки ──────────────────────────────────────────────────────────
  const isManaged = currentTier === 'pro' || currentTier === 'studio';
  const heroPlan = isManaged
    ? PLANS.find(p => p.key === currentTier)!
    : PLANS.find(p => p.key === 'pro')!;
  const otherPlans = PLANS.filter(p => p.key !== heroPlan.key);

  const subActive = subscription?.status === 'active';
  const subCanceled = subscription?.status === 'canceled';
  const noCard = isManaged && !subscription;
  const hasCard = !!subscription?.token;
  const expiresLabel = formatDate(masterProfile?.subscription_expires_at);
  const payingPro = payingTier === 'pro' && isLoading;

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Success banner */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bento-card p-4 flex items-center gap-3 border border-success/30 bg-success/8"
          >
            <div className="size-10 rounded-2xl bg-success/15 flex items-center justify-center flex-shrink-0">
              <PartyPopper size={18} className="text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Оплата успішна</p>
              <p className="text-xs text-text-sub">Тариф оновлено. Усі функції вже активні.</p>
            </div>
            <button type="button" onClick={() => setShowSuccess(false)} aria-label="Закрити" className="text-text-sub hover:text-foreground">
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
            className="bento-card p-4 flex items-center gap-3 border border-destructive/30 bg-destructive/8"
          >
            <p className="text-sm text-destructive flex-1">{error}</p>
            <button type="button" onClick={() => setError(null)} aria-label="Закрити" className="text-text-sub">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Верхній ряд: герой (state-aware) + Monobank-панель ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ГЕРОЙ */}
        <section
          className="lg:col-span-8 relative overflow-hidden rounded-[var(--card-radius)]"
          style={{ background: SLATE, boxShadow: 'var(--hero-card-shadow)' }}
          aria-label={isManaged ? 'Твоя підписка' : 'Тариф Pro'}
        >
          {/* Аврора-підсвітка */}
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full blur-3xl" style={{ background: 'rgba(99,102,241,0.28)' }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full blur-3xl" style={{ background: 'rgba(139,92,246,0.18)' }} />

          <div className="relative z-10 p-6 md:p-8 flex flex-col min-h-full">
            {isManaged ? (
              /* ── Керування підпискою ── */
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex size-8 items-center justify-center rounded-xl bg-white/12">
                    <Crown size={16} className="text-white" />
                  </span>
                  <span className="text-[13px] font-medium text-white/60">Твоя підписка</span>
                </div>

                <h1 className="heading-serif text-4xl md:text-5xl text-white leading-none mb-3">
                  {heroPlan.name} активний
                </h1>

                <div className="flex items-center gap-2 text-white/70 mb-6">
                  <CalendarClock size={15} className="text-white/55" />
                  <p className="text-sm">
                    {noCard
                      ? `Діє до ${expiresLabel}`
                      : subCanceled
                        ? `Діє до ${expiresLabel}, автопродовження вимкнено`
                        : `Наступне списання ${expiresLabel}`}
                  </p>
                </div>

                {/* Статус картки (за наявністю токена — не дублює рядок автопродовження) */}
                <div className="flex items-center gap-2 mb-auto">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                      hasCard ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-white/70',
                    )}
                  >
                    <CreditCard size={12} />
                    {hasCard ? 'Картку прив’язано' : 'Картку не прив’язано'}
                  </span>
                </div>

                {/* Дії */}
                <div className="mt-6">
                  {subActive ? (
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="text-sm font-medium text-white/70 hover:text-white transition-colors underline underline-offset-4 decoration-white/30"
                    >
                      Скасувати підписку
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleUpgrade('pro')}
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-[#0F172A] text-sm font-semibold shadow-lg shadow-black/20 transition-all active:scale-[0.98] disabled:opacity-70 inline-flex items-center justify-center gap-2"
                    >
                      {payingPro ? (
                        <><Loader2 size={15} className="animate-spin" /> Перенаправлення...</>
                      ) : noCard ? (
                        'Прив’язати картку'
                      ) : (
                        'Відновити підписку'
                      )}
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* ── Офер Pro (Starter) ── */
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex size-8 items-center justify-center rounded-xl bg-white/12">
                    <Crown size={16} className="text-white" />
                  </span>
                  <span className="text-[13px] font-medium text-white/60">Тариф Pro</span>
                </div>

                <div className="flex items-end gap-2.5 flex-wrap mb-1">
                  <span className="heading-serif leading-[0.9] text-[clamp(3rem,7vw,4.5rem)] text-white tracking-tight">700</span>
                  <span className="text-2xl md:text-3xl font-medium text-white/70 mb-1.5">₴</span>
                  <span className="text-sm text-white/55 mb-2.5">/ місяць</span>
                </div>
                <p className="heading-serif text-lg text-white/85 leading-snug mb-6 max-w-[34ch]">
                  Усе, що перетворює твою сторінку на бізнес.
                </p>

                {/* Повний перелік можливостей Pro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mb-7">
                  {PRO_FEATURES.map(f => (
                    <div key={f} className="flex items-start gap-2">
                      <Check size={15} className="flex-shrink-0 mt-0.5 text-emerald-300" strokeWidth={2.5} />
                      <span className="text-sm text-white/85 leading-snug">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA + trust */}
                <div className="mt-auto">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleUpgrade('pro')}
                    className="w-full py-3.5 rounded-full bg-white text-[#0F172A] text-sm font-semibold shadow-lg shadow-black/20 transition-all active:scale-[0.98] disabled:opacity-70 inline-flex items-center justify-center gap-2"
                  >
                    {payingPro ? (
                      <><Loader2 size={15} className="animate-spin" /> Перенаправлення...</>
                    ) : (
                      <>Перейти на Pro <ArrowRight size={15} /></>
                    )}
                  </button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/50">
                    <Lock size={11} /> Оплата захищена через Monobank
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* MONOBANK-панель (інфо, неінтерактивна) */}
        <aside
          className="lg:col-span-4 relative overflow-hidden rounded-[var(--card-radius)] border border-white/10"
          style={{ background: '#0A0A0A' }}
          aria-label="Спосіб оплати"
        >
          {/* Тиха бренд-мітка картки — заповнює простір ідентичністю, не дірою */}
          <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-6 w-52 h-32 rounded-2xl border border-white/[0.07] rotate-[-8deg]">
            <div className="absolute top-4 left-4 w-7 h-5 rounded-md bg-white/[0.06]" />
          </div>

          <div className="relative z-10 p-6 md:p-7 flex flex-col h-full">
            <div className="flex items-center justify-between gap-2">
              <MonoWordmark />
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white/8">
                <CreditCard size={16} className="text-white/85" />
              </span>
            </div>

            {/* Список довіри — оптичний центр панелі */}
            <div className="flex-1 flex flex-col justify-center py-6">
              <p className="text-[13px] font-medium text-white/50 mb-4">Оплата через Monobank</p>
              <ul className="flex flex-col gap-3.5">
                {[
                  { icon: ShieldCheck, text: 'Захищено SSL-шифруванням' },
                  { icon: CreditCard,  text: 'Картка зберігається у Monobank' },
                  { icon: CalendarClock, text: 'Керуй підпискою будь-коли' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5">
                    <Icon size={15} className="flex-shrink-0 text-white/45" />
                    <span className="text-[13px] text-white/75">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Плани: тихі диференційовані рядки ── */}
      <div className="bento-card p-2 sm:p-3">
        <p className="text-xs font-semibold text-text-sub uppercase tracking-wide px-3 pt-2 pb-1">
          {isManaged ? 'Інші тарифи' : 'Порівняти тарифи'}
        </p>
        <div className="divide-y divide-border">
          {otherPlans.map(plan => {
            const PlanIcon = plan.icon;
            const isCurrent = plan.key === currentTier;
            const isWip = 'wip' in plan && plan.wip === true;
            return (
              <div key={plan.key} className="flex items-center gap-3 px-3 py-3.5">
                <span
                  className="inline-flex size-10 items-center justify-center rounded-2xl flex-shrink-0"
                  style={{ background: `${plan.color}18` }}
                >
                  <PlanIcon size={18} style={{ color: plan.color }} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-tight">{plan.name}</p>
                  <p className="text-xs text-text-sub mt-0.5">
                    {plan.price === '0'
                      ? '0 ₴ назавжди'
                      : plan.key === 'studio'
                        ? '299 ₴ за майстра'
                        : `${plan.price} ₴ / місяць`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isCurrent ? (
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ color: plan.color, background: `${plan.color}18` }}
                    >
                      Ваш план
                    </span>
                  ) : isWip ? (
                    <>
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{ color: plan.color, background: `${plan.color}18` }}
                      >
                        Скоро
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowBetaSheet(true)}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Хочу в бету
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referral promo */}
      <div className="bento-card p-4">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-2xl bg-primary/12 flex items-center justify-center flex-shrink-0">
            <Gift size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Запроси колегу — отримай місяць безкоштовно</p>
            <p className="text-xs text-text-sub mt-0.5">За кожного зареєстрованого майстра за твоїм посиланням — 1 місяць Pro в подарунок</p>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-all active:scale-[0.95]"
              onClick={() => router.push('/dashboard/referral')}
            >
              Перейти до реферальної програми →
            </button>
          </div>
        </div>
      </div>

      {/* Payment info + legal consent */}
      <div className="flex flex-col items-center gap-1.5 px-4">
        <p className="text-center text-xs text-text-sub">
          Оплата через Monobank Acquiring, захищено SSL. Підписка активується автоматично.
        </p>
        <p className="text-center text-xs text-text-sub">
          Здійснюючи оплату, ви погоджуєтесь з умовами{' '}
          <a href="/legal/public-offer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Публічної оферти
          </a>{' '}
          та{' '}
          <a href="/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Правил повернення коштів
          </a>
          .
        </p>
      </div>

      {/* Cancel subscription modal */}
      <Sheet
        open={showCancelModal}
        onOpenChange={(v) => !v && !isCanceling && setShowCancelModal(false)}
        title="Скасувати підписку?"
      >
        <div className="p-6">
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Ви зможете користуватися перевагами тарифу <span className="font-semibold text-foreground">{heroPlan.name}</span> до кінця поточного періоду, але наступних автоматичних списань не буде.
          </p>

          <div className="flex flex-col gap-3">
            <button type="button"
              disabled={isCanceling}
              onClick={handleCancelSubscription}
              className="w-full py-3.5 rounded-2xl bg-destructive text-white text-sm font-semibold shadow-lg shadow-destructive/20 active:scale-[0.95] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCanceling ? (
                <><Loader2 size={16} className="animate-spin" /> Скасування...</>
              ) : (
                'Так, скасувати підписку'
              )}
            </button>
            <button type="button"
              disabled={isCanceling}
              onClick={() => setShowCancelModal(false)}
              className="w-full py-3.5 rounded-2xl bg-secondary text-muted-foreground text-sm font-semibold active:scale-[0.95] transition-all"
            >
              Залишити як є
            </button>
          </div>
        </div>
      </Sheet>

      {/* Beta request sheet */}
      <Sheet
        open={showBetaSheet}
        onOpenChange={(v) => { if (!v && !betaSubmitting) { setShowBetaSheet(false); if (betaSubmitted) setBetaSubmitted(false); } }}
        title="Заявка на Studio Beta"
      >
        <div className="p-6">
          {betaSubmitted ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="size-16 rounded-3xl bg-success/15 flex items-center justify-center">
                <Check size={28} className="text-success" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Заявку отримано</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Ми повідомимо вас, коли Studio відкриється для бета-тесту
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowBetaSheet(false); setBetaSubmitted(false); }}
                className="w-full py-3.5 rounded-2xl bg-secondary text-muted-foreground text-sm font-semibold active:scale-[0.95] transition-all"
              >
                Закрити
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Studio ще в розробці — залиште контакт, і ми повідомимо вас першими, як тільки відкриємо бета-тест.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Ім'я або назва студії
                </label>
                <input
                  type="text"
                  value={betaName}
                  onChange={(e) => setBetaName(e.target.value)}
                  placeholder="Студія Краси або Марія Іваненко"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary/60 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={betaContact}
                  onChange={(e) => setBetaContact(e.target.value)}
                  placeholder="+380 XX XXX XXXX"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary/60 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Майстрів у студії
                </label>
                <div className="flex gap-2">
                  {STUDIO_SIZES.map(({ key, label }) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setBetaSize(key)}
                      className={`flex-1 py-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                        betaSize === key
                          ? 'bg-primary/12 border-primary/40 text-primary/90'
                          : 'bg-secondary/60 border-border text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={!betaName.trim() || !betaContact.trim() || betaSubmitting}
                onClick={handleBetaSubmit}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#5C9E7A', boxShadow: '0 4px 16px rgba(92,158,122,0.35)' }}
              >
                {betaSubmitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Надсилання...</>
                ) : (
                  'Надіслати заявку'
                )}
              </button>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
