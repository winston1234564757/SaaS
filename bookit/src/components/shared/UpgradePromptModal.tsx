'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Zap, Check } from 'lucide-react';

const PRO_PERKS = [
  'Необмежена кількість записів на місяць',
  'Динамічне ціноутворення (пікові/тихі години)',
  'Розширена аналітика та звіти',
  'Експорт клієнтів у CSV',
  'Програма лояльності без обмежень',
  'Без водяного знаку Bookit',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  description?: string;
}

export function UpgradePromptModal({ isOpen, onClose, feature, description }: Props) {
  const router = useRouter();

  function handleUpgrade() {
    onClose();
    router.push('/dashboard/billing');
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#2C1A14]/30 backdrop-blur-sm z-[80]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[85] max-w-sm mx-auto bento-card p-6 flex flex-col gap-5"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-[#A8928D] hover:text-[#2C1A14] hover:bg-[#F5E8E3] transition-colors"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center gap-2 pt-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(120,154,153,0.15)' }}
              >
                <Zap size={22} className="text-[#789A99]" />
              </div>
              <h2 className="heading-serif text-lg text-[#2C1A14]">
                {feature ? `«${feature}» — функція Pro` : 'Ця функція доступна в Pro'}
              </h2>
              <p className="text-sm text-[#6B5750] text-balance leading-relaxed">
                {description ?? 'Оновіть тариф, щоб розблокувати цю та інші просунуті функції.'}
              </p>
            </div>

            {/* Perks */}
            <ul className="flex flex-col gap-2">
              {PRO_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-sm text-[#6B5750]">
                  <Check size={14} className="text-[#789A99] mt-0.5 flex-shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>

            {/* Price anchor */}
            <p className="text-center text-xs text-[#A8928D]">
              700 ₴/місяць · Скасування будь-коли
            </p>

            {/* CTA */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleUpgrade}
                className="w-full h-12 rounded-2xl bg-[#789A99] text-white font-bold text-sm hover:bg-[#5C7E7D] transition-colors shadow-[0_4px_16px_rgba(120,154,153,0.35)] flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                Перейти на Pro →
              </button>
              <button
                onClick={onClose}
                className="w-full h-10 rounded-2xl text-[#A8928D] text-sm hover:text-[#6B5750] transition-colors"
              >
                Пізніше
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
