'use client';

import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Check, Copy, ExternalLink } from 'lucide-react';
import { ConfettiParticles } from './ConfettiParticles';

interface StepSuccessProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  savedSlug: string;
  copied: boolean;
  onCopyLink: () => void;
  onComplete: () => void;
}

export function StepSuccess({
  direction,
  slideVariants,
  transition,
  savedSlug,
  copied,
  onCopyLink,
  onComplete,
}: StepSuccessProps) {
  return (
    <motion.div
      key="SUCCESS"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="relative bento-card p-6 overflow-hidden"
    >
      <ConfettiParticles />

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-[#5C9E7A]/15 flex items-center justify-center mb-4"
        >
          <Check size={28} className="text-[#5C9E7A]" strokeWidth={2.5} />
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="heading-serif text-2xl text-[#2C1A14] mb-1">
          Твій Bookit готовий!
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-sm text-[#A8928D] mb-6">
          Ділись посиланням і отримуй записи
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="w-full rounded-2xl bg-white/70 border border-white/80 p-4 mb-4 text-left">
          <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wide mb-2">Твоя публічна сторінка</p>
          <p className="text-sm font-mono text-[#2C1A14] mb-3 truncate">bookit.com.ua/{savedSlug}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCopyLink}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${copied ? 'bg-[#5C9E7A]/15 text-[#5C9E7A]' : 'bg-[#789A99]/10 text-[#789A99] hover:bg-[#789A99]/20'}`}
            >
              {copied ? <><Check size={12} /> Скопійовано</> : <><Copy size={12} /> Копіювати</>}
            </button>
            <a href={`/${savedSlug}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/60 text-[#6B5750] hover:bg-white/80 transition-all">
              <ExternalLink size={12} />
            </a>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onComplete}
          className="w-full py-4 rounded-2xl bg-[#789A99] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors shadow-[0_8px_24px_rgba(120,154,153,0.35)]"
        >
          Поїхали в CRM! <ArrowRight size={18} />
        </motion.button>
      </div>
    </motion.div>
  );
}
