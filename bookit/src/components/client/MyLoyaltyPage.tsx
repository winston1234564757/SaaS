'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy, Check, Users, Ticket, ArrowRight, Share2, Heart } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';
import { cn } from '@/lib/utils/cn';
import { ClientPageHero } from './ClientPageHero';
import { monogramHue, initialOf, CORMORANT } from '@/components/public/explore/shared';

/** Master avatar - photo, else a designed monogram (Frost hue + serif initial). No emoji. */
function MasterAvatar({
  name, slug, avatarUrl, className, monogramClass = 'text-lg',
}: { name: string; slug?: string; avatarUrl?: string | null; className: string; monogramClass?: string }) {
  if (avatarUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={avatarUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }
  const hue = monogramHue(name || slug || '');
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center ${className}`}
      style={{ background: `linear-gradient(140deg, hsl(${hue} 48% 91%), hsl(${hue} 54% 79%))` }}
    >
      <span className={`${monogramClass} leading-none select-none`} style={{ fontFamily: CORMORANT, color: `hsl(${hue} 42% 40%)` }}>
        {initialOf(name)}
      </span>
    </div>
  );
}

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
  masterAvatarUrl?: string | null;
}

interface BarterPromocode {
  id: string;
  discount: number;
  isUsed: boolean;
  masterName: string;
  masterSlug: string;
  masterEmoji: string;
  masterAvatarUrl?: string | null;
  createdAt: string;
}

interface C2cMasterStat {
  masterId: string;
  masterSlug: string;
  masterName: string;
  masterEmoji: string;
  masterAvatarUrl?: string | null;
  c2cDiscountPct: number;
  invited: number;
  completed: number;
  balance: number;
  shareLink: string;
}

interface Props {
  programs: LoyaltyProgram[];
  c2cCode: string;
  c2bCode: string;
  totalMastersInvited: number;
  promocodes: BarterPromocode[];
  c2cMasters?: C2cMasterStat[];
}

export function MyLoyaltyPage({ programs, c2cCode, c2bCode, totalMastersInvited, promocodes, c2cMasters = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'loyalty' | 'referral'>('loyalty');
  const [referralSubTab, setReferralSubTab] = useState<'c2c' | 'c2b'>('c2c');
  const [copied, setCopied] = useState<string | null>(null);

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/invite/${c2bCode}` : `/invite/${c2bCode}`;

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
    <div className="flex flex-col gap-5 lg:px-8 lg:py-8 lg:max-w-5xl lg:mx-auto lg:w-full">
      <ClientPageHero
        title="Бонуси"
        subtitle="Програми лояльності та реферальні знижки"
        glowColor="#FBBF24"
      />

      {/* Tabs */}
      <div className="flex p-1 bg-secondary rounded-xl lg:max-w-md">
        <button
          type="button"
          aria-pressed={activeTab === 'loyalty'}
          onClick={() => setActiveTab('loyalty')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all active:scale-[0.97] cursor-pointer",
            activeTab === 'loyalty' ? "bg-background text-foreground shadow-sm" : "text-text-sub"
          )}
        >
          <Gift size={14} />
          Лояльність
        </button>
        <button
          type="button"
          aria-pressed={activeTab === 'referral'}
          onClick={() => setActiveTab('referral')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all active:scale-[0.97] cursor-pointer",
            activeTab === 'referral' ? "bg-background text-foreground shadow-sm" : "text-text-sub"
          )}
        >
          <Users size={14} />
          Ділись та заробляй
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {activeTab === 'loyalty' ? (
          <motion.div
            key="loyalty"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-4"
          >
            {programs.length > 0 && (
              <p className="text-[11px] font-bold text-text-sub uppercase tracking-[0.14em] px-1">
                {pluralUk(programs.length, 'активна програма', 'активні програми', 'активних програм')}
              </p>
            )}

            {programs.length === 0 ? (
              <div className="bento-card p-10 text-center flex flex-col items-center gap-3">
                <Gift size={40} className="text-text-sub" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Поки що програм лояльності немає</p>
                  <p className="text-xs text-text-sub mt-1">Більше записів — більше бонусів!</p>
                </div>
                <Link
                  href="/my/masters"
                  className="mt-1 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 active:scale-[0.97] cursor-pointer transition-all"
                >
                  Знайти майстрів
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="flex p-1 bg-secondary rounded-xl lg:max-w-md">
              <button
                type="button"
                aria-pressed={referralSubTab === 'c2c'}
                onClick={() => setReferralSubTab('c2c')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold rounded-lg transition-all active:scale-[0.97] cursor-pointer",
                  referralSubTab === 'c2c' ? "bg-background text-foreground shadow-sm" : "text-text-sub"
                )}
              >
                <Heart size={12} /> Для подруг
              </button>
              <button
                type="button"
                aria-pressed={referralSubTab === 'c2b'}
                onClick={() => setReferralSubTab('c2b')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold rounded-lg transition-all active:scale-[0.97] cursor-pointer",
                  referralSubTab === 'c2b' ? "bg-background text-foreground shadow-sm" : "text-text-sub"
                )}
              >
                <Users size={12} /> Запросити майстра
              </button>
            </div>

            <AnimatePresence mode="popLayout">
              {referralSubTab === 'c2c' ? (
                <motion.div key="c2c" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="flex flex-col gap-3">
                  <div className="bento-card p-4 bg-secondary/40 border border-secondary/20">
                    <p className="text-xs font-semibold text-foreground">Як це працює</p>
                    <p className="text-xs text-text-sub mt-1 leading-relaxed">
                      Поділись посиланням на майстра. Подруга отримає знижку на перший візит, а ти накопиш бонус на свій наступний запис.
                    </p>
                  </div>

                  {c2cMasters.length === 0 ? (
                    <div className="bento-card p-10 text-center flex flex-col items-center gap-3">
                      <Share2 size={32} className="text-text-sub" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Поки що немає рефералів</p>
                        <p className="text-xs text-text-sub mt-1">Поділись посиланням на майстра з подругою</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {c2cMasters.map((m, i) => (
                      <motion.div
                        key={m.masterId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bento-card p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <MasterAvatar name={m.masterName} slug={m.masterSlug} avatarUrl={m.masterAvatarUrl} className="size-10 rounded-lg shrink-0" monogramClass="text-lg" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{m.masterName}</p>
                            <p className="text-xs text-text-sub">
                              Запрошено: {m.invited} · Завершили: {m.completed} · Отримано: {m.completed * m.c2cDiscountPct}% · Баланс: {m.balance}%
                            </p>
                          </div>
                          {m.balance > 0 && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-accent/15 text-accent">
                              +{m.balance}%
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleShare(m.shareLink, m.masterName, m.c2cDiscountPct)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.97] cursor-pointer transition-all"
                          >
                            <Share2 size={12} /> Поділитись
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(m.shareLink, m.masterId)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary/80 border border-border text-xs font-medium text-text-sub hover:bg-secondary active:scale-[0.97] cursor-pointer transition-all"
                          >
                            {copied === m.masterId ? <><Check size={12} /> Скопійовано</> : <><Copy size={12} /> Копіювати</>}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="c2b" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex flex-col gap-4 lg:max-w-2xl">
                  <div className="bento-card overflow-hidden border-none shadow-xl shadow-accent/10">
                    <div className="bg-gradient-to-br from-accent to-accent/80 p-6 text-primary-foreground relative overflow-hidden">
                      <div className="absolute -right-6 -top-6 size-32 bg-accent-foreground/10 rounded-full blur-2xl" />

                      <div className="flex justify-between items-start mb-5 relative z-10">
                        <div className="max-w-[70%]">
                          <h2 className="heading-serif text-xl mb-1.5 leading-tight">Приводь майстрів — отримуй -50% для себе</h2>
                          <p className="text-xs text-primary-foreground/80 leading-relaxed">
                            За кожного нового майстра, що зареєструється за твоїм посиланням, ти отримаєш 50% знижки на перший візит до нього.
                          </p>
                        </div>
                        <div className="size-14 bg-accent-foreground/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-accent-foreground/10">
                          <Gift size={24} style={{ color: 'var(--accent-on)' }} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60 ml-1">Твоє посилання для майстрів</p>
                        <div className="flex items-center gap-2 bg-accent-foreground/10 backdrop-blur-md rounded-md p-2.5 border border-accent-foreground/10 shadow-inner">
                          <div className="flex-1 px-3 font-mono text-[13px] truncate text-primary-foreground/90">{inviteLink}</div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(inviteLink, 'c2b')}
                            aria-label={copied === 'c2b' ? 'Скопійовано' : 'Скопіювати'}
                            className="bg-primary-foreground text-accent p-2.5 rounded-lg hover:opacity-90 active:scale-[0.97] cursor-pointer transition-all shadow-sm"
                          >
                            {copied === 'c2b' ? <Check size={18} /> : <Copy size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 bg-secondary/60 backdrop-blur-sm flex items-center justify-around border-t border-border/30">
                      <div className="text-center">
                        <p className="text-[10px] text-text-sub font-bold uppercase tracking-wider mb-1">Запрошено</p>
                        <p className="text-xl font-bold text-foreground">{totalMastersInvited}</p>
                      </div>
                      <div className="w-px h-10 bg-border/40" />
                      <div className="text-center">
                        <p className="text-[10px] text-text-sub font-bold uppercase tracking-wider mb-1">Бонусів</p>
                        <p className="text-xl font-bold text-foreground">{promocodes.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex items-center gap-2 px-1">
                      <Ticket size={14} className="text-accent/60" />
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Твої Бонуси за Майстрів</h3>
                    </div>
                    {promocodes.length === 0 ? (
                      <div className="bento-card p-10 border-dashed border-2 border-border/40 bg-secondary/20 text-center flex flex-col items-center gap-3">
                        <div className="size-12 rounded-full bg-secondary/20 flex items-center justify-center">
                          <Ticket size={24} className="text-text-sub" />
                        </div>
                        <p className="text-sm font-medium text-text-sub">Ще немає отриманих знижок</p>
                      </div>
                    ) : (
                      promocodes.map((pc, i) => (
                        <motion.div
                          key={pc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                            "bento-card p-4 flex items-center justify-between gap-4 transition-all hover:shadow-md",
                            pc.isUsed && "opacity-60 bg-secondary/40 grayscale-[0.5]"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <MasterAvatar name={pc.masterName} slug={pc.masterSlug} avatarUrl={pc.masterAvatarUrl} className="size-11 rounded-lg shrink-0 shadow-inner" monogramClass="text-lg" />
                            <div>
                              <p className="text-sm font-bold text-foreground">{pc.masterName}</p>
                              <p className="text-[10px] text-text-sub font-medium">Бонус за рекомендацію • {pc.discount}%</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <div className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm",
                              pc.isUsed ? "bg-secondary text-text-sub" : "bg-accent/15 text-accent"
                            )}>
                              {pc.isUsed ? (
                                <>Використано</>
                              ) : (
                                <><div className="size-1.5 rounded-full bg-accent animate-pulse" /> Активний</>
                              )}
                            </div>
                            {!pc.isUsed && (
                              <Link href={`/${pc.masterSlug}`} className="text-[11px] font-bold text-accent hover:text-accent/80 flex items-center gap-1 active:scale-[0.97] cursor-pointer transition-all">
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
  if (type === 'percent_discount' || type === 'discount_percent') return `Знижка ${value}%`;
  if (type === 'fixed_discount' || type === 'discount_fixed') return `Знижка ${value} ₴`;
  return `Знижка ${value}%`;
}

function LoyaltyCard({ program: p, index }: { program: LoyaltyProgram; index: number }) {
  const percent = Math.min((p.currentVisits / p.targetVisits) * 100, 100);
  const isCompleted = p.currentVisits >= p.targetVisits;
  const SPRING = { type: 'spring' as const, stiffness: 300, damping: 24 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, ...SPRING }}
      className="bento-card overflow-hidden"
    >
      {/* Top avatar strip */}
      <div className="h-16 bg-accent/8 flex items-center justify-center relative">
        <MasterAvatar name={p.masterName} slug={p.masterSlug} avatarUrl={p.masterAvatarUrl} className="size-12 rounded-full border-2 border-background shadow-sm" monogramClass="text-xl" />
        {isCompleted && (
          <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-success text-white leading-none">
            Готово
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Master name + book CTA */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-sm font-semibold text-foreground truncate">{p.masterName}</span>
          <Link
            href={`/${p.masterSlug}`}
            className="flex-shrink-0 text-[11px] font-semibold text-accent-foreground bg-accent px-3 py-1.5 rounded-lg hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer min-h-[32px] flex items-center"
          >
            Записатись
          </Link>
        </div>

        {/* Program name */}
        <p className="text-xs text-text-sub mb-3 leading-snug">{p.name}</p>

        {/* Visit counter */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-bold text-foreground tabular-nums">{p.currentVisits}</span>
          <span className="text-sm text-text-sub">/ {p.targetVisits} візитів</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-border/60">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ delay: index * 0.06 + 0.15, duration: 0.7, ease: 'easeOut' }}
          />
        </div>

        {/* Reward label */}
        <p className="text-xs font-semibold text-accent mt-2">
          {rewardLabel(p.rewardType, p.rewardValue)}
        </p>

        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.06 + 0.4, ...SPRING }}
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10"
          >
            <Check size={13} className="text-success shrink-0" />
            <p className="text-xs font-medium text-success">Нагорода готова! Запишись щоб отримати</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
