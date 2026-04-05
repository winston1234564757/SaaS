'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Flame, Gift, Send } from 'lucide-react';

/* ── Mini visual mockups ── */

function ScheduleVisual() {
  const slots = [
    { time: '10:00', label: 'Манікюр', filled: true },
    { time: '11:30', label: 'Гель', filled: true },
    { time: '13:00', label: 'Педикюр', filled: true },
    { time: '14:30', label: 'Вільно', filled: false },
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5 mt-2">
      {slots.map((s, i) => (
        <div
          key={i}
          className="rounded-xl p-2.5 text-center"
          style={{
            background: s.filled ? 'rgba(120,154,153,0.15)' : 'rgba(255,255,255,0.4)',
            border: s.filled
              ? '1px solid rgba(120,154,153,0.3)'
              : '1px dashed rgba(120,154,153,0.25)',
          }}
        >
          <p className="text-[10px] font-semibold" style={{ color: '#789A99' }}>{s.time}</p>
          <p
            className="text-[10px] mt-0.5 leading-tight"
            style={{ color: s.filled ? '#2C1A14' : '#A8928D' }}
          >
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function FlashVisual() {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: 'rgba(212,147,90,0.1)',
        border: '1px solid rgba(212,147,90,0.25)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={14} style={{ color: '#D4935A' }} />
          <span className="text-xs font-bold text-[#D4935A]">FLASH DEAL</span>
        </div>
        <span
          className="text-xs font-bold text-white px-2 py-0.5 rounded-lg"
          style={{ background: '#D4935A' }}
        >
          -25%
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-[#2C1A14]">Манікюр · Анна К.</p>
        <p className="text-xs text-[#6B5750]">Завтра 10:00 · Знижка активна</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="heading-serif text-lg text-[#D4935A]">375 ₴</span>
        <span className="text-sm text-[#A8928D] line-through">500 ₴</span>
        <span className="text-xs font-semibold text-[#5C9E7A]">3 записи</span>
      </div>
    </div>
  );
}

function LoyaltyVisual() {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'rgba(92,158,122,0.08)', border: '1px solid rgba(92,158,122,0.2)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#5C9E7A]">Картка лояльності</span>
        <Gift size={14} style={{ color: '#5C9E7A' }} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#6B5750]">7 / 10 відвідувань</span>
          <span className="text-xs font-semibold text-[#5C9E7A]">подарунок</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: 'rgba(92,158,122,0.15)' }}>
          <div
            className="h-2 rounded-full"
            style={{ width: '70%', background: '#5C9E7A' }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6B5750]">Накопичено балів</span>
        <span className="heading-serif text-base text-[#5C9E7A]">380 = 76 ₴</span>
      </div>
    </div>
  );
}

function TelegramVisual() {
  return (
    <div className="flex flex-col gap-2">
      {[
        { text: 'Новий запис: Анна, завтра 14:00, Манікюр 500₴', time: '09:41' },
        { text: 'Нагадування: Марія о 16:00 сьогодні', time: '14:00', muted: true },
      ].map((msg, i) => (
        <div
          key={i}
          className="flex gap-2.5 items-start"
        >
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: '#2AABEE' }}
          >
            B
          </div>
          <div
            className="flex-1 rounded-2xl rounded-tl-sm px-3 py-2"
            style={{
              background: msg.muted ? 'rgba(255,255,255,0.5)' : 'rgba(42,171,238,0.1)',
              border: msg.muted
                ? '1px solid rgba(255,255,255,0.6)'
                : '1px solid rgba(42,171,238,0.2)',
            }}
          >
            <p className="text-xs text-[#2C1A14] leading-relaxed">{msg.text}</p>
            <p className="text-[10px] text-[#A8928D] mt-0.5">{msg.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Feature blocks data ── */
const features = [
  {
    tag: 'Смарт-слоти',
    icon: Zap,
    title: 'Жодної «дірки» у графіку',
    description:
      'Алгоритм не дозволить клієнту записатись так, щоб залишився незручний проміжок. Ваш день — ідеальний тетріс.',
    result: '+2–3 додаткових записи щотижня',
    visual: ScheduleVisual,
    reverse: false,
  },
  {
    tag: 'Флеш-акції',
    icon: Flame,
    title: 'Порожній слот → гроші за 10 хвилин',
    description:
      'Скасування — не трагедія. Натискаєш «Флеш», обираєш знижку, і клієнти отримують push-сповіщення. Слот закривається сам.',
    result: '3–5 записів на перші 15 хвилин',
    visual: FlashVisual,
    reverse: true,
  },
  {
    tag: 'Лояльність',
    icon: Gift,
    title: 'Клієнти повертаються — і наводять подруг',
    description:
      'Бонуси за кожне відвідування, реферальні знижки і програма лояльності перетворюють разового клієнта на постійного.',
    result: '+40% повторних відвідувань',
    visual: LoyaltyVisual,
    reverse: false,
  },
  {
    tag: 'Telegram',
    icon: Send,
    title: 'Ви завжди знаєте, що відбувається',
    description:
      'Новий запис, скасування, нагадування клієнту — все приходить у Telegram. Жодного пропущеного повідомлення.',
    result: '-70% no-show завдяки нагадуванням',
    visual: TelegramVisual,
    reverse: true,
  },
];

export function LandingBentoFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-20">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <h2 className="display-md text-[#2C1A14] text-balance max-w-2xl mx-auto">
          Інструменти, які заробляють замість вас.
        </h2>
        <p className="text-[#6B5750] text-lg max-w-xl mx-auto mt-4 text-balance">
          Кожна фіча — це не просто зручність. Це додаткові гроші у вашій кишені.
        </p>
      </motion.div>

      {/* Feature blocks */}
      <div className="flex flex-col">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          const Visual = feat.visual;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 24 }}
              className={`flex flex-col sm:flex-row gap-8 sm:gap-12 py-12 ${
                i < features.length - 1 ? 'border-b' : ''
              } ${feat.reverse ? 'sm:flex-row-reverse' : ''}`}
              style={{ borderColor: 'rgba(120,154,153,0.12)' }}
            >
              {/* Text side */}
              <div className="flex-1 flex flex-col gap-4 justify-center">
                {/* Tag */}
                <div className="inline-flex items-center gap-2 self-start">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(120,154,153,0.1)', color: '#789A99' }}
                  >
                    {feat.tag}
                  </span>
                </div>

                <h3 className="heading-serif text-2xl text-[#2C1A14] leading-snug text-balance">
                  {feat.title}
                </h3>

                <p className="text-[#6B5750] leading-relaxed">
                  {feat.description}
                </p>

                {/* Result callout */}
                <div className="flex flex-col gap-1">
                  <span
                    className="text-xs uppercase tracking-wide"
                    style={{ color: '#A8928D' }}
                  >
                    Результат:
                  </span>
                  <span className="font-bold text-[#2C1A14]">{feat.result}</span>
                </div>
              </div>

              {/* Visual side */}
              <div className="flex-1 flex items-center justify-center">
                <div className="bento-card p-6 w-full max-w-sm">
                  {/* Feature icon header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(120,154,153,0.12)' }}
                    >
                      <Icon size={16} style={{ color: '#789A99' }} />
                    </div>
                    <span className="text-xs font-semibold text-[#A8928D] uppercase tracking-wide">
                      {feat.tag}
                    </span>
                  </div>
                  <Visual />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
