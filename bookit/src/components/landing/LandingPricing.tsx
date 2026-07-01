'use client';

import { useState, useRef, useTransition } from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { Check, Loader2, X, ArrowRight } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';
import { submitBetaRequest } from '@/app/(master)/dashboard/billing/actions';
import { STARTER_FEATURES, PRO_FEATURES, STUDIO_FEATURES } from '@/lib/constants/tierFeatures';
import { LANDING_SPRING } from './shared/CountUp';

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
    description: 'Усе для старту. Безкоштовно, без обмежень у часі.',
    features: [...STARTER_FEATURES],
    cta: 'Почати безкоштовно',
    accent: false,
  },
  {
    name: 'Pro',
    price: '700',
    period: 'місяць',
    description: 'Той самий Starter, тільки без лімітів.',
    features: [...PRO_FEATURES],
    cta: 'Спробувати Pro',
    accent: true,
  },
  {
    name: 'Studio',
    price: '',
    period: '',
    description: 'Для студій від двох майстрів: спільний кабінет, аналітика й команда.',
    features: [...STUDIO_FEATURES],
    cta: 'Залишити заявку',
    accent: false,
    waitlist: true,
  },
];

export function LandingPricing() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduce = useReducedMotion();

  const [showBetaForm, setShowBetaForm] = useState(false);
  const [betaName, setBetaName] = useState('');
  const [betaContact, setBetaContact] = useState('');
  const [betaSize, setBetaSize] = useState<'1' | '2-5' | '5+'>('1');
  const [betaDone, setBetaDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-14%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-4%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  function handleBetaSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await submitBetaRequest({ name: betaName, contact: betaContact, studio_size: betaSize });
      setBetaDone(true);
    });
  }

  const ctaBase = 'w-full h-12 rounded-full font-semibold text-sm transition-all active:scale-[0.97] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[var(--l-indigo)] focus-visible:ring-offset-2 focus-visible:outline-none';

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
              transition={{ ...LANDING_SPRING, delay: 0.05 }}
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5"
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
                transition={{ duration: shouldReduce ? 0 : 0.9, ease: easeOut, delay: shouldReduce ? 0 : 0.1 + i * 0.12 }}
                whileHover={shouldReduce ? {} : { y: plan.accent ? -6 : -4 }}
                className={plan.accent ? 'md:-mt-6 md:mb-6 md:scale-[1.03] md:z-10 relative' : ''}
              >
                <div
                  className="p-1.5 rounded-[1.75rem] h-full"
                  style={{
                    background: plan.accent
                      ? 'var(--l-accent)'
                      : plan.waitlist
                      ? 'color-mix(in srgb, var(--l-green) 4%, transparent)'
                      : 'rgba(26,23,16,0.03)',
                    border: `1px solid ${plan.accent ? 'var(--l-accent)' : plan.waitlist ? 'color-mix(in srgb, var(--l-green) 18%, transparent)' : 'var(--l-border)'}`,
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
                        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                        style={{
                          color: plan.accent
                            ? 'color-mix(in srgb, var(--l-text-on-dark) 60%, transparent)'
                            : plan.waitlist
                            ? 'color-mix(in srgb, var(--l-green) 70%, transparent)'
                            : 'var(--l-muted-2)',
                        }}
                      >
                        {plan.name}
                      </p>
                      {plan.accent && (
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            color: 'var(--l-text-on-dark)',
                            background: 'color-mix(in srgb, var(--l-text-on-dark) 18%, transparent)',
                          }}
                        >
                          Рекомендуємо
                        </span>
                      )}
                      {plan.waitlist && (
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            color: 'var(--l-green)',
                            background: 'color-mix(in srgb, var(--l-green) 14%, transparent)',
                          }}
                        >
                          Скоро
                        </span>
                      )}
                    </div>

                    {plan.waitlist ? (
                      <p
                        className="font-[family-name:var(--font-cormorant)] font-semibold leading-tight mb-4"
                        style={{ fontSize: 'clamp(1.15rem,2.2vw,1.5rem)', color: 'var(--l-green)' }}
                      >
                        Формуємо першу групу студій
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
                        {plan.accent && (
                          <p
                            className="text-[13px] leading-snug mb-1"
                            style={{ color: 'color-mix(in srgb, var(--l-text-on-dark) 62%, transparent)' }}
                          >
                            Коли ти ростеш, Pro росте з тобою.
                          </p>
                        )}
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
                          transition={{ duration: shouldReduce ? 0 : 0.7, ease: easeOut, delay: shouldReduce ? 0 : 0.32 + i * 0.1 + fi * 0.055 }}
                          className="flex items-start gap-3"
                        >
                          <div
                            className="size-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              background: plan.accent
                                ? 'color-mix(in srgb, var(--l-text-on-dark) 18%, transparent)'
                                : plan.waitlist
                                ? 'color-mix(in srgb, var(--l-green) 8%, transparent)'
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
                                  ? 'color-mix(in srgb, var(--l-green) 45%, transparent)'
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

                      {/* Клікабельний пункт бети — окремий фрейм від нижньої CTA (soft, цінність) */}
                      {plan.waitlist && (
                        <li>
                          <button
                            type="button"
                            onClick={() => setShowBetaForm(true)}
                            className="flex items-center gap-3 w-full text-left py-1 rounded-lg transition-opacity hover:opacity-70 active:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--l-green)] focus-visible:outline-none"
                          >
                            <span
                              className="size-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: 'color-mix(in srgb, var(--l-green) 14%, transparent)' }}
                              aria-hidden="true"
                            >
                              <ArrowRight size={11} style={{ color: 'var(--l-green)' }} />
                            </span>
                            <span className="text-sm leading-snug font-semibold" style={{ color: 'var(--l-green)' }}>
                              Ваші ідеї та потреби формують продукт
                            </span>
                          </button>
                        </li>
                      )}
                    </ul>

                    {plan.waitlist ? (
                      <button
                        type="button"
                        onClick={() => setShowBetaForm(true)}
                        className={ctaBase}
                        style={{
                          background: 'var(--l-green-bg)',
                          color: 'var(--l-green)',
                          border: '1.5px solid var(--l-green-border)',
                        }}
                      >
                        {plan.cta}
                      </button>
                    ) : (
                      <Link
                        href="/register"
                        className={ctaBase}
                        style={
                          plan.accent
                            ? {
                                background: 'var(--l-surface)',
                                color: 'var(--l-accent)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                              }
                            : {
                                background: 'transparent',
                                color: 'var(--l-ink)',
                                border: '1.5px solid var(--l-border-2)',
                              }
                        }
                      >
                        {plan.cta}
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ ...LANDING_SPRING, delay: 0.62 }}
            className="text-center text-sm mt-8"
            style={{ color: 'var(--l-muted)' }}
          >
            Всі тарифи без прихованих комісій. Змінити чи скасувати можна в два кліки.
          </motion.p>
        </div>
      </section>

      {showBetaForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'var(--l-overlay-modal)', backdropFilter: 'blur(4px)' }}
        >
          <button
            type="button"
            className="absolute inset-0 w-full h-full"
            onClick={() => setShowBetaForm(false)}
            aria-label="Закрити діалог"
            tabIndex={-1}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...LANDING_SPRING }}
            className="w-full max-w-md rounded-[1.75rem] p-8 relative z-10"
            style={{ background: 'var(--l-surface)', border: '1px solid var(--l-border)', boxShadow: '0 32px 80px rgba(26,23,16,0.14)' }}
          >
            <button
              type="button"
              onClick={() => setShowBetaForm(false)}
              className="absolute top-5 right-5 size-8 rounded-full flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-[var(--l-indigo)] focus-visible:outline-none"
              style={{ background: 'rgba(26,23,16,0.06)' }}
              aria-label="Закрити"
            >
              <X size={14} style={{ color: 'var(--l-muted)' }} />
            </button>

            {betaDone ? (
              <div className="text-center py-8">
                <div
                  className="size-14 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{ background: 'var(--l-green-bg-form)' }}
                >
                  <Check size={24} style={{ color: 'var(--l-green)' }} />
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
                      className="h-11 rounded-xl px-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--l-indigo)] focus-visible:ring-offset-1"
                      style={{
                        background: 'var(--l-input-bg)',
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
                      className="h-11 rounded-xl px-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--l-indigo)] focus-visible:ring-offset-1"
                      style={{
                        background: 'var(--l-input-bg)',
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
                          className="flex-1 h-10 rounded-xl text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-[var(--l-indigo)] focus-visible:outline-none"
                          style={{
                            background: betaSize === s ? 'var(--l-green-bg-form)' : 'var(--l-input-bg)',
                            border: `1.5px solid ${betaSize === s ? 'var(--l-green-border-act)' : 'var(--l-border)'}`,
                            color: betaSize === s ? 'var(--l-green)' : 'var(--l-muted)',
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
                    className="h-12 rounded-full font-semibold text-sm mt-2 flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--l-green)] focus-visible:outline-none"
                    style={{
                      background: 'var(--l-green-bg)',
                      color: 'var(--l-green)',
                      border: '1.5px solid var(--l-green-border)',
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
