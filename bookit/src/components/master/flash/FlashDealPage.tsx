'use client';

import { useState } from 'react';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { createFlashDeal, cancelFlashDeal } from '@/app/(master)/dashboard/flash/actions';
import type { FlashDealRow } from '@/app/(master)/dashboard/flash/page';
import { Zap, Clock, X, Send, ChevronDown } from 'lucide-react';
import { formatDurationFull, pluralize } from '@/lib/utils/dates';

interface Props {
  activeDeals: FlashDealRow[];
  tier: string;
}

const DISCOUNT_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 50];
const EXPIRY_OPTIONS = [
  { label: '2 години', value: 2 },
  { label: '4 години', value: 4 },
  { label: '8 годин', value: 8 },
];

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="relative">
        <AnchoredTooltip
          isOpen={currentStep === 0}
          onClose={closeTour}
          title="⚡ Створення акції"
          text="Потрібно терміново заповнити завтрашній день? Створіть флеш-акцію зі знижкою."
          position="bottom"
          primaryButtonText="Далі →"
          onPrimaryClick={nextStep}
        />
      </div>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Zap size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2C1A14]">Флеш-акції</h1>
          <p className="text-sm text-[#A8928D]">Заповни вільне вікно — сповісти клієнтів</p>
        </div>
        {tier === 'starter' && (
          <span className="ml-auto text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">
            Starter: 2/міс
          </span>
        )}
      </div>

      {/* Create Form */}
      <div className="relative">
        <AnchoredTooltip
          isOpen={currentStep === 1}
          onClose={closeTour}
          title="⏳ Ефект терміновості"
          text="Акція з'явиться на вашій сторінці з таймером. Це створює ефект FOMO та прискорює прийняття рішення клієнтом."
          position="bottom"
          primaryButtonText="Зрозуміло"
          onPrimaryClick={nextStep}
        />
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E8D5CF]/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#2C1A14]">Нова флеш-акція</h2>

        {starterLimitWarning && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Ліміт Starter: 2 флеш-акції на місяць. Перейдіть на Pro для необмеженого доступу.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1 block">Послуга</label>
            <input
              value={serviceName}
              onChange={e => setServiceName(e.target.value)}
              placeholder="Наприклад: Стрижка + укладка"
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#6B5750] mb-1 block">Дата слоту</label>
              <input
                type="date"
                value={slotDate}
                min={todayStr()}
                onChange={e => setSlotDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B5750] mb-1 block">Час слоту</label>
              <input
                type="time"
                value={slotTime}
                onChange={e => setSlotTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#6B5750] mb-1 block">Повна ціна (₴)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={e => setOriginalPrice(e.target.value)}
                placeholder="500"
                min={50}
                max={99999}
                className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B5750] mb-1 block">Знижка</label>
              <div className="relative">
                <select
                  value={discountPct}
                  onChange={e => setDiscountPct(Number(e.target.value))}
                  className="w-full appearance-none px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40 bg-white"
                >
                  {DISCOUNT_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}%</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8928D] pointer-events-none" />
              </div>
            </div>
          </div>

          {discountedPrice !== null && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl">
              <Zap size={14} className="text-amber-600 flex-shrink-0" />
              <span className="text-sm text-[#2C1A14]">
                Клієнт заплатить{' '}
                <span className="font-bold text-amber-700">{discountedPrice} ₴</span>
                {' '}замість{' '}
                <span className="line-through text-[#A8928D]">{originalPrice} ₴</span>
                {' '}(-{discountPct}%)
              </span>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1 block">Акція діє</label>
            <div className="flex gap-2">
              {EXPIRY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpiresInHours(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    expiresInHours === opt.value
                      ? 'bg-[#789A99] text-white border-[#789A99]'
                      : 'bg-white text-[#6B5750] border-[#E8D5CF] hover:border-[#789A99]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {result && (
          <div className={`text-xs rounded-xl px-3 py-2 ${result.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {result.error ?? `✅ Акцію створено! Сповіщено ${pluralize(result.sentTo, ['клієнта', 'клієнти', 'клієнтів'])}.`}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || starterLimitWarning}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
        >
          <Send size={15} />
          {loading ? 'Відправляємо...' : 'Запустити акцію та сповістити клієнтів'}
        </button>
      </form>

      {/* Active Deals */}
      {activeDeals.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8D5CF]/60 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#2C1A14]">Активні акції</h2>
          <div className="space-y-2">
            {activeDeals.map(deal => {
              const discounted = Math.round(deal.original_price / 100 * (1 - deal.discount_pct / 100));
              return (
                <div key={deal.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <Zap size={16} className="text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C1A14] truncate">{deal.service_name}</p>
                    <p className="text-xs text-[#6B5750]">
                      {deal.slot_date} о {deal.slot_time.slice(0, 5)} · {discounted} ₴ (-{deal.discount_pct}%)
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-700 flex-shrink-0">
                    <Clock size={12} />
                    {timeUntil(deal.expires_at)}
                  </div>
                  <button
                    onClick={() => handleCancel(deal.id)}
                    disabled={cancellingId === deal.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-[#A8928D] hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeDeals.length === 0 && (
        <div className="text-center py-10 text-[#A8928D]">
          <Zap size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Немає активних акцій</p>
          <p className="text-xs mt-1">Запусти першу флеш-акцію, щоб заповнити вільний слот</p>
        </div>
      )}
    </div>
  );
}
