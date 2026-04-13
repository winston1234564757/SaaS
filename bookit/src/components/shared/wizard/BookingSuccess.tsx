'use client';
// src/components/shared/wizard/BookingSuccess.tsx
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { addMinutes, parse as parseFns, format as formatFns } from 'date-fns';
import { pluralize } from '@/lib/utils/dates';
import { PostBookingAuth } from '@/components/public/PostBookingAuth';
import { PushPrompt } from './PushPrompt';
import { MONTH_S, fmt, slide } from './helpers';
import type { WizardService, CartItem } from './types';

interface BookingSuccessProps {
  selectedServices: WizardService[];
  selectedDate: Date | null;
  selectedTime: string | null;
  totalDuration: number;
  cart: CartItem[];
  clientUserId: string | null;
  createdBookingId: string | null;
  clientPhone: string;
  masterName: string;
  flashDeal?: { id: string; discountPct: number; serviceName: string } | null;
  finalTotal: number;
  direction: number;
  onClose: () => void;
}

export function BookingSuccess({
  selectedServices,
  selectedDate,
  selectedTime,
  totalDuration,
  cart,
  clientUserId,
  createdBookingId,
  clientPhone,
  masterName,
  finalTotal,
  direction,
  onClose,
}: BookingSuccessProps) {
  return (
    <motion.div key="success" custom={direction} variants={slide}
      initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex flex-col items-center text-center py-6 gap-5">

      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 18 }}
        className="w-20 h-20 rounded-full bg-[#5C9E7A]/15 flex items-center justify-center">
        <Check size={36} className="text-[#5C9E7A]" strokeWidth={2.5} />
      </motion.div>

      <div>
        <h2 className="heading-serif text-2xl text-[#2C1A14]">Запис підтверджено!</h2>
        <p className="text-sm text-[#6B5750] mt-2 leading-relaxed">
          {selectedServices.length === 1 ? selectedServices[0].name : pluralize(selectedServices.length, ['послуга', 'послуги', 'послуг'])}
          {' — '}
          {selectedDate && `${selectedDate.getDate()} ${MONTH_S[selectedDate.getMonth()]}, `}
          <span className="font-semibold text-[#789A99]">
            {selectedTime && (() => {
              const endTime = formatFns(
                addMinutes(parseFns(selectedTime, 'HH:mm', new Date()), totalDuration),
                'HH:mm'
              );
              return `${selectedTime} – ${endTime}`;
            })()}
          </span>
        </p>
        {cart.length > 0 && (
          <p className="text-xs text-[#A8928D] mt-1">
            + {pluralize(cart.length, ['товар', 'товари', 'товарів'])} · {fmt(finalTotal)}
          </p>
        )}
        {masterName && (
          <p className="text-xs text-[#A8928D] mt-1">
            Очікуй підтвердження від {masterName} 🌸
          </p>
        )}
      </div>

      {!clientUserId && createdBookingId ? (
        <div className="w-full border-t border-[#F5E8E3] pt-5">
          <PostBookingAuth
            bookingId={createdBookingId}
            clientPhone={clientPhone.trim()}
            onSkip={onClose}
          />
        </div>
      ) : (
        <div className="w-full flex flex-col gap-3">
          <PushPrompt />
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm hover:bg-[#6B8C8B] active:scale-[0.98] transition-all"
          >
            Чудово!
          </button>
        </div>
      )}
    </motion.div>
  );
}
