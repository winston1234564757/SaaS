'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { Plus } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FAQS = [
  {
    q: 'Скільки часу займає налаштування?',
    a: 'Зазвичай від 15 до 40 хвилин. Реєстрація, додавання послуг і першого розкладу — це все що потрібно для старту. Решту можна налаштувати пізніше.',
  },
  {
    q: 'Мені потрібен окремий сайт або додаток?',
    a: 'Ні. Bookit дає вам публічну сторінку за посиланням типу bookit.ua/anna — це ваш link in bio, сторінка запису і мінімагазин в одному місці.',
  },
  {
    q: 'Як клієнти записуються?',
    a: 'Вони переходять за вашим посиланням, обирають послугу і час, вводять номер телефону (OTP) і отримують підтвердження в SMS. Реєстрація не потрібна.',
  },
  {
    q: 'Що таке Smart Slots?',
    a: 'Алгоритм аналізує ваш розклад і автоматично пропонує клієнтам час, який вигідний вам — без дірок і зайвих пауз між записами.',
  },
  {
    q: 'Чи можу я скасувати підписку?',
    a: 'Так, в будь-який момент через налаштування. Жодних штрафів і прихованих умов. Ваші дані залишаються у вас.',
  },
  {
    q: 'Є підтримка для початківців?',
    a: 'Так. В чаті Telegram і за email. На Pro-плані — пріоритетна відповідь протягом 2 годин.',
  },
];

function FAQItem({ item, index, inView }: { item: typeof FAQS[0]; index: number; inView: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: easeOut, delay: 0.08 + index * 0.07 }}
      style={{ borderBottom: '1px solid var(--l-border)' }}
    >
      <button type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-6 py-6 text-left transition-opacity hover:opacity-80"
        aria-expanded={open}
      >
        <span className="text-base font-semibold leading-snug" style={{ color: 'var(--l-ink)' }}>
          {item.q}
        </span>
        <span
          className="size-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: open ? 'var(--l-accent)' : 'var(--l-surface-2)',
            border: '1px solid var(--l-border)',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            color: open ? '#FDFAF5' : 'var(--l-ink)',
            transition: 'transform 220ms ease-out, background 220ms ease-out, color 220ms ease-out',
          }}
          aria-hidden="true"
        >
          <Plus size={14} />
        </span>
      </button>

      <AnimatePresence mode="popLayout" initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p className="pb-6 text-base leading-relaxed" style={{ color: 'var(--l-muted)' }}>
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function LandingFAQ() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], ['0%', '-2%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  return (
    <section id="faq" ref={ref} className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-16 lg:gap-24">

          <div className="lg:sticky lg:top-32 self-start">
            <motion.div style={{ y: headingY }}>
              <motion.span
                initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                transition={{ ...spring, delay: 0.05 }}
                className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] mb-5"
                style={{ color: 'var(--l-indigo)' }}
              >
                Запитання
              </motion.span>
              <LandingSplitHeading
                text={"Часті\nзапитання."}
                className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.95] tracking-tight"
                style={{ fontSize: 'clamp(2.2rem,4vw,3.6rem)', color: 'var(--l-ink)' }}
                stagger={80}
                lineDelay={220}
              />
            </motion.div>
          </div>

          <div style={{ borderTop: '1px solid var(--l-border)' }}>
            {FAQS.map((item, i) => (
              <FAQItem key={i} item={item} index={i} inView={inView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
