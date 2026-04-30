'use client';

import { ImagePlay, Sparkles, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';

export function MarketingWidget() {
  const { todayCount, todayPending } = useDashboardStats();

  // Nudge logic: if few bookings today, suggest stories
  const needsPromo = todayCount < 3;

  return (
    <div className="p-6 h-full flex flex-col bg-gradient-to-br from-sage/5 to-primary/5">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-2xl bg-white/60 flex items-center justify-center shadow-sm">
          <ImagePlay size={20} className="text-primary" />
        </div>
        <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-full border border-white/80 shadow-sm">
          <Sparkles size={12} className="text-warning" />
          <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Розумна порада</span>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-display text-xl font-bold text-foreground leading-tight">
          {needsPromo ? 'Час наповнити графік!' : 'Ваш стиль — ваш бренд'}
        </h3>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {needsPromo 
            ? 'Створіть "вікно" в сторіз прямо зараз, щоб отримати нові записи на сьогодні.'
            : 'Поділіться своїми успіхами з підписниками через люксові сторіз.'}
        </p>
      </div>

      <div className="mt-4">
        <Link 
          href="/dashboard/marketing"
          className="group flex items-center justify-between bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <div className="flex items-center gap-2">
            <Zap size={16} fill="currentColor" />
            <span className="text-sm font-bold">Створити Сторіз</span>
          </div>
          <ChevronRight size={18} className="opacity-60 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
