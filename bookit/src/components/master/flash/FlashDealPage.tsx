'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { createFlashDeal, cancelFlashDeal } from '@/app/(master)/dashboard/flash/actions';
import type { FlashDealRow } from '@/app/(master)/dashboard/flash/page';
import { Zap, Clock, X, Send, ChevronDown, Users, CheckCircle2, AlertCircle, Crown } from 'lucide-react';
import { formatDurationFull, pluralize } from '@/lib/utils/dates';
import Link from 'next/link';

interface Props {
  activeDeals: FlashDealRow[];
  tier: string;
}

const DISCOUNT_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 50];
const EXPIRY_OPTIONS = [
  { label: '2 год',  value: 2 },
  { label: '4 год',  value: 4 },
  { label: '8 год',  value: 8 },
];

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

function timeUntil(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Минула';
  return formatDurationFull(Math.floor(diff / 60000));
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function FlashDealPage({ activeDeals, tier }: Props) {
  const { currentStep, nextStep, closeTour } = useTour('flash', 2);
  const [serviceName, setServiceName] = useState('');
  const [slotDate, setSlotDate] = useState(todayStr());
  const [slotTime, setSlotTime] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPct, setDiscountPct] = useState(20);
  const [expiresInHours, setExpiresInHours] = useState(4);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ error: string | null; sentTo: number } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const discountedPrice = originalPrice
    ? Math.round(Number(originalPrice) * (1 - discountPct / 100))
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !slotDate || !slotTime || !originalPrice) return;
    setLoading(true);
    setResult(null);
    const res = await createFlashDeal({
      serviceName,
      slotDate,
      slotTime,
      originalPrice: Number(originalPrice),
      discountPct,
      expiresInHours,
    });
    setResult(res);
    setLoading(false);
    if (!res.error) {
      setServiceName('');
      setSlotTime('');
      setOriginalPrice('');
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    await cancelFlashDeal(id);
    setCancellingId(null);
  };

  const starterLimitWarning = tier === 'starter' && activeDeals.length >= 2;

  return (
    <div className="flex flex-col gap-4 pb-8">

      {/* ── Header bento-card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
        className={cn(
          'relative bento-card p-5 transition-all duration-500',
          currentStep === 0 && 'tour-glow z-40 scale-[1.02]'
        )}
      >
        <AnchoredTooltip
          isOpen={currentStep === 0}
          onClose={closeTour}
          title="⚡ Створення акції"
          text="Потрібно терміново заповнити завтрашній день? Створіть флеш-акцію зі знижкою."
          position="bottom"
          primaryButtonText="Далі →"
          onPrimaryClick={nextStep}
        />
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#D4935A]/12 flex items-center justify-center shrink-0">
            <Zap size={22} className="text-[#D4935A]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="heading-serif text-xl text-[#2C1A14] leading-tight">Флеш-акції</h1>
            <p className="text-sm text-[#A8928D]">Заповни вільне вікно — сповісти клієнтів</p>
          </div>
          {tier === 'starter' && (
            <span className="text-xs bg-[#D4935A]/8 text-[#D4935A] border border-[#D4935A]/20 px-2.5 py-1 rounded-full font-semibold shrink-0">
              2/міс
            </span>
          )}
        </div>

        {/* Статистика активних */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <div className="p-3 rounded-2xl bg-white/50 border border-white/70">
            <p className="text-[10px] text-[#A8928D] uppercase tracking-wide">Активних акцій</p>
            <p className="text-xl font-bold text-[#D4935A] mt-0.5">{activeDeals.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/50 border border-white/70">
            <p className="text-[10px] text-[#A8928D] uppercase tracking-wide">Клієнтів отримало</p>
            <p className="text-xl font-bold text-[#2C1A14] mt-0.5">—</p>
          </div>
        </div>
      </motion.div>

      {/* ── Starter limit upgrade banner ── */}
      {starterLimitWarning && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-4 flex items-center gap-3"
          style={{ background: 'rgba(212,147,90,0.06)' }}
        >
          <div className="w-10 h-10 rounded-2xl bg-[#D4935A]/12 flex items-center justify-center shrink-0">
            <Crown size={18} className="text-[#D4935A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#2C1A14]">Ліміт Starter вичерпано</p>
            <p className="text-xs text-[#6B5750]">2 флеш-акції на місяць. Перейдіть на Pro для необмеженого доступу.</p>
          </div>
          <Link href="/dashboard/billing" className="text-xs font-bold text-[#D4935A] whitespace-nowrap hover:underline">
            Pro →
          </Link>
        </motion.div>
      )}

      {/* ── Create Form ── */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className={cn(
          'relative bento-card p-5 flex flex-col gap-4 transition-all duration-500',
          currentStep === 1 && 'tour-glow z-40 scale-[1.02]'
        )}
      >
        <AnchoredTooltip
          isOpen={currentStep === 1}
          onClose={closeTour}
          title="⏳ Ефект терміновості"
          text="Акція з'явиться на вашій сторінці з таймером. Це створює ефект FOMO та прискорює прийняття рішення клієнтом."
          position="bottom"
          primaryButtonText="Зрозуміло"
          onPrimaryClick={nextStep}
        />

        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#D4935A]" />
          <h2 className="text-sm font-bold text-[#2C1A14]">Нова флеш-акція</h2>
        </div>

        {/* Послуга */}
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Послуга</label>
          <input
            value={serviceName}
            onChange={e => setServiceName(e.target.value)}
            placeholder="Наприклад: Стрижка + укладка"
            className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8D5CF] text-sm text-[#2C1A14] placeholder-[#A8928D] focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 focus:border-[#D4935A]/50 transition-colors bg-white/60"
            required
          />
        </div>

        {/* Дата + Час */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Дата слоту</label>
            <input
              type="date"
              value={slotDate}
              min={todayStr()}
              onChange={e => setSlotDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8D5CF] text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 transition-colors bg-white/60"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Час слоту</label>
            <input
              type="time"
              value={slotTime}
              onChange={e => setSlotTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8D5CF] text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 transition-colors bg-white/60"
              required
            />
          </div>
        </div>

        {/* Ціна + Знижка */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Повна ціна (₴)</label>
            <input
              type="number"
              value={originalPrice}
              onChange={e => setOriginalPrice(e.target.value)}
              placeholder="500"
              min={50}
              max={99999}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8D5CF] text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 transition-colors bg-white/60"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Знижка</label>
            <div className="relative">
              <select
                value={discountPct}
                onChange={e => setDiscountPct(Number(e.target.value))}
                className="w-full appearance-none px-3.5 py-2.5 rounded-2xl border border-[#E8D5CF] text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 transition-colors bg-white/60"
              >
                {DISCOUNT_OPTIONS.map(d => (
                  <option key={d} value={d}>{d}%</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8928D] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Price preview */}
        <AnimatePresence>
          {discountedPrice !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-4 py-3 bg-[#D4935A]/8 border border-[#D4935A]/20 rounded-2xl">
                <Zap size={15} className="text-[#D4935A] shrink-0" />
                <span className="text-sm text-[#2C1A14]">
                  Клієнт заплатить{' '}
                  <span className="font-bold text-[#D4935A]">{discountedPrice} ₴</span>
                  {' '}замість{' '}
                  <span className="line-through text-[#A8928D]">{originalPrice} ₴</span>
                  {' '}
                  <span className="text-[#D4935A] font-semibold">(-{discountPct}%)</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Тривалість */}
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Акція діє</label>
          <div className="flex gap-2">
            {EXPIRY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExpiresInHours(opt.value)}
                className={`flex-1 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                  expiresInHours === opt.value
                    ? 'bg-[#D4935A] text-white border-[#D4935A] shadow-[0_2px_8px_rgba(212,147,90,0.3)]'
                    : 'bg-white/60 text-[#6B5750] border-[#E8D5CF] hover:border-[#D4935A]/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium ${
                result.error
                  ? 'bg-[#C05B5B]/8 text-[#C05B5B] border border-[#C05B5B]/20'
                  : 'bg-[#5C9E7A]/8 text-[#5C9E7A] border border-[#5C9E7A]/20'
              }`}>
                {result.error
                  ? <AlertCircle size={15} className="shrink-0" />
                  : <CheckCircle2 size={15} className="shrink-0" />
                }
                {result.error ?? `Акцію створено! Сповіщено ${pluralize(result.sentTo, ['клієнта', 'клієнти', 'клієнтів'])}.`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || starterLimitWarning}
          className="w-full flex items-center justify-center gap-2 bg-[#D4935A] hover:bg-[#C07840] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl py-3 text-sm transition-colors shadow-[0_4px_14px_rgba(212,147,90,0.3)]"
        >
          <Send size={15} />
          {loading ? 'Відправляємо...' : 'Запустити акцію та сповістити клієнтів'}
        </button>
      </motion.form>

      {/* ── Active Deals ── */}
      {activeDeals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.15 }}
          className="bento-card p-5 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-[#D4935A]" />
            <h2 className="text-sm font-bold text-[#2C1A14]">Активні акції</h2>
            <span className="ml-auto text-xs font-bold text-[#D4935A] bg-[#D4935A]/10 px-2 py-0.5 rounded-full">
              {activeDeals.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {activeDeals.map(deal => {
              const discounted = Math.round(deal.original_price * (1 - deal.discount_pct / 100));
              return (
                <div
                  key={deal.id}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#D4935A]/6 border border-[#D4935A]/15"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#D4935A]/12 flex items-center justify-center shrink-0">
                    <Zap size={16} className="text-[#D4935A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2C1A14] truncate">{deal.service_name}</p>
                    <p className="text-xs text-[#6B5750]">
                      {deal.slot_date} о {deal.slot_time.slice(0, 5)}
                      {' · '}
                      <span className="font-semibold text-[#D4935A]">{discounted} ₴</span>
                      {' '}
                      <span className="line-through text-[#A8928D]">{deal.original_price} ₴</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-[#D4935A] font-semibold">
                      <Clock size={10} />
                      {timeUntil(deal.expires_at)}
                    </div>
                    <button
                      onClick={() => handleCancel(deal.id)}
                      disabled={cancellingId === deal.id}
                      className="p-1.5 rounded-lg hover:bg-[#C05B5B]/10 text-[#A8928D] hover:text-[#C05B5B] transition-colors disabled:opacity-50"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Empty State ── */}
      {activeDeals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.15 }}
          className="bento-card p-6 flex flex-col items-center gap-4 text-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#D4935A]/10 flex items-center justify-center">
            <Zap size={28} className="text-[#D4935A]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#2C1A14]">Немає активних акцій</p>
            <p className="text-xs text-[#A8928D] mt-1 leading-relaxed">
              Запусти першу флеш-акцію, щоб заповнити вільний слот і залучити клієнтів
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#6B5750] bg-[#F5E8E3]/60 px-4 py-2 rounded-2xl">
            <Users size={12} className="text-[#789A99]" />
            Клієнти отримають Telegram-сповіщення
          </div>
        </motion.div>
      )}
    </div>
  );
}
