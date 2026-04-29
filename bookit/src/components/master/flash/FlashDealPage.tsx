'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { createFlashDeal, cancelFlashDeal } from '@/app/(master)/dashboard/flash/actions';
import { useFlashDeals, useFlashDealsCount, useFlashDealsInvalidate } from '@/lib/supabase/hooks/useFlashDeals';
import type { FlashDealRow } from '@/app/(master)/dashboard/flash/page';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import { useMasterContext } from '@/lib/supabase/context';
import { generateAvailableSlots } from '@/lib/utils/smartSlots';
import {
  Zap, Clock, X, Send, ChevronDown, Users,
  CheckCircle2, AlertCircle, Crown, Sparkles, Loader2, CalendarX,
} from 'lucide-react';
import { formatDurationFull, pluralize } from '@/lib/utils/dates';
import Link from 'next/link';

interface Props {
  activeDeals?: FlashDealRow[];
  tier?: string;
  usedThisMonth?: number;
  isDrawer?: boolean;
}

const STARTER_LIMIT = 5;
const DISCOUNT_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 50];
const EXPIRY_OPTIONS = [
  { label: '2 год',  value: 2 },
  { label: '4 год',  value: 4 },
  { label: '8 год',  value: 8 },
];
// getDay() → 0=sun … 6=sat
const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

