'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  useScroll,
} from 'framer-motion';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Counter that springs from 0 → to ─── */
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: '-60px' });
  const mv = useMotionValue(0);
  const sv = useSpring(mv, { stiffness: 70, damping: 15 });
  const [text, setText] = useState(`0${suffix}`);

  useMotionValueEvent(sv, 'change', (v) => {
    setText(`${Math.round(v)}${suffix}`);
  });

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);

  return (
    <motion.span
      ref={nodeRef}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {text}
    </motion.span>
  );
}

type TruthItem =
  | { type: 'count'; to: number; suffix: string; label: string }
  | { type: 'static'; text: string; label: string };

const TRUTHS: TruthItem[] = [
  { type: 'count', to: 30, suffix: ' сек', label: 'і клієнт у розкладі' },
  { type: 'static', text: '0 дзвінків', label: 'тільки онлайн' },
  { type: 'static', text: '1 лінк', label: 'твоя сторінка запису' },
];

export function LandingTrustBar() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const barY = useTransform(scrollYProgress, [0, 1], ['2%', '-2%']);

  return (
    <section
      ref={ref}
      className="py-12 overflow-hidden"
      style={{ borderTop: '1px solid var(--l-border)', borderBottom: '1px solid var(--l-border)' }}
    >
      <motion.div
        style={{ y: barY }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {TRUTHS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, ease: easeOut, delay: i * 0.09 }}
              className="text-center"
            >
              <p
                className="font-[family-name:var(--font-cormorant)] font-semibold leading-none"
                style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', color: 'var(--l-ink)' }}
              >
                {t.type === 'count' ? (
                  <CountUp to={t.to} suffix={t.suffix} />
                ) : (
                  <motion.span
                    initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.9 }}
                    animate={inView ? { opacity: 1, filter: 'blur(0px)', scale: 1 } : {}}
                    transition={{ duration: 0.7, ease: easeOut, delay: i * 0.09 }}
                    style={{ display: 'inline-block' }}
                  >
                    {t.text}
                  </motion.span>
                )}
              </p>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: easeOut, delay: i * 0.09 + 0.12 }}
                className="mt-1.5 text-sm leading-snug"
                style={{ color: 'var(--l-muted)' }}
              >
                {t.label}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
