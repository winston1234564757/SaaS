'use client';

import { motion, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface StepSchedulePromptProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  onSetupSchedule: () => void;
  onSkip: () => void;
}

export function StepSchedulePrompt({
  direction,
  slideVariants,
  transition,
  onSetupSchedule,
  onSkip,
}: StepSchedulePromptProps) {
  return (
    <motion.div
      key="SCHEDULE_PROMPT"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="bento-card p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.05 }}
        className="text-5xl mb-4"
      >
        🎉
      </motion.div>

      <h2 className="heading-serif text-xl text-[#2C1A14] mb-2">Профіль успішно створено!</h2>
      <p className="text-sm text-[#6B5750] mb-7 leading-relaxed">
        Щоб клієнти могли до вас записуватися, потрібно налаштувати робочі години. Зробимо це зараз?
      </p>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onSetupSchedule}
          className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors"
        >
          Налаштувати графік <ArrowRight size={16} />
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-3 rounded-2xl bg-white/70 border border-white/80 text-sm font-medium text-[#6B5750] hover:bg-white transition-colors"
        >
          Пропустити
        </button>
      </div>
    </motion.div>
  );
}
