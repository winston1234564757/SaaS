'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { Check, Loader2, X } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';
import { submitBetaRequest } from '@/app/(master)/dashboard/billing/actions';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  accent: boolean;
  waitlist?: boolean;
};

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '0',
    period: 'назавжди',
    description: 'Для старту. Без обмежень по часу.',
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
    cta: 'Почати безкоштовно',
    accent: false,
  },
  {
    name: 'Pro',
    price: '700',
    period: 'місяць',
    description: 'Для майстра, який хоче більше.',
    features: [
      'Необмежені записи',
      'Публічна сторінка без брендингу Bookit',
      'Smart Slots + флеш-акції без ліміту',
      'Авто Flash Deal при скасуванні',
      'Програма лояльності для клієнтів',
      'Сторіс та портфоліо',
      'Магазин товарів',
      'QR-код для запису',
      'Розширена аналітика (6 місяців)',
      'Розсилки без ліміту',
      'CSV-експорт клієнтської бази',
      'Кастомна тема оформлення',
      'Пріоритетна підтримка',
    ],
    cta: 'Спробувати Pro',
    accent: true,
  },
  {
    name: 'Studio',
    price: '',
    period: '',
    description: 'Для студій від 2 майстрів. Спільна аналітика та управління командою.',
    features: [
      'Все з Pro для кожного майстра',
      'Управління командою',
      'Загальна аналітика студії',
      'Власний брендинг',
      'Виділений менеджер',
    ],
    cta: 'Залишити заявку',
    accent: false,
    waitlist: true,
  },
];