function timeUntil(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Минула';
  return formatDurationFull(Math.floor(diff / 60000));
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function progressBarColor(used: number): string {
  if (used >= STARTER_LIMIT) return '#C05B5B';
  if (used >= 3) return '#D4935A';
  return '#5C9E7A';
}

export function FlashDealPage({ activeDeals: initialDeals, tier: initialTier, usedThisMonth: initialCount, isDrawer }: Props) {
  const { masterProfile, isLoading: masterLoading } = useMasterContext();
  const tier = initialTier ?? masterProfile?.subscription_tier ?? 'starter';

  const invalidateDeals = useFlashDealsInvalidate();
  const { data: activeDeals = initialDeals ?? [], isLoading: dealsLoading } = useFlashDeals(initialDeals);
  const { data: usedThisMonth = initialCount ?? 0, isLoading: countLoading } = useFlashDealsCount();
  
  const { services } = useServices();
  const masterId = masterProfile?.id;

  const isLoading = (masterLoading || dealsLoading || countLoading) && !initialDeals;

  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('flash', 2, {
    initialSeen: seenTours?.flash ?? false,
    masterId: masterProfile?.id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-6 animate-pulse">
        <div className="h-40 bg-white/40 border border-white/60 rounded-3xl" />
        <div className="h-64 bg-white/40 border border-white/60 rounded-3xl" />
      </div>
    );
  }


  const activeServices = useMemo(() => services.filter(s => s.active), [services]);

  const [serviceId, setServiceId]         = useState('');
  const [slotDate, setSlotDate]           = useState(todayStr());
  const [slotTime, setSlotTime]           = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPct, setDiscountPct]     = useState(20);
  const [expiresInHours, setExpiresInHours] = useState(4);
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState<{ error: string | null; sentTo: number } | null>(null);
  const [cancellingId, setCancellingId]   = useState<string | null>(null);

  // We only really need the schedule when we are ready to pick a slot
  const { data: scheduleStore, isLoading: scheduleLoading } = useWizardSchedule(
    masterId, slotDate, slotDate
  );

  const selectedService = useMemo(
    () => activeServices.find(s => s.id === serviceId),
    [activeServices, serviceId]
  );
  const serviceDuration = selectedService?.duration ?? 60;

  const availableSlots = useMemo(() => {
    if (!scheduleStore) return null;

    const dow  = DOW_KEYS[new Date(slotDate + 'T12:00:00').getDay()];
    const tmpl = scheduleStore.templates[dow];
    if (!tmpl || !tmpl.is_working) return [];

    const exc = scheduleStore.exceptions[slotDate];
    if (exc?.is_day_off) return [];

    const workStart = (exc?.start_time ?? tmpl.start_time).slice(0, 5);
    const workEnd   = (exc?.end_time   ?? tmpl.end_time  ).slice(0, 5);

    const breaks = (tmpl.break_start && tmpl.break_end)
      ? [{ start: tmpl.break_start.slice(0, 5), end: tmpl.break_end.slice(0, 5) }]
      : [];

    return generateAvailableSlots({
      workStart,
      workEnd,
      bookings: scheduleStore.bookingsByDate[slotDate] ?? [],
      breaks,
      bufferMinutes:    0,
      requestedDuration: serviceDuration,
      stepMinutes:      30,
      selectedDate:     slotDate,
    }).filter(s => s.available);
  }, [scheduleStore, slotDate, serviceDuration]);

  const discountedPrice = originalPrice
    ? Math.round(Number(originalPrice) * (1 - discountPct / 100))
    : null;

  const isStarterBlocked = tier === 'starter' && usedThisMonth >= STARTER_LIMIT;
  const progressPct      = tier === 'starter' ? Math.min((usedThisMonth / STARTER_LIMIT) * 100, 100) : 0;
  const barColor         = progressBarColor(usedThisMonth);

  const handleServiceChange = (sid: string) => {
    setServiceId(sid);
    setSlotTime('');
    const svc = activeServices.find(s => s.id === sid);
    if (svc) setOriginalPrice(String(svc.price));
  };

  const handleDateChange = (date: string) => {
    setSlotDate(date);
    setSlotTime('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !slotDate || !slotTime || !originalPrice) return;
    setLoading(true);
    setResult(null);
    const res = await createFlashDeal({
      serviceId,
      slotDate,
      slotTime,
      originalPrice: Number(originalPrice),
      discountPct,
      expiresInHours,
    });
    setResult(res);
    setLoading(false);
    if (!res.error) {
      setServiceId('');
      setSlotTime('');
      setOriginalPrice('');
      invalidateDeals();
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    await cancelFlashDeal(id);
    setCancellingId(null);
    invalidateDeals();
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      {!isDrawer && (
        <FlashDealHeader 
          activeCount={activeDeals.length}
          usedThisMonth={usedThisMonth}
          tier={tier}
          currentStep={currentStep}
          closeTour={closeTour}
          nextStep={nextStep}
        />
      )}

      {tier === 'starter' && (
        <FlashDealStarterProgress 
          usedThisMonth={usedThisMonth}
          progressPct={progressPct}
          barColor={barColor}
          isStarterBlocked={isStarterBlocked}
        />
      )}

      {isStarterBlocked && <FlashDealPaywall />}

      <FlashDealForm 
        handleSubmit={handleSubmit}
        currentStep={currentStep}
        isStarterBlocked={isStarterBlocked}
        serviceId={serviceId}
        activeServices={activeServices}
        handleServiceChange={handleServiceChange}
        slotDate={slotDate}
        handleDateChange={handleDateChange}
        slotTime={slotTime}
        setSlotTime={setSlotTime}
        scheduleLoading={scheduleLoading}
        availableSlots={availableSlots}
        discountPct={discountPct}
        setDiscountPct={setDiscountPct}
        discountedPrice={discountedPrice}
        originalPrice={originalPrice}
        expiresInHours={expiresInHours}
        setExpiresInHours={setExpiresInHours}
        loading={loading}
        result={result}
        closeTour={closeTour}
        nextStep={nextStep}
      />

      <ActiveDealsList 
        activeDeals={activeDeals}
        cancellingId={cancellingId}
        handleCancel={handleCancel}
      />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

const FlashDealHeader = React.memo(({ activeCount, usedThisMonth, tier, currentStep, closeTour, nextStep }: any) => (
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
      title="Створення акції"
      text="Потрібно терміново заповнити завтрашній день? Створіть флеш-акцію зі знижкою."
      position="bottom"
      primaryButtonText="Далі →"
      onPrimaryClick={nextStep}
    />
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-warning/12 flex items-center justify-center shrink-0">
        <Zap size={22} className="text-warning" />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="heading-serif text-xl text-foreground leading-tight">Флеш-акції</h1>
        <p className="text-sm text-muted-foreground/60">Заповни вільне вікно — сповісти клієнтів</p>
      </div>
      {tier !== 'starter' && (
        <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-semibold shrink-0">
          Pro
        </span>
      )}
    </div>

    <div className="grid grid-cols-2 gap-2.5 mt-4">
      <div className="p-3 rounded-2xl bg-white/50 border border-white/70">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Активних акцій</p>
        <p className="text-xl font-bold text-warning mt-0.5">{activeCount}</p>
      </div>
      <div className="p-3 rounded-2xl bg-white/50 border border-white/70">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">За цей місяць</p>
        <p className="text-xl font-bold text-foreground mt-0.5">{usedThisMonth}</p>
      </div>
    </div>
  </motion.div>
));

const FlashDealStarterProgress = React.memo(({ usedThisMonth, progressPct, barColor, isStarterBlocked }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...SPRING, delay: 0.08 }}
    className="bento-card p-4 flex flex-col gap-3"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Sparkles size={13} className="text-warning" />
        <span className="text-xs font-semibold text-muted-foreground">Флеш-акції цього місяця</span>
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
        {usedThisMonth} / {STARTER_LIMIT}
      </span>
    </div>
    <div className="w-full h-2.5 bg-[#F0E4DF] rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: barColor }}
        initial={{ width: '0%' }}
        animate={{ width: `${progressPct}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </div>
    {isStarterBlocked ? (
      <p className="text-xs text-destructive font-medium">
        Ліміт вичерпано. Перейдіть на Pro для необмеженого доступу.
      </p>
    ) : (
      <p className="text-xs text-muted-foreground/60">
        Залишилось {STARTER_LIMIT - usedThisMonth} з {STARTER_LIMIT} акцій на місяць
      </p>
    )}
  </motion.div>
));

const FlashDealPaywall = React.memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bento-card p-4 flex items-center gap-3"
    style={{ background: 'rgba(212,147,90,0.06)' }}
  >
    <div className="w-10 h-10 rounded-2xl bg-warning/12 flex items-center justify-center shrink-0">
      <Crown size={18} className="text-warning" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground">Ліміт Starter вичерпано</p>
      <p className="text-xs text-muted-foreground">
        {STARTER_LIMIT} флеш-акцій на місяць. Pro — необмежений доступ і смарт-таргетинг.
      </p>
    </div>
    <Link
      href="/dashboard/billing"
      className="text-xs font-bold text-warning whitespace-nowrap hover:underline"
    >
      Pro →
    </Link>
  </motion.div>
));

const FlashDealForm = React.memo(({
  handleSubmit, currentStep, isStarterBlocked,
  serviceId, activeServices, handleServiceChange,
  slotDate, handleDateChange,
  slotTime, setSlotTime, scheduleLoading, availableSlots,
  discountPct, setDiscountPct, discountedPrice, originalPrice,
  expiresInHours, setExpiresInHours,
  loading, result, closeTour, nextStep
}: any) => (
  <motion.form
    onSubmit={handleSubmit}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...SPRING, delay: 0.1 }}
    className={cn(
      'relative bento-card p-5 flex flex-col gap-4 transition-all duration-500',
      currentStep === 1 && 'tour-glow z-40 scale-[1.02]',
      isStarterBlocked && 'opacity-50 pointer-events-none select-none'
    )}
  >
    <AnchoredTooltip
      isOpen={currentStep === 1}
      onClose={closeTour}
      title="Ефект терміновості"
      text="Акція з'явиться на вашій сторінці з таймером. Це створює ефект FOMO та прискорює прийняття рішення клієнтом."
      position="bottom"
      primaryButtonText="Зрозуміло"
      onPrimaryClick={nextStep}
    />

    <div className="flex items-center gap-2">
      <Zap size={14} className="text-warning" />
      <h2 className="text-sm font-bold text-foreground">Нова флеш-акція</h2>
    </div>

    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Послуга</label>
      <div className="relative">
        <select
          value={serviceId}
          onChange={e => handleServiceChange(e.target.value)}
          required
          className="w-full appearance-none px-3.5 py-2.5 rounded-2xl border border-secondary/80 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 transition-colors bg-white/60 cursor-pointer"
        >
          <option value="" disabled>Оберіть послугу…</option>
          {activeServices.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name} — {s.price} ₴</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
      </div>
    </div>

    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Дата слоту</label>
      <input
        type="date"
        value={slotDate}
        min={todayStr()}
        onChange={e => handleDateChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-2xl border border-secondary/80 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 transition-colors bg-white/60"
        required
      />
    </div>

    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Вільний слот</label>
      <div className="p-3 rounded-2xl bg-white/40 border border-secondary/80 min-h-[52px]">
        {!serviceId ? (
          <p className="text-xs text-muted-foreground/60 text-center py-3">Спочатку оберіть послугу</p>
        ) : scheduleLoading || availableSlots === null ? (
          <div className="flex items-center justify-center gap-2 py-3">
            <Loader2 size={14} className="text-warning animate-spin" />
            <span className="text-xs text-muted-foreground/60">Завантаження розкладу…</span>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-3">
            <CalendarX size={14} className="text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground/60">Немає вільних слотів</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {availableSlots.map((slot: any) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => setSlotTime(slot.time)}
                className={cn(
                  'py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
                  slotTime === slot.time
                    ? 'bg-warning text-white border-warning shadow-[0_2px_8px_rgba(212,147,90,0.3)]'
                    : 'bg-white/60 text-muted-foreground border-secondary/80 hover:border-warning/40'
                )}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>
      <input type="hidden" value={slotTime} required />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Знижка</label>
        <div className="relative">
          <select
            value={discountPct}
            onChange={e => setDiscountPct(Number(e.target.value))}
            className="w-full appearance-none px-3.5 py-2.5 rounded-2xl border border-secondary/80 text-sm text-foreground bg-white/60"
          >
            {DISCOUNT_OPTIONS.map(d => <option key={d} value={d}>{d}%</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Акція діє</label>
        <div className="flex gap-1.5">
          {EXPIRY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setExpiresInHours(opt.value)}
              className={`flex-1 py-2.5 rounded-2xl text-[10px] font-bold border transition-all cursor-pointer ${
                expiresInHours === opt.value ? 'bg-warning text-white' : 'bg-white/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    <AnimatePresence>
      {discountedPrice !== null && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-4 py-3 bg-warning/8 rounded-2xl">
          <span className="text-xs text-foreground">
            Клієнт заплатить <span className="font-bold text-warning">{discountedPrice} ₴</span> замість {originalPrice} ₴
          </span>
        </motion.div>
      )}
    </AnimatePresence>

    {result && (
      <div className={`p-3 rounded-2xl text-xs font-medium ${result.error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
        {result.error ?? `Акцію створено! Сповіщено ${result.sentTo} клієнтів.`}
      </div>
    )}

    <button
      type="submit"
      disabled={loading || isStarterBlocked || !slotTime}
      className="w-full flex items-center justify-center gap-2 bg-warning disabled:opacity-50 text-white font-bold rounded-2xl py-3.5 text-sm cursor-pointer shadow-lg active:scale-95 transition-all"
    >
      <Send size={15} />
      {loading ? 'Відправляємо…' : 'Запустити акцію'}
    </button>
  </motion.form>
));

const ActiveDealsList = React.memo(({ activeDeals, cancellingId, handleCancel }: any) => (
  <AnimatePresence>
    {activeDeals.length > 0 ? (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bento-card p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={14} className="text-warning" />
          <h2 className="text-sm font-bold text-foreground">Активні акції ({activeDeals.length})</h2>
        </div>
        <div className="flex flex-col gap-2">
          {activeDeals.map((deal: any) => {
            const priceUah   = Math.round(deal.original_price / 100);
            const discounted = Math.round(priceUah * (1 - deal.discount_pct / 100));
            return (
              <div key={deal.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-warning/6 border border-warning/15">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{deal.service_name}</p>
                  <p className="text-[10px] text-muted-foreground">{deal.slot_date} о {deal.slot_time.slice(0, 5)} · {discounted} ₴</p>
                </div>
                <button onClick={() => handleCancel(deal.id)} disabled={cancellingId === deal.id} className="p-2 text-muted-foreground/60 hover:text-destructive cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    ) : (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bento-card p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-warning/10 flex items-center justify-center">
          <Zap size={28} className="text-warning" />
        </div>
        <p className="text-sm font-bold">Немає активних акцій</p>
      </motion.div>
    )}
  </AnimatePresence>
));
