'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy, Check, Users, Ticket, ArrowRight, Share2, Heart } from 'lucide-react';
import { pluralize } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

interface LoyaltyProgram {
  id: string;
  name: string;
  targetVisits: number;
  rewardType: string;
  rewardValue: number;
  currentVisits: number;
  masterId: string;
  masterSlug: string;
  masterName: string;
  masterEmoji: string;
}

interface BarterPromocode {
  id: string;
  discount: number;
  isUsed: boolean;
  masterName: string;
  masterSlug: string;
  masterEmoji: string;
  createdAt: string;
}

interface C2cMasterStat {
  masterId: string;
  masterSlug: string;
  masterName: string;
  masterEmoji: string;
  c2cDiscountPct: number;
  invited: number;
  completed: number;
  balance: number;
  shareLink: string;
}

interface Props {
  programs: LoyaltyProgram[];
  referralCode: string;
  totalMastersInvited: number;
  promocodes: BarterPromocode[];
  c2cMasters?: C2cMasterStat[];
}

export function MyLoyaltyPage({ programs, referralCode, totalMastersInvited, promocodes, c2cMasters = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'loyalty' | 'referral'>('loyalty');
  const [referralSubTab, setReferralSubTab] = useState<'c2c' | 'c2b'>('c2c');
  const [copied, setCopied] = useState<string | null>(null);

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/invite/${referralCode}` : `/invite/${referralCode}`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async (link: string, masterName: string, pct: number) => {
    const text = `Записуйся до ${masterName} зі знижкою −${pct}% за моїм посиланням:`;
    if (navigator.share) {
      navigator.share({ title: `Знижка до ${masterName}`, text, url: link }).catch(() => {});
    } else {
      copyToClipboard(link, link);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs */}
      <div className="flex p-1 bg-[#F5E8E3] rounded-2xl">
        <button
          onClick={() => setActiveTab('loyalty')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all",
            activeTab === 'loyalty' ? "bg-white text-[#2C1A14] shadow-sm" : "text-[#A8928D]"
          )}
        >
          <Gift size={14} />
          Лояльність
        </button>
        <button
          onClick={() => setActiveTab('referral')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all",
            activeTab === 'referral' ? "bg-white text-[#2C1A14] shadow-sm" : "text-[#A8928D]"
          )}
        >
          <Users size={14} />
          Refer & Earn
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'loyalty' ? (
          <motion.div
            key="loyalty"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-4"
          >
            <div className="bento-card p-5">
              <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Лояльність</h1>
              <p className="text-sm text-[#A8928D]">
                {programs.length > 0
                  ? pluralize(programs.length, ['активна програма', 'активні програми', 'активних програм'])
                  : 'Програми лояльності від майстрів'}
              </p>
            </div>

            {programs.length === 0 ? (
              <div className="bento-card p-10 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">🎁</span>
                <div>
                  <p className="text-sm font-semibold text-[#2C1A14]">Поки що програм лояльності немає</p>
                  <p className="text-xs text-[#A8928D] mt-1">Більше записів — більше бонусів!</p>
                </div>
                <Link
                  href="/my/masters"
                  className="mt-1 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#789A99] text-white text-xs font-bold hover:bg-[#5C7E7D] transition-colors shadow-lg shadow-[#789A99]/20"
                >
                  Знайти майстрів
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {programs.map((program, index) => (
                  <LoyaltyCard key={program.id} program={program} index={index} />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="referral"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col gap-4"
          >
            {/* Sub-tabs */}
            <div className="flex p-1 bg-[#F5E8E3] rounded-2xl">
              <button
                onClick={() => setReferralSubTab('c2c')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold rounded-xl transition-all",
                  referralSubTab === 'c2c' ? "bg-white text-[#2C1A14] shadow-sm" : "text-[#A8928D]"
                )}
              >
                <Heart size={12} /> Для подруг
              </button>
              <button
                onClick={() => setReferralSubTab('c2b')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold rounded-xl transition-all",
                  referralSubTab === 'c2b' ? "bg-white text-[#2C1A14] shadow-sm" : "text-[#A8928D]"
                )}
              >
                <Users size={12} /> Запросити майстра
              </button>
            </div>

            <AnimatePresence mode="wait">
              {referralSubTab === 'c2c' ? (
                <motion.div key="c2c" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="flex flex-col gap-3">
                  <div className="bento-card p-4" style={{ background: 'rgba(120,154,153,0.08)' }}>
                    <p className="text-xs font-semibold text-[#2C1A14]">Як це працює</p>
                    <p className="text-xs text-[#6B5750] mt-1 leading-relaxed">
                      Поділись посиланням на майстра. Подруга отримає знижку на перший візит, а ти накопиш бонус на свій наступний запис.
                    </p>
                  </div>

                  {c2cMasters.length === 0 ? (
                    <div className="bento-card p-10 text-center flex flex-col items-center gap-3">
                      <Share2 size={32} className="text-[#A8928D]" />
                      <div>
                        <p className="text-sm font-semibold text-[#2C1A14]">Поки що немає рефералів</p>
                        <p className="text-xs text-[#A8928D] mt-1">Поділись посиланням на майстра з подругою</p>
                      </div>
                    </div>
                  ) : (
                    c2cMasters.map((m, i) => (
                      <motion.div
                        key={m.masterId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bento-card p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#F5E8E3] flex items-center justify-center text-xl shrink-0">
                            {m.masterEmoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#2C1A14]">{m.masterName}</p>
                            <p className="text-xs text-[#A8928D]">
                              Запрошено: {m.invited} · Завершили: {m.completed} · Баланс: {m.balance}%
                            </p>
                          </div>
                          {m.balance > 0 && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#789A99]/15 text-[#789A99]">
                              +{m.balance}%
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShare(m.shareLink, m.masterName, m.c2cDiscountPct)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#789A99] text-white text-xs font-semibold hover:bg-[#6B8C8B] transition-colors"
                          >
                            <Share2 size={12} /> Поділитись
                          </button>
                          <button
                            onClick={() => copyToClipboard(m.shareLink, m.masterId)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/80 border border-white/80 text-xs font-medium text-[#6B5750] hover:bg-white transition-colors"
                          >
                            {copied === m.masterId ? <><Check size={12} /> Скопійовано</> : <><Copy size={12} /> Копіювати</>}
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div key="c2b" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex flex-col gap-4">
                  {/* C2B — existing Refer & Earn */}
                  <div className="bento-card overflow-hidden">
                    <div className="bg-[#789A99] p-5 text-white">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="heading-serif text-xl mb-1">Запрошуй майстра — отримай -50%</h2>
                          <p className="text-xs text-white/80 leading-relaxed">
                            За кожного нового майстра, що зареєструється за твоїм посиланням, ти отримаєш 50% знижки на перший візит до нього.
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                          🤝
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2 border border-white/20">
                        <div className="flex-1 px-2 font-mono text-sm truncate opacity-90">{inviteLink}</div>
                        <button
                          onClick={() => copyToClipboard(inviteLink, 'c2b')}
                          className="bg-white text-[#789A99] p-2 rounded-lg hover:bg-white/90 active:scale-95 transition-all"
                        >
                          {copied === 'c2b' ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-white/50 flex items-center justify-around border-t border-[#E8D0C8]">
                      <div className="text-center">
                        <p className="text-[10px] text-[#A8928D] uppercase tracking-wider mb-0.5">Запрошено</p>
                        <p className="text-lg font-bold text-[#2C1A14]">{totalMastersInvited}</p>
                      </div>
                      <div className="w-px h-8 bg-[#E8D0C8]" />
                      <div className="text-center">
                        <p className="text-[10px] text-[#A8928D] uppercase tracking-wider mb-0.5">Бонусів</p>
                        <p className="text-lg font-bold text-[#2C1A14]">{promocodes.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-[#2C1A14] uppercase tracking-widest pl-1">Твої Бартерні Промокоди</h3>
                    {promocodes.length === 0 ? (
                      <div className="bento-card p-8 border-dashed border-2 border-[#E8D0C8] bg-transparent text-center flex flex-col items-center gap-2">
                        <Ticket size={28} className="text-[#A8928D] opacity-50" />
                        <p className="text-sm text-[#A8928D]">Ще немає отриманих знижок</p>
                      </div>
                    ) : (
                      promocodes.map((pc, i) => (
                        <motion.div
                          key={pc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn("bento-card p-4 flex items-center justify-between gap-4", pc.isUsed && "opacity-60 bg-white/40 grayscale-[0.5]")}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F5E8E3] flex items-center justify-center text-xl shrink-0">{pc.masterEmoji}</div>
                            <div>
                              <p className="text-sm font-bold text-[#2C1A14]">{pc.masterName}</p>
                              <p className="text-[10px] text-[#A8928D]">Бартерний Промокод • {pc.discount}%</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="px-2 py-1 rounded-lg bg-[#789A99]/10 text-[#789A99] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Ticket size={10} />
                              {pc.isUsed ? 'Використано' : 'Активний'}
                            </div>
                            {!pc.isUsed && (
                              <Link href={`/${pc.masterSlug}`} className="text-[11px] font-semibold text-[#6B5750] hover:text-[#2C1A14] flex items-center gap-1">
                                Записатись <ArrowRight size={12} />
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function rewardLabel(type: string, value: number): string {
  if (type === 'discount_percent') return `Знижка ${value}%`;
  if (type === 'discount_fixed') return `Знижка ${value} ₴`;
  return 'Безкоштовна послуга';
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

      <p className="text-sm font-bold text-[#2C1A14] mb-3">{p.name}</p>

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

      <div className="flex items-center justify-between mt-2 gap-2">
        <span className="text-xs text-[#6B5750]">
          {p.currentVisits} з {p.targetVisits} візитів
        </span>
        <span className="text-xs font-semibold text-[#789A99]">
          {rewardLabel(p.rewardType, p.rewardValue)}
        </span>
      </div>

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
