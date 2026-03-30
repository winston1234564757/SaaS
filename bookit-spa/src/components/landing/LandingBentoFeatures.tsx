import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, TrendingDown, Gift, Flame } from 'lucide-react';

export function LandingBentoFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const cardVariants = (delay: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { delay, type: 'spring' as const, stiffness: 280, damping: 24 },
  });

  return (
    <section ref={ref} className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h2 className="display-md text-[#2C1A14] text-balance max-w-2xl mx-auto">
          Інструменти, які раніше коштували мільйони.{' '}
          <em className="not-italic text-[#789A99]">Тепер у вашому смартфоні.</em>
        </h2>
      </motion.div>

      {/* Bento grid: 3 cols on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 auto-rows-auto">

        {/* Smart Slots — col-span-2, tall */}
        <motion.div
          {...cardVariants(0.05)}
          className="bento-card p-7 flex flex-col gap-5 sm:col-span-2"
          style={{
            background: 'linear-gradient(140deg, rgba(120,154,153,0.18) 0%, rgba(255,255,255,0.55) 100%)',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#789A99] shadow-[0_4px_14px_rgba(120,154,153,0.4)]">
              <Zap size={22} className="text-white" />
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#789A99]/10 text-[#789A99]">
              Smart Slots
            </span>
          </div>
          <div>
            <h3 className="heading-serif text-2xl text-[#2C1A14] mb-2 leading-snug text-balance">
              Забудьте про "рваний" графік
            </h3>
            <p className="text-[#6B5750] leading-relaxed">
              Алгоритм не дозволить клієнту записатись так, щоб залишилось незручне вікно у 30 хвилин.
              Ваш день — ідеальний тетріс. Повна завантаженість без жодних зусиль з вашого боку.
            </p>
          </div>
          {/* Mini schedule visual */}
          <div className="grid grid-cols-4 gap-1.5 mt-1">
            {[
              { time: '10:00', label: 'Манікюр', filled: true },
              { time: '11:30', label: 'Гель', filled: true },
              { time: '13:00', label: 'Педикюр', filled: true },
              { time: '14:30', label: 'Вільно', filled: false },
            ].map((slot, i) => (
              <div
                key={i}
                className="rounded-xl p-2.5 text-center"
                style={{
                  background: slot.filled
                    ? 'rgba(120,154,153,0.18)'
                    : 'rgba(255,255,255,0.4)',
                  border: slot.filled
                    ? '1px solid rgba(120,154,153,0.3)'
                    : '1px dashed rgba(120,154,153,0.25)',
                }}
              >
                <p className="text-[10px] font-semibold text-[#789A99]">{slot.time}</p>
                <p
                  className="text-[10px] mt-0.5 leading-tight"
                  style={{ color: slot.filled ? '#2C1A14' : '#A8928D' }}
                >
                  {slot.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Dynamic Pricing — col-span-1 */}
        <motion.div
          {...cardVariants(0.1)}
          className="bento-card p-7 flex flex-col gap-5"
          style={{
            background: 'linear-gradient(140deg, rgba(212,147,90,0.14) 0%, rgba(255,255,255,0.55) 100%)',
          }}
        >
          <div className="flex items-start justify-between">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(212,147,90,0.35)]"
              style={{ background: '#D4935A' }}
            >
              <TrendingDown size={22} className="text-white" />
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#D4935A]/10 text-[#D4935A]">
              Динамічні ціни
            </span>
          </div>
          <div>
            <h3 className="heading-serif text-xl text-[#2C1A14] mb-2 leading-snug text-balance">
              Краще -15%, ніж безкоштовно
            </h3>
            <p className="text-sm text-[#6B5750] leading-relaxed">
              Ранкові години порожні? Система автоматично знижує ціну на "мертві" слоти.
              Ви заробляєте — замість того, щоб просто чекати.
            </p>
          </div>
          {/* Price tag visual */}
          <div className="flex items-center gap-2 mt-auto">
            <span className="heading-serif text-2xl text-[#D4935A]">425 ₴</span>
            <span className="text-base text-[#A8928D] line-through">500 ₴</span>
            <span className="text-xs font-semibold text-white bg-[#D4935A] px-2 py-0.5 rounded-lg ml-auto">
              -15%
            </span>
          </div>
        </motion.div>

        {/* Loyalty / Cashback — col-span-1 */}
        <motion.div
          {...cardVariants(0.15)}
          className="bento-card p-7 flex flex-col gap-5"
          style={{
            background: 'linear-gradient(140deg, rgba(92,158,122,0.14) 0%, rgba(255,255,255,0.55) 100%)',
          }}
        >
          <div className="flex items-start justify-between">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(92,158,122,0.35)]"
              style={{ background: '#5C9E7A' }}
            >
              <Gift size={22} className="text-white" />
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#5C9E7A]/10 text-[#5C9E7A]">
              Лояльність
            </span>
          </div>
          <div>
            <h3 className="heading-serif text-xl text-[#2C1A14] mb-2 leading-snug text-balance">
              Знижки вбивають дохід. Кешбек — змушує повертатись.
            </h3>
            <p className="text-sm text-[#6B5750] leading-relaxed">
              Налаштуйте бонуси один раз. Клієнти накопичують бали і повертаються знову — вже самі.
            </p>
          </div>
          {/* Loyalty badge */}
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-2xl mt-auto"
            style={{ background: 'rgba(92,158,122,0.12)' }}
          >
            <span className="text-sm text-[#5C9E7A] font-medium">🎁 Ваші бали</span>
            <span className="heading-serif text-lg text-[#5C9E7A]">380 = 76 ₴</span>
          </div>
        </motion.div>

        {/* Flash Deals — col-span-2, tall */}
        <motion.div
          {...cardVariants(0.2)}
          className="bento-card p-7 flex flex-col gap-5 sm:col-span-2"
          style={{
            background: 'linear-gradient(140deg, rgba(192,91,91,0.12) 0%, rgba(212,147,90,0.1) 50%, rgba(255,255,255,0.55) 100%)',
          }}
        >
          <div className="flex items-start justify-between">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(192,91,91,0.35)]"
              style={{ background: '#C05B5B' }}
            >
              <Flame size={22} className="text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full text-white animate-pulse"
                style={{ background: '#C05B5B' }}
              >
                ЗАКРИВАЄТЬСЯ ЗА 3 ХВ
              </span>
            </div>
          </div>
          <div>
            <h3 className="heading-serif text-2xl text-[#2C1A14] mb-2 leading-snug text-balance">
              Палаючі вікна — нові клієнти за лічені хвилини
            </h3>
            <p className="text-[#6B5750] leading-relaxed">
              Хтось захворів і скасував візит на завтра? Один клік — і всі ваші клієнти
              отримують Push-сповіщення про "палаюче" вікно зі знижкою. Слот закривається за хвилини,
              а не залишається порожнім.
            </p>
          </div>
          {/* Flash deal mockup */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(192,91,91,0.1)', border: '1px solid rgba(192,91,91,0.2)' }}
          >
            <Flame size={18} style={{ color: '#C05B5B' }} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2C1A14]">Анна Коваленко · Манікюр</p>
              <p className="text-xs text-[#6B5750]">Завтра 10:00 · Знижка 25%</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-[#C05B5B]">375 ₴</p>
              <p className="text-xs text-[#A8928D] line-through">500 ₴</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
