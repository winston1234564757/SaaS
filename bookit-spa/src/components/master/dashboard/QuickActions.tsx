import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, BarChart2, Settings, Scissors, Users, CalendarDays } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { ManualBookingForm } from '@/components/master/bookings/ManualBookingForm';

export function QuickActions() {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-4"
      >
        <h2 className="heading-serif text-base text-[#2C1A14] mb-3">Швидкі дії</h2>
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
              <Link to="/dashboard/analytics"
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
              <Link to="/dashboard/settings"
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
              <Link to="/dashboard/services"
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
              <Link to="/dashboard/clients"
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
              <Link to="/dashboard/bookings"
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
    </>
  );
}
