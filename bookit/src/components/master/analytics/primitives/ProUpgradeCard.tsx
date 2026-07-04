'use client';

import { motion } from 'framer-motion';
import { Crown, TrendingUp, Users, Star, BarChart2, Download } from 'lucide-react';
import Link from 'next/link';

const SPRING = { type: 'spring' as const, stiffness: 100, damping: 20 };

export function ProUpgradeCard() {
  return (
    <motion.div
      data-testid="upgrade-prompt"
      className="bento-card p-6 relative overflow-hidden flex flex-col justify-between h-full min-h-[320px]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.1 }}
    >
      {/* Декоративні розмиті сфери для аури */}
      <div className="absolute -top-8 -right-8 size-32 bg-primary/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 size-24 bg-success/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center gap-3 mb-5 relative">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-[0_4px_14px_var(--accent-light)] flex-shrink-0">
            <Crown size={19} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Глибока аналітика</p>
            <p className="text-[11px] text-text-sub">Доступно з Pro-тарифом</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6 relative">
          {[
            { icon: TrendingUp, label: 'Прогноз виручки на наступний місяць' },
            { icon: Users, label: 'Теплова карта зайнятості за годинами' },
            { icon: Star, label: 'Когортний аналіз утримання клієнтів' },
            { icon: BarChart2, label: 'Аналіз зв\'язків послуг (cross-sell)' },
            { icon: Download, label: 'LTV аналіз та розумне ціноутворення' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="size-7 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon size={13} className="text-primary" />
              </div>
              <p className="text-[13px] text-text-sub">{f.label}</p>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/dashboard/billing"
        className="relative flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-sm font-semibold shadow-[var(--btn-primary-shadow)] hover:opacity-90 active:scale-[0.95] cursor-pointer transition-all duration-100"
      >
        <Crown size={15} />
        Перейти на Pro — 700₴/міс
      </Link>
    </motion.div>
  );
}
