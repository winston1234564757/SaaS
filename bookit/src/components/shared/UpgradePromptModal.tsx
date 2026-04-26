'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Zap, Check, Star } from 'lucide-react';

const PRO_PERKS = [
  'Необмежена кількість записів на місяць',
  'Динамічне ціноутворення (пікові/тихі години)',
  'Розширена аналітика та звіти',
  'Експорт клієнтів у CSV',
  'Програма лояльності без обмежень',
  'Без водяного знаку Bookit',
  'Повний маркетинговий пакет сторіс',
];

const MARKETING_PERKS = [
  'Шаблон "Відгук" — реальні 5★ у сторіс',
  'Шаблон "Гаряче вікно" — флеш-слоти з знижкою',
  'Автоматичний підбір вільних вікон',
  'Завантаження в 1080×1920 без обмежень',
  'Усі Pro-функції: аналітика, CRM, Telegram',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  description?: string;
  source?: 'marketing';
}

export function UpgradePromptModal({ isOpen, onClose, feature, description, source }: Props) {
  const router = useRouter();

  function handleUpgrade() {
    onClose();
    router.push('/dashboard/billing');
  }

  const isMarketing = source === 'marketing';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#2C1A14]/30 backdrop-blur-sm z-[80]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[85] max-w-sm mx-auto bento-card p-6 flex flex-col gap-5"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-[#A8928D] hover:text-[#2C1A14] hover:bg-[#F5E8E3] transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center gap-2 pt-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: isMarketing ? 'rgba(212,147,90,0.15)' : 'rgba(120,154,153,0.15)' }}
              >
                {isMarketing
                  ? <Star size={22} className="text-[#D4935A]" />
                  : <Zap size={22} className="text-[#789A99]" />
                }
              </div>
              <h2 className="heading-serif text-lg text-[#2C1A14]">
                {isMarketing
                  ? (feature ?? 'Ця функція доступна в Pro')
                  : feature ? `«${feature}» — функція Pro` : 'Ця функція доступна в Pro'
                }
              </h2>
              <p className="text-sm text-[#6B5750] text-balance leading-relaxed">
                {isMarketing
                  ? (description ?? 'Ваші відгуки — це ваша найкраща реклама. Переходьте на PRO, щоб створювати професійний контент за 2 кліки.')
                  : (description ?? 'Оновіть тариф, щоб розблокувати цю та інші просунуті функції.')
                }
              </p>
            </div>

            <ul className="flex flex-col gap-2">
              {(isMarketing ? MARKETING_PERKS : PRO_PERKS).map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-sm text-[#6B5750]">
                  <Check
                    size={14}
                    className={isMarketing ? 'text-[#D4935A] mt-0.5 flex-shrink-0' : 'text-[#789A99] mt-0.5 flex-shrink-0'}
                  />
                  {perk}
                </li>
              ))}
            </ul>

            <p className="text-center text-xs text-[#A8928D]">
              700 ₴/місяць · Скасування будь-коли
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleUpgrade}
                className={`w-full h-12 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                  isMarketing
                    ? 'bg-gradient-to-r from-[#D4935A] to-[#C07840] text-white hover:opacity-90 shadow-[0_4px_16px_rgba(212,147,90,0.35)]'
                    : 'bg-[#789A99] text-white hover:bg-[#5C7E7D] shadow-[0_4px_16px_rgba(120,154,153,0.35)]'
                }`}
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