export function LandingPricing() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const router = useRouter();

  const [showBetaForm, setShowBetaForm] = useState(false);
  const [betaName, setBetaName] = useState('');
  const [betaContact, setBetaContact] = useState('');
  const [betaSize, setBetaSize] = useState<'1' | '2-5' | '5+'>('1');
  const [betaDone, setBetaDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], ['0%', '-4%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  function handleBetaSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await submitBetaRequest({ name: betaName, contact: betaContact, studio_size: betaSize });
      setBetaDone(true);
    });
  }

  return (
    <>
      <section
        id="pricing"
        ref={ref}
        className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12"
        style={{ background: 'var(--l-bg-alt)' }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" style={{ y: headingY }}>
            <motion.span
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ ...spring, delay: 0.05 }}
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] mb-5"
              style={{ color: 'var(--l-indigo)' }}
            >
              Тарифи
            </motion.span>
            <LandingSplitHeading
              text="Оберіть свій план."
              className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.95] tracking-tight"
              style={{ fontSize: 'clamp(2.2rem,4.5vw,3.8rem)', color: 'var(--l-ink)' }}
              stagger={80}
            />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 32, scale: 0.97 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.9, ease: easeOut, delay: 0.12 + i * 0.1 }}
                className={plan.accent ? 'md:-mt-4 md:mb-4' : ''}
              >
                <div
                  className="p-1.5 rounded-[1.75rem] h-full"
                  style={{
                    background: plan.accent
                      ? 'var(--l-accent)'
                      : plan.waitlist
                      ? 'rgba(92,158,122,0.04)'
                      : 'rgba(26,23,16,0.03)',
                    border: `1px solid ${plan.accent ? 'var(--l-accent)' : plan.waitlist ? 'rgba(92,158,122,0.18)' : 'var(--l-border)'}`,
                    boxShadow: plan.accent ? '0 24px 64px rgba(99,102,241,0.28)' : 'none',
                  }}
                >
                  <div
                    className="rounded-[calc(1.75rem-0.375rem)] p-8 h-full flex flex-col"
                    style={{
                      background: plan.accent ? 'var(--l-accent)' : 'var(--l-surface)',
                      boxShadow: plan.accent ? 'none' : 'inset 0 1px 1px rgba(255,255,255,0.9)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <p
                        className="text-[11px] font-semibold uppercase tracking-widest"
                        style={{
                          color: plan.accent
                            ? 'color-mix(in srgb, var(--l-text-on-dark) 60%, transparent)'
                            : plan.waitlist
                            ? 'rgba(92,158,122,0.7)'
                            : 'var(--l-muted-2)',
                        }}
                      >
                        {plan.name}
                      </p>
                      {plan.waitlist && (
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: '#2D6A4A', background: 'rgba(92,158,122,0.14)' }}
                        >
                          Скоро
                        </span>
                      )}
                    </div>

                    {plan.waitlist ? (
                      <p
                        className="font-[family-name:var(--font-cormorant)] font-semibold leading-none mb-4"
                        style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: 'var(--l-muted)' }}
                      >
                        В розробці
                      </p>
                    ) : (
                      <>
                        <div className="mb-2">
                          <span
                            className="font-[family-name:var(--font-cormorant)] font-semibold leading-none"
                            style={{
                              fontSize: 'clamp(2.5rem,5vw,3.5rem)',
                              color: plan.accent ? 'var(--l-text-on-dark)' : 'var(--l-ink)',
                            }}
                          >
                            {plan.price === '0' ? 'Безкоштовно' : `₴${plan.price}`}
                          </span>
                        </div>
                        <p
                          className="text-sm mb-2"
                          style={{ color: plan.accent ? 'var(--l-muted-on-dark)' : 'var(--l-muted-2)' }}
                        >
                          {plan.period}
                        </p>
                      </>
                    )}

                    <p
                      className="text-sm leading-relaxed mb-8"
                      style={{
                        color: plan.accent
                          ? 'color-mix(in srgb, var(--l-text-on-dark) 75%, transparent)'
                          : 'var(--l-muted)',
                      }}
                    >
                      {plan.description}
                    </p>

                    <ul className="flex flex-col gap-3 flex-1 mb-8">
                      {plan.features.map((f, fi) => (
                        <motion.li
                          key={fi}
                          initial={{ opacity: 0, x: -8 }}
                          animate={inView ? { opacity: 1, x: 0 } : {}}
                          transition={{ duration: 0.7, ease: easeOut, delay: 0.32 + i * 0.1 + fi * 0.055 }}
                          className="flex items-start gap-3"
                        >
                          <div
                            className="size-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              background: plan.accent
                                ? 'color-mix(in srgb, var(--l-text-on-dark) 18%, transparent)'
                                : plan.waitlist
                                ? 'rgba(92,158,122,0.08)'
                                : 'color-mix(in srgb, var(--l-indigo-glow) 10%, transparent)',
                            }}
                            aria-hidden="true"
                          >
                            <Check
                              size={11}
                              style={{
                                color: plan.accent
                                  ? 'var(--l-text-on-dark)'
                                  : plan.waitlist
                                  ? 'rgba(92,158,122,0.45)'
                                  : 'var(--l-accent)',
                              }}
                            />
                          </div>
                          <span
                            className="text-sm leading-snug"
                            style={{
                              color: plan.accent
                                ? 'rgba(255,255,255,0.85)'
                                : plan.waitlist
                                ? 'var(--l-muted)'
                                : 'var(--l-ink-2)',
                            }}
                          >
                            {f}
                          </span>
                        </motion.li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => plan.waitlist ? setShowBetaForm(true) : router.push('/register')}
                      className="w-full h-12 rounded-full font-semibold text-sm transition-all active:scale-[0.97]"
                      style={
                        plan.accent
                          ? {
                              background: 'var(--l-surface)',
                              color: 'var(--l-accent)',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                            }
                          : plan.waitlist
                          ? {
                              background: 'rgba(92,158,122,0.10)',
                              color: '#2D6A4A',
                              border: '1.5px solid rgba(92,158,122,0.22)',
                            }
                          : {
                              background: 'transparent',
                              color: 'var(--l-ink)',
                              border: '1.5px solid var(--l-border-2)',
                            }
                      }
                    >
                      {plan.cta}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ ...spring, delay: 0.62 }}
            className="text-center text-sm mt-8"
            style={{ color: 'var(--l-muted)' }}
          >
            Всі тарифи без прихованих комісій. Змінити або скасувати — в два кліки.
          </motion.p>
        </div>
      </section>

      {showBetaForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(26,23,16,0.48)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowBetaForm(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring }}
            className="w-full max-w-md rounded-[1.75rem] p-8 relative"
            style={{ background: 'var(--l-surface)', border: '1px solid var(--l-border)', boxShadow: '0 32px 80px rgba(26,23,16,0.14)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowBetaForm(false)}
              className="absolute top-5 right-5 size-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(26,23,16,0.06)' }}
              aria-label="Закрити"
            >
              <X size={14} style={{ color: 'var(--l-muted)' }} />
            </button>

            {betaDone ? (
              <div className="text-center py-8">
                <div
                  className="size-14 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{ background: 'rgba(92,158,122,0.12)' }}
                >
                  <Check size={24} style={{ color: '#2D6A4A' }} />
                </div>
                <p
                  className="font-[family-name:var(--font-cormorant)] font-semibold text-2xl mb-2"
                  style={{ color: 'var(--l-ink)' }}
                >
                  Заявку отримано
                </p>
                <p className="text-sm" style={{ color: 'var(--l-muted)' }}>
                  Ми напишемо першими, коли Studio запуститься
                </p>
              </div>
            ) : (
              <>
                <p
                  className="font-[family-name:var(--font-cormorant)] font-semibold text-2xl mb-1"
                  style={{ color: 'var(--l-ink)' }}
                >
                  Studio · Рання заявка
                </p>
                <p className="text-sm mb-8" style={{ color: 'var(--l-muted)' }}>
                  Залишіть контакт — ми повідомимо про старт першими
                </p>

                <form onSubmit={handleBetaSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--l-muted-2)' }}
                    >
                      Ваше ім'я або назва студії
                    </label>
                    <input
                      type="text"
                      value={betaName}
                      onChange={(e) => setBetaName(e.target.value)}
                      required
                      placeholder="Glow Studio"
                      className="h-11 rounded-xl px-4 text-sm outline-none transition-colors"
                      style={{
                        background: 'rgba(26,23,16,0.04)',
                        border: '1px solid var(--l-border)',
                        color: 'var(--l-ink)',
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--l-muted-2)' }}
                    >
                      Telegram або телефон
                    </label>
                    <input
                      type="text"
                      value={betaContact}
                      onChange={(e) => setBetaContact(e.target.value)}
                      required
                      placeholder="@username або +380..."
                      className="h-11 rounded-xl px-4 text-sm outline-none transition-colors"
                      style={{
                        background: 'rgba(26,23,16,0.04)',
                        border: '1px solid var(--l-border)',
                        color: 'var(--l-ink)',
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--l-muted-2)' }}
                    >
                      Скільки майстрів?
                    </label>
                    <div className="flex gap-2">
                      {(['1', '2-5', '5+'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setBetaSize(s)}
                          className="flex-1 h-10 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: betaSize === s ? 'rgba(92,158,122,0.12)' : 'rgba(26,23,16,0.04)',
                            border: `1.5px solid ${betaSize === s ? 'rgba(92,158,122,0.4)' : 'var(--l-border)'}`,
                            color: betaSize === s ? '#2D6A4A' : 'var(--l-muted)',
                          }}
                          aria-pressed={betaSize === s}
                        >
                          {s === '1' ? '1 майстер' : s === '2-5' ? '2–5 майстрів' : '5+ майстрів'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="h-12 rounded-full font-semibold text-sm mt-2 flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
                    style={{
                      background: 'rgba(92,158,122,0.12)',
                      color: '#2D6A4A',
                      border: '1.5px solid rgba(92,158,122,0.22)',
                    }}
                  >
                    {isPending && <Loader2 size={14} className="animate-spin" />}
                    {isPending ? 'Відправляємо...' : 'Залишити заявку'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}
