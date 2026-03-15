'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';

interface LoyaltyProgram {
  id: string;
  name: string;
  targetVisits: number;
  rewardType: string; // 'discount_percent' | 'discount_fixed' | 'free_service'
  rewardValue: number;
  currentVisits: number;
  masterId: string;
  masterSlug: string;
  masterName: string;
  masterEmoji: string;
}

function rewardLabel(type: string, value: number): string {
  if (type === 'discount_percent') return `Знижка ${value}%`;
  if (type === 'discount_fixed') return `Знижка ${value} ₴`;
  return 'Безкоштовна послуга';
}

export function MyLoyaltyPage({ programs }: { programs: LoyaltyProgram[] }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Лояльність</h1>
        <p className="text-sm text-[#A8928D]">
          {programs.length > 0
            ? `${programs.length} активн${programs.length === 1 ? 'а програма' : programs.length < 5 ? 'і програми' : 'их програм'}`
            : 'Програми лояльності від майстрів'}
        </p>
      </div>

      {/* Empty state */}
      {programs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="bento-card p-10 text-center flex flex-col items-center gap-3"
        >
          <span className="text-4xl">🎁</span>
          <div>
            <p className="text-sm font-semibold text-[#2C1A14]">Поки що програм лояльності немає</p>
            <p className="text-xs text-[#A8928D] mt-1">Більше записів — більше бонусів!</p>
          </div>
          <Link
            href="/my/masters"
            className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#789A99] text-white text-xs font-semibold hover:bg-[#5C7E7D] transition-colors"
          >
            <Gift size={14} />
            Знайти майстрів
          </Link>
        </motion.div>
      )}

      {/* Program cards */}
      {programs.length > 0 && (
        <div className="flex flex-col gap-3">
          {programs.map((program, index) => (
            <LoyaltyCard key={program.id} program={program} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function LoyaltyCard({ program: p, index }: { program: LoyaltyProgram; index: number }) {
  const percent = Math.min((p.currentVisits / p.targetVisits) * 100, 100);
  const isCompleted = p.currentVisits >= p.targetVisits;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
      className="bento-card p-4"
    >
      {/* Top row: master info + book link */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: 'rgba(255, 210, 194, 0.55)' }}
          >
            {p.masterEmoji}
          </div>
          <span className="text-sm font-medium text-[#2C1A14] truncate">{p.masterName}</span>
        </div>
        <Link
          href={`/${p.masterSlug}`}
          className="flex-shrink-0 text-[11px] font-semibold text-[#789A99] hover:text-[#5C7E7D] transition-colors px-2.5 py-1 rounded-xl bg-[#789A99]/10 hover:bg-[#789A99]/20"
        >
          Записатись
        </Link>
      </div>

      {/* Program name */}
      <p className="text-sm font-bold text-[#2C1A14] mb-3">{p.name}</p>

      {/* Progress bar */}
      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ background: '#F5E8E3' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: '#789A99' }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ delay: index * 0.06 + 0.15, duration: 0.7, ease: 'easeOut' }}
        />
      </div>

      {/* Progress info + reward */}
      <div className="flex items-center justify-between mt-2 gap-2">
        <span className="text-xs text-[#6B5750]">
          {p.currentVisits} з {p.targetVisits} візитів
        </span>
        <span className="text-xs font-semibold text-[#789A99]">
          {rewardLabel(p.rewardType, p.rewardValue)}
        </span>
      </div>

      {/* Completed state */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.06 + 0.4, type: 'spring', stiffness: 300, damping: 20 }}
          className="mt-3 flex items-center gap-2 px-3 py-2 rounded-2xl"
          style={{ background: 'rgba(92, 158, 122, 0.12)' }}
        >
          <span className="text-base">✅</span>
          <p className="text-xs font-medium" style={{ color: '#5C9E7A' }}>
            Нагорода готова! Запишись щоб отримати
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
