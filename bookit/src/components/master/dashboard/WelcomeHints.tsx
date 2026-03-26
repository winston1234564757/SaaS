'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const HINTS = [
  {
    id: 'share',
    emoji: '🔗',
    title: 'Твоє посилання тут!',
    text: 'Додай його в шапку профілю Instagram — і клієнти почнуть записуватись самі.',
    badge: 'Публічна сторінка ↓',
  },
  {
    id: 'booking',
    emoji: '➕',
    title: 'Клієнт написав у Direct?',
    text: 'Натисни «Новий запис» у Швидких діях — щоб не було накладок у розкладі.',
    badge: 'Швидкі дії ↑',
  },
];

export function WelcomeHints() {
  const [hintIndex, setHintIndex] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('bookit_hints_pending') !== 'true') return;
    // Видаляємо одразу на mount — щоб refresh не показував підказки знову
    localStorage.removeItem('bookit_hints_pending');
    const t = setTimeout(() => setHintIndex(0), 1200);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    if (hintIndex === null) return;
    const next = hintIndex + 1;
    if (next < HINTS.length) {
      setHintIndex(next);
    } else {
      setHintIndex(null);
    }
  }

  const hint = hintIndex !== null ? HINTS[hintIndex] : null;

  return (
    <AnimatePresence>
      {hint && (
        <>
          {/* Soft backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 z-40 pointer-events-none"
          />

          {/* Hint card */}
          <motion.div
            key={hint.id}
            initial={{ opacity: 0, y: 64 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 64 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed bottom-6 left-4 right-4 z-50 max-w-sm mx-auto"
          >
            <div
              className="rounded-3xl p-5"
              style={{
                background: 'rgba(255,248,244,0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.72)',
                boxShadow: '0 16px 48px rgba(44,26,20,0.15)',
              }}
            >
              <div className="flex items-start gap-3">
                {/* Pulsing beacon */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#789A99]/15 flex items-center justify-center text-xl">
                    {hint.emoji}
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#789A99] opacity-60" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#789A99]" />
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[10px] font-semibold text-[#789A99] uppercase tracking-wide">
                      {hint.badge}
                    </p>
                    <button
                      type="button"
                      onClick={dismiss}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/60 border border-white/80 text-[#A8928D] hover:text-[#6B5750] transition-colors shrink-0"
                    >
                      <X size={11} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-[#2C1A14] mb-1">{hint.title}</p>
                  <p className="text-xs text-[#6B5750] leading-relaxed mb-3">{hint.text}</p>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="w-full py-2 rounded-xl bg-[#789A99] text-white text-xs font-semibold hover:bg-[#5C7E7D] transition-colors"
                  >
                    Зрозуміло
                  </button>
                </div>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mt-3">
              {HINTS.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === hintIndex ? 20 : 6,
                    background: i === hintIndex ? '#789A99' : '#D4C5C0',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
