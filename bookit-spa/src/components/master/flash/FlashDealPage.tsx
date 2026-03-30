import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { supabase } from '@/lib/supabase/client';
import { useFlashDeals, useFlashDealsInvalidate } from '@/lib/supabase/hooks/useFlashDeals';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import { useMasterContext } from '@/lib/supabase/context';
import { generateAvailableSlots } from '@/lib/utils/smartSlots';
import {
  Zap, Clock, X, Send, ChevronDown, Users,
  CheckCircle2, AlertCircle, Crown, Sparkles, Loader2, CalendarX,
} from 'lucide-react';
import { formatDurationFull, pluralize } from '@/lib/utils/dates';

// Inline type (was imported from Next.js page route)
interface FlashDealRow {
  id: string;
  service_name: string;
  slot_date: string;
  slot_time: string;
  original_price: number;
  discount_pct: number;
  expires_at: string;
  status: string;
}

interface Props {
  activeDeals: FlashDealRow[];
  tier: string;
  usedThisMonth: number;
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

export function FlashDealPage({ activeDeals: initialDeals, tier, usedThisMonth }: Props) {
  const { currentStep, nextStep, closeTour } = useTour('flash', 2);
  const invalidateDeals = useFlashDealsInvalidate();
  const { data: activeDeals = initialDeals } = useFlashDeals(initialDeals);
  const { services } = useServices();
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  const activeServices = services.filter(s => s.active);

  const [serviceId, setServiceId]         = useState('');
  const [slotDate, setSlotDate]           = useState(todayStr());
  const [slotTime, setSlotTime]           = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPct, setDiscountPct]     = useState(20);
  const [expiresInHours, setExpiresInHours] = useState(4);
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState<{ error: string | null; sentTo: number } | null>(null);
  const [cancellingId, setCancellingId]   = useState<string | null>(null);

  // ── Smart slots ───────────────────────────────────────────────────────────
  const { data: scheduleStore, isLoading: scheduleLoading } = useWizardSchedule(
    masterId, slotDate, slotDate
  );

  const selectedService = useMemo(
    () => activeServices.find(s => s.id === serviceId),
    [activeServices, serviceId]
  );
  const serviceDuration = selectedService?.duration ?? 60;

