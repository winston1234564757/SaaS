'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, ChevronRight } from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { useServices } from '@/lib/supabase/hooks/useServices';
import type { Service } from '@/components/master/services/types';

const LS_KEY = 'bookit_checklist_dismissed';

export function OnboardingChecklist() {
  const { masterProfile, isLoading } = useMasterContext();
  const { services }: { services: Service[] } = useServices();
  const [dismissed, setDismissed] = useState(true); // true to prevent flash

  useEffect(() => {
    setDismissed(localStorage.getItem(LS_KEY) === 'true');
  }, []);

  if (isLoading || !masterProfile || dismissed) return null;

  const hasServices = services.filter(s => s.active).length > 0;
  const hasBio = !!(masterProfile.bio?.trim());
  const isPublished = masterProfile.is_published;

  const steps: { done: boolean; label: string; href: string | null }[] = [
    { done: true,        label: 'Акаунт створено',               href: null },
    { done: hasServices, label: 'Додай першу послугу',           href: '/dashboard/services' },
    { done: hasBio,      label: 'Заповни опис профілю',          href: '/dashboard/settings' },
    { done: isPublished, label: 'Опублікуй свою сторінку',       href: '/dashboard/settings' },
  ];

  const doneCount = steps.filter(s => s.done).length;

  if (doneCount === steps.length) return null;

  const progress = (doneCount / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, type: 'spring', stiffness: 280, damping: 24 }}
      className="bento-card p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-[#2C1A14]">Налаштуй профіль 🚀</p>
          <p className="text-xs text-[#A8928D] mt-0.5">{doneCount} з {steps.length} кроків</p>
        </div>
        <button
          onClick={() => { localStorage.setItem(LS_KEY, 'true'); setDismissed(true); }}
          className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/60 text-[#A8928D] hover:text-[#6B5750] transition-colors flex-shrink-0"
        >
          <X size={13} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-[#F5E8E3] mb-4 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#789A99]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
        />
      </div>

      <div className="flex flex-col gap-1">
        {steps.map((step, i) =>
          step.href ? (
            <Link key={i} href={step.href}>
              <div className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-colors ${
                step.done ? 'opacity-50' : 'hover:bg-white/60 cursor-pointer'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done ? 'bg-[#5C9E7A]' : 'border-2 border-[#E8D5CF] bg-white/50'
                }`}>
                  {step.done && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
                <p className={`text-xs flex-1 ${step.done ? 'line-through text-[#A8928D]' : 'text-[#2C1A14] font-medium'}`}>
                  {step.label}
                </p>
                {!step.done && <ChevronRight size={13} className="text-[#A8928D]" />}
              </div>
            </Link>
          ) : (
            <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl opacity-50">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#5C9E7A]">
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
              <p className="text-xs flex-1 line-through text-[#A8928D]">{step.label}</p>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
