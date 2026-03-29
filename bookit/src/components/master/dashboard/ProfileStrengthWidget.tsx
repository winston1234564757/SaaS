'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';

const LS_KEY = 'bookit_strength_celebrated';

const RADIUS = 34;
const STROKE = 5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircleProgress({ progress }: { progress: number }) {
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
  const color =
    progress >= 80 ? '#5C9E7A' :
    progress >= 40 ? '#D4935A' :
    '#789A99';

  return (
    <svg width={86} height={86} viewBox="0 0 86 86" className="shrink-0 -rotate-90">
      <circle cx={43} cy={43} r={RADIUS} fill="none" stroke="#F5E8E3" strokeWidth={STROKE} />
      <motion.circle
        cx={43} cy={43} r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        initial={{ strokeDashoffset: CIRCUMFERENCE }}
        animate={{ strokeDashoffset: offset, stroke: color }}
        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  );
}

const listContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const listItem = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 26 },
  },
};

export function ProfileStrengthWidget() {
  // ── All hooks at top level, unconditionally ───────────────────────────────
  const { profile, masterProfile, isLoading } = useMasterContext();

  const [celebrating, setCelebrating] = useState(false);
  const [visible, setVisible] = useState(true);
  // Start as true to avoid flash — set to real value in useEffect (client only)
  const [alreadyCelebrated, setAlreadyCelebrated] = useState(true);

  // Read localStorage only on the client, inside useEffect
  useEffect(() => {
    setAlreadyCelebrated(localStorage.getItem(LS_KEY) === 'done');
  }, []);

  // ── Derived values — never useState for these ─────────────────────────────
  const steps = [
    {
      key: 'city',
      done: !!masterProfile?.city?.trim(),
      label: '📍 Вкажіть ваше місто',
      sub: 'щоб клієнти поруч знаходили вас',
      href: '/dashboard/settings',
    },
    {
      key: 'phone',
      done: !!profile?.phone?.trim(),
      label: '📱 Додайте контактний телефон',
      sub: "для зв'язку з клієнтами",
      href: '/dashboard/settings',
    },
    {
      key: 'socials',
      done: !!(
        masterProfile?.instagram_url?.trim() ||
        masterProfile?.telegram_url?.trim()
      ),
      label: '📸 Підключіть Instagram',
      sub: 'це підвищує довіру на 80%',
      href: '/dashboard/settings',
    },
    {
      key: 'bio',
      done: !!masterProfile?.bio?.trim(),
      label: '📝 Додайте пару слів про себе',
      sub: 'досвід та філософія',
      href: '/dashboard/settings',
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const progress = (doneCount / steps.length) * 100;
  const incomplete = steps.filter(s => !s.done);

  // Trigger celebration — setState only inside useEffect, never in render body
  useEffect(() => {
    if (progress === 100 && !celebrating && !alreadyCelebrated && !isLoading) {
      setCelebrating(true);
    }
  }, [progress, celebrating, alreadyCelebrated, isLoading]);

  function handleCelebrationConfirm() {
    localStorage.setItem(LS_KEY, 'done');
    setVisible(false);
  }

  // ── Early returns AFTER all hooks ─────────────────────────────────────────
  if (isLoading || !masterProfile || !profile || alreadyCelebrated) {
    return null;
  }

  const badgeColor =
    progress >= 80 ? 'text-[#5C9E7A] bg-[#5C9E7A]/12' :
    progress >= 40 ? 'text-[#D4935A] bg-[#D4935A]/12' :
    'text-[#789A99] bg-[#789A99]/12';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="widget"
          initial={{ opacity: 0, y: 16 }}
          animate={
            celebrating
              ? { scale: 1, opacity: 1 }
              : { opacity: 1, y: 0 }
          }
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={
            celebrating
              ? { type: 'spring' as const, stiffness: 400, damping: 18 }
              : { delay: 0.05, type: 'spring' as const, stiffness: 280, damping: 24 }
          }
          className="bento-card p-5"
          style={{ boxShadow: '0 4px 24px rgba(120,154,153,0.10)' }}
        >
          {celebrating ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' as const, stiffness: 180, damping: 8 }}
                className="text-4xl"
              >
                🎉
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full"
              >
                <p className="text-sm font-bold text-[#2C1A14]">Ваш профіль ідеальний!</p>
                <p className="text-xs text-[#A8928D] mt-1 mb-4">
                  Ви готові приймати клієнтів на 100%
                </p>
                <motion.button
                  type="button"
                  onClick={handleCelebrationConfirm}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-2.5 rounded-2xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#5C7E7D] transition-colors"
                >
                  Вперед, до роботи →
                </motion.button>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Header: circle + text */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative shrink-0">
                  <CircleProgress progress={progress} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                      key={doneCount}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring' as const, stiffness: 400, damping: 22 }}
                      className="text-base font-bold text-[#2C1A14]"
                    >
                      {Math.round(progress)}%
                    </motion.span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2C1A14] leading-tight">
                    Сила вашого бренду
                  </p>
                  <p className="text-xs text-[#A8928D] mt-0.5 leading-snug">
                    Заповніть профіль, щоб клієнти обирали вас першими
                  </p>
                  <span
                    className={`inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badgeColor}`}
                  >
                    {doneCount} з {steps.length} кроків
                  </span>
                </div>
              </div>

              {/* Staggered incomplete steps */}
              <motion.div
                variants={listContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-0.5"
              >
                {incomplete.map(step => (
                  <motion.div key={step.key} variants={listItem}>
                    <Link href={step.href}>
                      <motion.div
                        whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.7)' }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-2xl cursor-pointer"
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-[#E8D5CF] bg-white/60 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#2C1A14]">{step.label}</p>
                          <p className="text-[11px] text-[#A8928D]">{step.sub}</p>
                        </div>
                        <ChevronRight size={13} className="text-[#A8928D] shrink-0" />
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