  const availableSlots = useMemo(() => {
    if (!scheduleStore) return null; // ще завантажується

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

  // ─────────────────────────────────────────────────────────────────────────

  const discountedPrice = originalPrice
    ? Math.round(Number(originalPrice) * (1 - discountPct / 100))
    : null;

  const isStarterBlocked = tier === 'starter' && usedThisMonth >= STARTER_LIMIT;
  const progressPct      = tier === 'starter' ? Math.min((usedThisMonth / STARTER_LIMIT) * 100, 100) : 0;
  const barColor         = progressBarColor(usedThisMonth);

  const handleServiceChange = (sid: string) => {
    setServiceId(sid);
    setSlotTime(''); // скидаємо слот — тривалість могла змінитись
    const svc = activeServices.find(s => s.id === sid);
    if (svc) setOriginalPrice(String(svc.price));
  };

  const handleDateChange = (date: string) => {
    setSlotDate(date);
    setSlotTime(''); // скидаємо слот при зміні дати
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !slotDate || !slotTime || !originalPrice || !masterId) return;
    setLoading(true);
    setResult(null);

    // Перевірка ліміту Starter на клієнті (сервер перевірить ще раз через RLS)
    if (tier === 'starter' && usedThisMonth >= STARTER_LIMIT) {
      setResult({ error: `На Starter тарифі — ${STARTER_LIMIT} флеш-акцій на місяць. Перейдіть на Pro.`, sentTo: 0 });
      setLoading(false);
      return;
    }

    // Отримуємо назву послуги
    const service = activeServices.find(s => s.id === serviceId);
    if (!service) {
      setResult({ error: 'Послугу не знайдено', sentTo: 0 });
      setLoading(false);
      return;
    }

    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

    const { error: dbError } = await supabase
      .from('flash_deals')
      .insert({
        master_id:      masterId,
        service_id:     serviceId,
        service_name:   service.name,
        slot_date:      slotDate,
        slot_time:      slotTime,
        original_price: Number(originalPrice) * 100,
        discount_pct:   discountPct,
        expires_at:     expiresAt,
        status:         'active',
      });

    if (dbError) {
      setResult({ error: dbError.message, sentTo: 0 });
    } else {
      setResult({ error: null, sentTo: 0 });
      setServiceId('');
      setSlotTime('');
      setOriginalPrice('');
      invalidateDeals();
    }
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    await supabase
      .from('flash_deals')
      .update({ status: 'expired' })
      .eq('id', id)
      .eq('master_id', masterId!);
    setCancellingId(null);
    invalidateDeals();
  };

  // ── Slot section helper ───────────────────────────────────────────────────
  const renderSlotPicker = () => {
    if (!serviceId) {
      return (
        <p className="text-xs text-[#A8928D] text-center py-3">
          Спочатку оберіть послугу
        </p>
      );
    }
    if (scheduleLoading || availableSlots === null) {
      return (
        <div className="flex items-center justify-center gap-2 py-3">
          <Loader2 size={14} className="text-[#D4935A] animate-spin" />
          <span className="text-xs text-[#A8928D]">Завантаження розкладу…</span>
        </div>
      );
    }
    if (availableSlots.length === 0) {
      return (
        <div className="flex items-center justify-center gap-2 py-3">
          <CalendarX size={14} className="text-[#A8928D]" />
          <span className="text-xs text-[#A8928D]">Немає вільних слотів на цей день</span>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-4 gap-1.5">
        {availableSlots.map(slot => (
          <button
            key={slot.time}
            type="button"
            onClick={() => setSlotTime(slot.time)}
            className={cn(
              'py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
              slotTime === slot.time
                ? 'bg-[#D4935A] text-white border-[#D4935A] shadow-[0_2px_8px_rgba(212,147,90,0.3)]'
                : 'bg-white/60 text-[#6B5750] border-[#E8D5CF] hover:border-[#D4935A]/40'
            )}
          >
            {slot.time}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-8">

      {/* ── Header ── */}
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
          <div className="w-11 h-11 rounded-2xl bg-[#D4935A]/12 flex items-center justify-center shrink-0">
            <Zap size={22} className="text-[#D4935A]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="heading-serif text-xl text-[#2C1A14] leading-tight">Флеш-акції</h1>
            <p className="text-sm text-[#A8928D]">Заповни вільне вікно — сповісти клієнтів</p>
          </div>
          {tier !== 'starter' && (
            <span className="text-xs bg-[#789A99]/10 text-[#789A99] border border-[#789A99]/20 px-2.5 py-1 rounded-full font-semibold shrink-0">
              Pro
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <div className="p-3 rounded-2xl bg-white/50 border border-white/70">
            <p className="text-[10px] text-[#A8928D] uppercase tracking-wide">Активних акцій</p>
            <p className="text-xl font-bold text-[#D4935A] mt-0.5">{activeDeals.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/50 border border-white/70">
            <p className="text-[10px] text-[#A8928D] uppercase tracking-wide">За цей місяць</p>
            <p className="text-xl font-bold text-[#2C1A14] mt-0.5">{usedThisMonth}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Starter Progress Bar ── */}
      {tier === 'starter' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.08 }}
          className="bento-card p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#D4935A]" />
              <span className="text-xs font-semibold text-[#6B5750]">Флеш-акції цього місяця</span>
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
            <p className="text-xs text-[#C05B5B] font-medium">
              Ліміт вичерпано. Перейдіть на Pro для необмеженого доступу.
            </p>
          ) : (
            <p className="text-xs text-[#A8928D]">
              Залишилось {STARTER_LIMIT - usedThisMonth} з {STARTER_LIMIT} акцій на місяць
            </p>
          )}
        </motion.div>
      )}

      {/* ── Paywall at 5/5 ── */}
      {isStarterBlocked && (
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
            <p className="text-xs text-[#6B5750]">
              {STARTER_LIMIT} флеш-акцій на місяць. Pro — необмежений доступ і смарт-таргетинг.
            </p>
          </div>
          <Link
            to="/dashboard/billing"
            className="text-xs font-bold text-[#D4935A] whitespace-nowrap hover:underline"
          >
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
          <Zap size={14} className="text-[#D4935A]" />
          <h2 className="text-sm font-bold text-[#2C1A14]">Нова флеш-акція</h2>
        </div>

        {/* Послуга */}
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Послуга</label>
          <div className="relative">
            <select
              value={serviceId}
              onChange={e => handleServiceChange(e.target.value)}
              required
              className="w-full appearance-none px-3.5 py-2.5 rounded-2xl border border-[#E8D5CF] text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 focus:border-[#D4935A]/50 transition-colors bg-white/60 cursor-pointer"
            >
              <option value="" disabled>Оберіть послугу…</option>
              {activeServices.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.price} ₴
                </option>
              ))}
              {activeServices.length === 0 && (
                <option value="" disabled>Немає активних послуг</option>
              )}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8928D] pointer-events-none" />
          </div>
        </div>

        {/* Дата слоту */}
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Дата слоту</label>
          <input
            type="date"
            value={slotDate}
            min={todayStr()}
            onChange={e => handleDateChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8D5CF] text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 transition-colors bg-white/60"
            required
          />
        </div>

        {/* Час слоту — smart slot picker */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-[#6B5750]">
              Вільний слот
              {slotTime && (
                <span className="ml-2 text-[#D4935A] font-bold">{slotTime}</span>
              )}
            </label>
            {slotTime && (
              <button
                type="button"
                onClick={() => setSlotTime('')}
                className="text-[10px] text-[#A8928D] hover:text-[#C05B5B] transition-colors cursor-pointer"
              >
                скинути
              </button>
            )}
          </div>
          <div className="p-3 rounded-2xl bg-white/40 border border-[#E8D5CF] min-h-[52px] flex flex-col justify-center">
            {renderSlotPicker()}
          </div>
          {/* hidden input для валідації форми */}
          <input type="hidden" value={slotTime} required />
        </div>

        {/* Знижка */}
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

        {/* Тривалість акції */}
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Акція діє</label>
          <div className="flex gap-2">
            {EXPIRY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExpiresInHours(opt.value)}
                className={`flex-1 py-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
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
          disabled={loading || isStarterBlocked || !slotTime}
          className="w-full flex items-center justify-center gap-2 bg-[#D4935A] hover:bg-[#C07840] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl py-3 text-sm transition-colors shadow-[0_4px_14px_rgba(212,147,90,0.3)] cursor-pointer"
        >
          <Send size={15} />
          {loading ? 'Відправляємо…' : 'Запустити акцію та сповістити клієнтів'}
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
              const priceUah   = Math.round(deal.original_price / 100);
              const discounted = Math.round(priceUah * (1 - deal.discount_pct / 100));
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
                      <span className="line-through text-[#A8928D]">{priceUah} ₴</span>
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
                      className="p-1.5 rounded-lg hover:bg-[#C05B5B]/10 text-[#A8928D] hover:text-[#C05B5B] transition-colors disabled:opacity-50 cursor-pointer"
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
            Клієнти отримають сповіщення через Telegram та Push
          </div>
        </motion.div>
      )}
    </div>
  );
}
