'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Чи потрібен окремий додаток моїм клієнтам?',
    a: 'Ні. Клієнти записуються через звичайний браузер — просто відкривають ваше посилання. PWA-додаток можна встановити за бажанням: один тап, і Bookit з\'являється на домашньому екрані смартфона.',
  },
  {
    q: 'Скільки часу займе налаштування?',
    a: 'Реально — 2 хвилини. Реєстрація → додаєте послуги → ділитеся посиланням у Instgram bio. Перший клієнт може записатись вже через 5 хвилин після реєстрації.',
  },
  {
    q: 'Як саме працюють Флеш-акції?',
    a: 'Ви заходите в дашборд, натискаєте "Флеш-акція", обираєте вільний слот і розмір знижки. Bookit миттєво надсилає Push-сповіщення всім вашим клієнтам, які підписані на нотифікації. Як правило, слот закривається за 3–10 хвилин.',
  },
  {
    q: 'Що якщо клієнт не прийде (no-show)?',
    a: 'Bookit автоматично надсилає нагадування за 24 години і за 2 години до запису — у Telegram або Push. За нашою статистикою, це зменшує no-show на 70%. Ви також можете вручну скасувати або перенести запис.',
  },
  {
    q: 'Чи можна скасувати підписку у будь-який момент?',
    a: 'Так, без жодних штрафів і пояснень. Скасовуєте в особистому кабінеті — і все. Ваші дані та клієнтська база залишаються у вас.',
  },
  {
    q: 'У мене є 2 майстра у студії. Як це влаштовано?',
    a: 'Для команд є тариф Studio — 300 ₴ за майстра на місяць. Ви отримуєте спільну сторінку студії, єдину базу клієнтів, управління розкладом команди та розділення прав (власник / адмін / майстер). Кожен майстер має повний Pro-функціонал.',
  },
];

export function LandingFAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i));

  return (
    <section ref={ref} className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h2 className="display-md text-[#2C1A14] text-balance">
          Питання, які зупиняють вас{' '}
          <em className="not-italic text-[#789A99]">прямо зараз</em>
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto flex flex-col gap-2"
      >
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
            className="bento-card overflow-hidden"
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-4 p-5 text-left"
            >
              <span className="text-base font-semibold text-[#2C1A14] leading-snug">
                {faq.q}
              </span>
              <motion.div
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="flex-shrink-0"
              >
                <ChevronDown size={18} className="text-[#789A99]" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {openIndex === i && (
                <motion.div
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm text-[#6B5750] leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
