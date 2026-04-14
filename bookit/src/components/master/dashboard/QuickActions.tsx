'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus, BarChart2, Settings, Scissors, Users, CalendarDays, Zap, TrendingUp } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { ManualBookingForm } from '@/components/master/bookings/ManualBookingForm';
import { FlashDealDrawer } from '@/components/master/dashboard/FlashDealDrawer';
import { PricingDrawer } from '@/components/master/dashboard/PricingDrawer';

export function QuickActions() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-4"
      >
        <h2 className="heading-serif text-base text-[#2C1A14] mb-3">Швидкі дії</h2>

        {/* ── Маркетинг ── */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A8928D] mb-2">
            Маркетинг
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Tooltip
              content={<p className="text-[11px] text-[#2C1A14]">Запустити знижку на вільний слот</p>}
              position="top"
              delay={400}
            >
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setFlashOpen(true)}
                className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all hover:bg-white/50 w-full"
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#D4935A] shadow-[0_4px_14px_rgba(212,147,90,0.38)]">
                  <Zap size={18} className="text-white" />
                </div>
                <span className="text-[10px] font-medium text-[#6B5750] text-center leading-tight">
                  Флеш-акція
                </span>
              </motion.button>
            </Tooltip>

            <Tooltip
              content={<p className="text-[11px] text-[#2C1A14]">Пікові години, тихий час, рання бронь</p>}
              position="top"
              delay={400}
            >
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setPricingOpen(true)}
                className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all hover:bg-white/50 w-full"
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#789A99] shadow-[0_4px_14px_rgba(120,154,153,0.38)]">
                  <TrendingUp size={18} className="text-white" />
                </div>
                <span className="text-[10px] font-medium text-[#6B5750] text-center leading-tight">
                  Ціноутворення
                </span>
              </motion.button>
            </Tooltip>
          </div>
        </div>

        {/* ── Дільник ── */}
        <div className="border-t border-white/40 mb-3" />

        <div className="grid grid-cols-3 gap-2">

          {/* Новий запис */}
          <Tooltip content={<p className="text-[11px] text-[#2C1A14]">Створити запис вручну для клієнта</p>} position="top" delay={400}>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setBookingOpen(true)}
              className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all hover:bg-white/50 w-full"
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#789A99] shadow-[0_4px_14px_rgba(120,154,153,0.38)]">
                <Plus size={18} className="text-white" />
              </div>
              <span className="text-[10px] font-medium text-[#6B5750] text-center leading-tight">Новий запис</span>
            </motion.button>
          </Tooltip>

          {/* Аналітика */}
          <Tooltip content={<p className="text-[11px] text-[#2C1A14]">Звіти, виручка та статистика</p>} position="top" delay={400}>
            <motion.div whileTap={{ scale: 0.94 }} className="w-full">
              <Link href="/dashboard/analytics"
                className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all hover:bg-white/50 w-full">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/70 border border-white/80">
                  <BarChart2 size={18} className="text-[#6B5750]" />
                </div>
                <span className="text-[10px] font-medium text-[#6B5750] text-center leading-tight">Аналітика</span>
              </Link>
            </motion.div>
          </Tooltip>

          {/* Налаштування */}
          <Tooltip content={<p className="text-[11px] text-[#2C1A14]">Профіль, послуги та тема оформлення</p>} position="top" delay={400}>
            <motion.div whileTap={{ scale: 0.94 }} className="w-full">
              <Link href="/dashboard/settings"
                className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all hover:bg-white/50 w-full">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/70 border border-white/80">
                  <Settings size={18} className="text-[#6B5750]" />
                </div>
                <span className="text-[10px] font-medium text-[#6B5750] text-center leading-tight">Налаштування</span>
              </Link>
            </motion.div>
          </Tooltip>

          {/* Послуги */}
          <Tooltip content={<p className="text-[11px] text-[#2C1A14]">Керувати списком послуг та цінами</p>} position="top" delay={400}>
            <motion.div whileTap={{ scale: 0.94 }} className="w-full">
              <Link href="/dashboard/services"
                className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all hover:bg-white/50 w-full">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/70 border border-white/80">
                  <Scissors size={18} className="text-[#6B5750]" />
                </div>
                <span className="text-[10px] font-medium text-[#6B5750] text-center leading-tight">Послуги</span>
              </Link>
            </motion.div>
          </Tooltip>

          {/* Клієнти */}
          <Tooltip content={<p className="text-[11px] text-[#2C1A14]">CRM: база клієнтів та VIP</p>} position="top" delay={400}>
            <motion.div whileTap={{ scale: 0.94 }} className="w-full">
              <Link href="/dashboard/clients"
                className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all hover:bg-white/50 w-full">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/70 border border-white/80">
                  <Users size={18} className="text-[#6B5750]" />
                </div>
                <span className="text-[10px] font-medium text-[#6B5750] text-center leading-tight">Клієнти</span>
              </Link>
            </motion.div>
          </Tooltip>

          {/* Записи */}
          <Tooltip content={<p className="text-[11px] text-[#2C1A14]">Усі записи: пошук, статуси, CSV</p>} position="top" delay={400}>
            <motion.div whileTap={{ scale: 0.94 }} className="w-full">
              <Link href="/dashboard/bookings"
                className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all hover:bg-white/50 w-full">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/70 border border-white/80">
                  <CalendarDays size={18} className="text-[#6B5750]" />
                </div>
                <span className="text-[10px] font-medium text-[#6B5750] text-center leading-tight">Записи</span>
              </Link>
            </motion.div>
          </Tooltip>
        </div>
      </motion.div>

      <ManualBookingForm
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
      <FlashDealDrawer isOpen={flashOpen} onClose={() => setFlashOpen(false)} />
      <PricingDrawer isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />
    </>
  );
}
