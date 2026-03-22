'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Clock, Moon } from 'lucide-react';
import { UpgradePromptModal } from '@/components/shared/UpgradePromptModal';

const EXAMPLES = [
  {
    icon: TrendingUp,
    label: 'Пікові години',
    description: 'П\'ятниця–субота 16:00–20:00 → +15% до ціни',
  },
  {
    icon: Moon,
    label: 'Тихі години',
    description: 'Пн–Ср 09:00–13:00 → -10% для заповнення розкладу',
  },
  {
    icon: Clock,
    label: 'Раннє бронювання',
    description: 'Запис за 3+ дні → -10% для постійних клієнтів',
  },
  {
    icon: Zap,
    label: 'Останній момент',
    description: 'Запис за 4 години → -20%, щоб не втрачати вікна',
  },
];

export function PricingUpgradeGate() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="p-6 flex flex-col gap-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="bento-card p-6 text-center flex flex-col items-center gap-3"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(120,154,153,0.15)' }}
          >
            <TrendingUp size={26} className="text-[#789A99]" />
          </div>
          <div>
            <h1 className="heading-serif text-xl text-[#2C1A14] mb-1">
              Динамічне ціноутворення
            </h1>
            <p className="text-sm text-[#6B5750] text-balance leading-relaxed max-w-xs mx-auto">
              Автоматично підвищуйте ціни в пікові години та давайте знижки в тихі —
              щоб завжди мати повний розклад.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#789A99] bg-[#789A99]/10">
            <Zap size={12} />
            Доступно в тарифі Pro
          </span>
        </motion.div>

        {/* Feature examples */}
        <div className="flex flex-col gap-3">
          {EXAMPLES.map(({ icon: Icon, label, description }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 26 }}
              className="bento-card p-4 flex items-start gap-3 opacity-70"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(120,154,153,0.1)' }}
              >
                <Icon size={16} className="text-[#789A99]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2C1A14]">{label}</p>
                <p className="text-xs text-[#A8928D] mt-0.5">{description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, type: 'spring', stiffness: 300, damping: 26 }}
          onClick={() => setModalOpen(true)}
          className="w-full h-13 rounded-2xl bg-[#789A99] text-white font-bold text-sm hover:bg-[#5C7E7D] transition-colors shadow-[0_4px_16px_rgba(120,154,153,0.35)] flex items-center justify-center gap-2"
        >
          <Zap size={16} />
          Розблокувати динамічне ціноутворення
        </motion.button>
      </div>

      <UpgradePromptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        feature="Динамічне ціноутворення"
        description="Встановлюйте автоматичні знижки та надбавки залежно від дня тижня та часу доби. Заповнюйте тихі слоти та максимізуйте дохід у пікові години."
      />
    </>
  );
}
