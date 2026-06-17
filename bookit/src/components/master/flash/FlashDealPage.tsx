'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { createFlashDeal, cancelFlashDeal, updateAutoFlashSettings } from '@/app/(master)/dashboard/flash/actions';
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
import { formatDurationFull } from '@/lib/utils/dates';
import Link from 'next/link';

interface Props {
  activeDeals?: FlashDealRow[];
  tier?: string;
  usedThisMonth?: number;
  isDrawer?: boolean;
  initialDate?: string;
  initialTime?: string;
}

const STARTER_LIMIT = 5;
const DISCOUNT_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 50];
const AUTO_FLASH_DISCOUNT_OPTIONS = [10, 15, 20, 25, 30];
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

export function FlashDealPage({
  activeDeals: initialDeals,
  tier: initialTier,
  usedThisMonth: initialCount,
  isDrawer,
  initialDate,
  initialTime
}: Props) {
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

  const activeServices = useMemo(() => services.filter(s => s.active), [services]);

  const [serviceId, setServiceId]         = useState('');
  const [slotDate, setSlotDate]           = useState(initialDate ?? todayStr());
  const [slotTime, setSlotTime]           = useState(initialTime ?? '');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPct, setDiscountPct]     = useState(20);
  const [expiresInHours, setExpiresInHours] = useState(4);
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState<{ error: string | null; sentTo: number; clients?: { id: string; name: string }[] } | null>(null);
  const [cancellingId, setCancellingId]   = useState<string | null>(null);

  // Auto Flash settings state (FR-9, FR-10)
  const [autoFlashOnCancel, setAutoFlashOnCancel]       = useState(false);
  const [autoFlashDiscountPct, setAutoFlashDiscountPct] = useState(20);
  const [autoFlashSaving, setAutoFlashSaving]           = useState(false);

  useEffect(() => {
    if (masterProfile) {
      const mp = masterProfile as any;
      setAutoFlashOnCancel(mp.auto_flash_on_cancel ?? false);
      setAutoFlashDiscountPct(mp.auto_flash_discount_pct ?? 20);
    }
  }, [masterProfile]);

  // We only really need the schedule when we are ready to pick a slot
  const { data: scheduleStore, isLoading: scheduleLoading } = useWizardSchedule(
    masterId, slotDate, slotDate
  );

  const selectedService = useMemo(
    () => activeServices.find(s => s.id === serviceId),
    [activeServices, serviceId]
  );

  // Declared before early return to satisfy Rules of Hooks
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-6 animate-pulse">
        <div className="h-40 bg-secondary/40 border border-border rounded-3xl" />
        <div className="h-64 bg-secondary/40 border border-border rounded-3xl" />
      </div>
    );
  }

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

  const handleAutoFlashToggle = async (enabled: boolean) => {
    setAutoFlashOnCancel(enabled);
    setAutoFlashSaving(true);
    await updateAutoFlashSettings({ autoFlashOnCancel: enabled, autoFlashDiscountPct: autoFlashDiscountPct });
    setAutoFlashSaving(false);
  };

  const handleAutoFlashDiscount = async (pct: number) => {
    setAutoFlashDiscountPct(pct);
    setAutoFlashSaving(true);
    await updateAutoFlashSettings({ autoFlashOnCancel: autoFlashOnCancel, autoFlashDiscountPct: pct });
    setAutoFlashSaving(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-8" data-tour-step="act-4">
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

      {/* Auto Flash Deal settings (FR-9, FR-10) */}
      {!isDrawer && (
        <AutoFlashSettingsCard
          enabled={autoFlashOnCancel}
          discountPct={autoFlashDiscountPct}
          saving={autoFlashSaving}
          onToggle={handleAutoFlashToggle}
          onDiscountChange={handleAutoFlashDiscount}
        />
      )}

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

const FlashDealHeader = React.memo(({ activeCount, usedThisMonth, tier, currentStep, closeTour, nextStep }: {
  activeCount: number;
  usedThisMonth: number;
  tier: string;
  currentStep: number | null;
  closeTour: () => void;
  nextStep: () => void;
}) => (
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
      <div className="size-11 rounded-2xl bg-warning/12 flex items-center justify-center shrink-0">
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
      <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Активних акцій</p>
        <p className="text-xl font-bold text-warning mt-0.5">{activeCount}</p>
      </div>
      <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">За цей місяць</p>
        <p className="text-xl font-bold text-foreground mt-0.5">{usedThisMonth}</p>
      </div>
    </div>
  </motion.div>
));

const FlashDealStarterProgress = React.memo(({ usedThisMonth, progressPct, barColor, isStarterBlocked }: {
  usedThisMonth: number;
  progressPct: number;
  barColor: string;
  isStarterBlocked: boolean;
}) => (
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
    <div className="size-10 rounded-2xl bg-warning/12 flex items-center justify-center shrink-0">
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

const AutoFlashSettingsCard = React.memo(({
  enabled, discountPct, saving, onToggle, onDiscountChange,
}: {
  enabled: boolean;
  discountPct: number;
  saving: boolean;
  onToggle: (v: boolean) => void;
  onDiscountChange: (pct: number) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...SPRING, delay: 0.09 }}
    className="bento-card p-4 flex flex-col gap-3"
  >
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(92,158,122,0.12)' }}>
          <Zap size={15} style={{ color: '#5C9E7A' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">Авто Flash Deal</p>
          <p className="text-xs text-muted-foreground/70">При скасуванні запису</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Авто Flash Deal при скасуванні"
        onClick={() => onToggle(!enabled)}
        className="relative w-11 h-6 rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        style={{ background: enabled ? '#5C9E7A' : '#D1D5DB' }}
      >
        <motion.span
          className="absolute top-0.5 size-5 rounded-full bg-white shadow-sm"
          animate={{ left: enabled ? '1.375rem' : '0.125rem' }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      </button>
    </div>

    <AnimatePresence>
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="pt-1 flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Знижка при авто-тригері</p>
            <div className="flex gap-1.5">
              {AUTO_FLASH_DISCOUNT_OPTIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDiscountChange(d)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                    discountPct === d
                      ? 'text-white border-transparent'
                      : 'bg-secondary/60 text-muted-foreground border-border hover:border-[#5C9E7A]/40'
                  )}
                  style={discountPct === d ? { background: '#2D6A4A' } : {}}
                >
                  {d}%
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {saving && (
      <div className="flex items-center gap-1.5">
        <Loader2 size={10} className="animate-spin text-muted-foreground/60" />
        <span className="text-[10px] text-muted-foreground/60">Зберігається…</span>
      </div>
    )}
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
}: {
  handleSubmit: (e: React.FormEvent) => void;
  currentStep: number | null;
  isStarterBlocked: boolean;
  serviceId: string;
  activeServices: any[];
  handleServiceChange: (sid: string) => void;
  slotDate: string;
  handleDateChange: (date: string) => void;
  slotTime: string;
  setSlotTime: (time: string) => void;
  scheduleLoading: boolean;
  availableSlots: any[] | null;
  discountPct: number;
  setDiscountPct: (pct: number) => void;
  discountedPrice: number | null;
  originalPrice: string;
  expiresInHours: number;
  setExpiresInHours: (hrs: number) => void;
  loading: boolean;
  result: { error: string | null; sentTo: number; clients?: { id: string; name: string }[] } | null;
  closeTour: () => void;
  nextStep: () => void;
}) => (
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
          className="w-full appearance-none px-3.5 py-2.5 rounded-2xl border border-secondary/80 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 transition-colors bg-secondary/60 cursor-pointer"
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
        aria-label="Дата слоту"
        className="w-full px-3.5 py-2.5 rounded-2xl border border-secondary/80 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 transition-colors bg-secondary/60"
        required
      />
    </div>

    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Вільний слот</label>
      <div className="p-3 rounded-2xl bg-secondary/40 border border-border min-h-[52px]">
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
                    : 'bg-secondary/60 text-muted-foreground border-border hover:border-warning/40'
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
            className="w-full appearance-none px-3.5 py-2.5 rounded-2xl border border-secondary/80 text-sm text-foreground bg-secondary/60"
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
                expiresInHours === opt.value ? 'bg-warning text-white' : 'bg-secondary/60'
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
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className={cn(
          'rounded-2xl text-xs overflow-hidden',
          result.error
            ? 'p-3 bg-red-50 border border-red-100 text-red-600 font-medium flex items-center gap-2'
            : 'border border-border/50 bg-secondary/30'
        )}
      >
        {result.error ? (
          <>
            <AlertCircle size={13} className="shrink-0" />
            {result.error}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border/30">
              <CheckCircle2 size={13} className="text-green-600 shrink-0" />
              <span className="font-semibold text-foreground">Акцію запущено!</span>
              <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                <Users size={11} />
                <span>{result.sentTo}</span>
              </div>
            </div>
            <div className="px-3.5 py-2 flex flex-col gap-0.5">
              {result.clients && result.clients.length > 0 ? (
                result.clients.map(c => (
                  <div key={c.id} className="flex items-center gap-2 py-0.5">
                    <div className="size-1.5 rounded-full bg-green-500/60 shrink-0" />
                    <span className="text-foreground/70">{c.name}</span>
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground/60 py-0.5">Немає клієнтів для сповіщення</span>
              )}
            </div>
          </>
        )}
      </motion.div>
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

const ActiveDealsList = React.memo(({ activeDeals, cancellingId, handleCancel }: {
  activeDeals: FlashDealRow[];
  cancellingId: string | null;
  handleCancel: (id: string) => void;
}) => (
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
                <button type="button" aria-label="Скасувати акцію" onClick={() => handleCancel(deal.id)} disabled={cancellingId === deal.id} className="p-2 text-muted-foreground/60 hover:text-destructive">
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    ) : (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bento-card p-6 flex flex-col items-center gap-4 text-center">
        <div className="size-16 rounded-3xl bg-warning/10 flex items-center justify-center">
          <Zap size={28} className="text-warning" />
        </div>
        <p className="text-sm font-bold">Немає активних акцій</p>
      </motion.div>
    )}
  </AnimatePresence>
));
