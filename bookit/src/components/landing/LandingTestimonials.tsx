'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';
import { LANDING_SPRING } from './shared/CountUp';

const TESTIMONIALS = [
  {
    quote: 'Раніше я витрачала 2 години на день тільки на переписку. Зараз клієнти записуються самі, а я дізнаюся про це з повідомлення в Telegram.',
    name: 'Аня Коваленко',
    role: 'Майстер манікюру, Київ',
    metric: '+₴6 400 / міс',
    initials: 'АК',
    bg: 'var(--l-avatar-1)',
  },
  {
    quote: 'Перший місяць думала, що це складно. Насправді я просто виставила послуги і кинула посилання в Instagram. Запис пішов сам.',
    name: 'Оля Мороз',
    role: 'Перукар, Харків',
    metric: '3× повторних клієнтів',
    initials: 'ОМ',
    bg: 'var(--l-avatar-2)',
  },
  {
    quote: 'Флеш-акції — це те, що мені потрібно було давно. Скасування більше не болять: система сама знаходить заміну за 15 хвилин.',
    name: 'Марина Яценко',
    role: 'Косметолог, Львів',
    metric: '0 порожніх слотів тижнями',
    initials: 'МЯ',
    bg: 'var(--l-avatar-3)',
  },
];

export function LandingTestimonials() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduce = useReducedMotion();

  return (
    <section ref={ref} className="py-36 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...LANDING_SPRING, delay: 0.12 }}
            className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.95] tracking-tight"
            style={{ fontSize: 'clamp(2.2rem,4.5vw,3.8rem)', color: 'var(--l-ink)' }}
          >
            Майстри вже заробляють більше.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...LANDING_SPRING, delay: shouldReduce ? 0 : 0.1 + i * 0.18 }}
              whileHover={shouldReduce ? {} : { y: -4, scale: 1.01 }}
            >
              {/* Double-Bezel */}
              <div
                className="p-1.5 rounded-[1.75rem] h-full"
                style={{ background: 'color-mix(in srgb, var(--l-accent) 3%, transparent)', border: '1px solid var(--l-border)' }}
              >
                <div
                  className="rounded-[calc(1.75rem-0.375rem)] p-8 h-full flex flex-col gap-6"
                  style={{
                    background: 'var(--l-surface)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.9)',
                  }}
                >
                  {/* Stars */}
                  <div
                    className="flex gap-1"
                    role="img"
                    aria-label="Рейтинг 5 з 5 зірок"
                  >
                    {Array.from({ length: 5 }).map((_, si) => (
                      <motion.span
                        key={si}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={inView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ ...LANDING_SPRING, delay: shouldReduce ? 0 : 0.18 + i * 0.18 + si * 0.07 }}
                      >
                        <Star size={14} fill="#BF8950" color="#BF8950" aria-hidden="true" />
                      </motion.span>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote
                    className="text-base leading-loose flex-1"
                    style={{ color: 'var(--l-ink-2)' }}
                  >
                    {t.quote}
                  </blockquote>

                  {/* Metric badge */}
                  <div
                    className="px-4 py-2 rounded-xl self-start"
                    style={{
                      background: 'color-mix(in srgb, var(--l-indigo-glow) 8%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--l-indigo-glow) 14%, transparent)',
                    }}
                  >
                    <span
                      className="font-[family-name:var(--font-cormorant)] font-semibold"
                      style={{ fontSize: '1.25rem', color: 'var(--l-indigo)' }}
                    >
                      {t.metric}
                    </span>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--l-border)' }}>
                    <div
                      className="size-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: t.bg }}
                      aria-hidden="true"
                    >
                      {t.initials}
                    </div>
                    <cite style={{ fontStyle: 'normal' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--l-ink)' }}>{t.name}</p>
                      <p className="text-sm" style={{ color: 'var(--l-muted)' }}>{t.role}</p>
                    </cite>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
