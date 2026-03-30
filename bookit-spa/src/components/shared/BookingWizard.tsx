/**
 * BookingWizard — unified 4-step booking flow.
 *
 * Steps: services → datetime → products* → details → success
 * (* products step skipped when master has no in-stock products)
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import {
  X, ChevronLeft, ChevronRight, Check, Clock, User, Phone,
  MessageSquare, ShoppingBag, Plus, Minus,
} from 'lucide-react';
import { addMinutes, parse as parseFns, format as formatFns, addDays } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { getAutoSuggestProductIds } from '@/lib/supabase/hooks/useProductLinks';
import {
  generateAvailableSlots, scoreSlots, buildSlotRenderItems,
  toMins as slotToMins, fromMins as slotFromMins, type TimeRange,
} from '@/lib/utils/smartSlots';
import { applyDynamicPricing } from '@/lib/utils/dynamicPricing';
import { buildOffDaySet } from '@/lib/utils/bookingEngine';
import { UpgradePromptModal } from '@/components/shared/UpgradePromptModal';
import { formatDurationFull, pluralize } from '@/lib/utils/dates';
import type { WorkingHoursConfig } from '@/types/database';

// TODO: Refactor Server Actions to Supabase Client
// import { createBooking } from '@/lib/actions/createBooking';
// import { notifyMasterOnBooking, ensureClientProfile } from '@/app/[slug]/actions';
// import { PostBookingAuth } from '@/components/public/PostBookingAuth';
const createBooking: (...args: unknown[]) => Promise<{ error?: string; upgradeRequired?: boolean; bookingId?: string; finalTotal?: number }> = async () => ({ error: 'Not implemented' });
const notifyMasterOnBooking: (...args: unknown[]) => Promise<void> = async () => {};
const ensureClientProfile: () => Promise<{ userId: string | null; name: string; phone: string; email: string }> = async () => ({ userId: null, name: '', phone: '', email: '' });
// TODO: Port PostBookingAuth component
const PostBookingAuth = (_props: { bookingId: string; clientPhone: string; onSkip: () => void }) => null;

// ── Public types ──────────────────────────────────────────────────────────────

export interface WizardService {
  id: string;
  name: string;
  price: number;
  duration: number;
  popular: boolean;
  emoji: string;
  category: string;
  description?: string | null;
}

export interface WizardProduct {
  id: string;
  name: string;
  price: number;
  description: string | null;
  emoji: string;
  inStock?: boolean;
  stock?: number | null;
}

export interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  masterId: string;
  masterName?: string;
  workingHours?: WorkingHoursConfig | null;
  services: WizardService[];
  products?: WizardProduct[];
  initialServices?: WizardService[];
  mode: 'client' | 'master';
  bookingsThisMonth?: number;
  subscriptionTier?: string;
  pricingRules?: Record<string, unknown>;
  onSuccess?: () => void;
  flashDeal?: { id: string; discountPct: number; serviceName: string } | null;
}

// ── Internal ──────────────────────────────────────────────────────────────────

type WizardStep = 'services' | 'datetime' | 'products' | 'details' | 'success';

interface CartItem { product: WizardProduct; quantity: number; }



// ── Constants & helpers ───────────────────────────────────────────────────────

const DOW     = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_S   = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
const MONTH_S = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function getDays(n = 30): Date[] {
  const t = new Date(); t.setHours(0, 0, 0, 0); // normalize to local midnight
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(t); d.setDate(t.getDate() + i); return d;
  });
}
function fmt(n: number) { return n.toLocaleString('uk-UA') + ' ₴'; }

// ── Step flow ─────────────────────────────────────────────────────────────────

const ALL_STEPS: WizardStep[] = ['services', 'datetime', 'products', 'details', 'success'];
const PROGRESS: WizardStep[]  = ['services', 'datetime', 'products', 'details'];

const STEP_TITLE: Record<WizardStep, string | ((m: string) => string)> = {
  services: 'Обери послуги',
  datetime: 'Дата та час',
  products: 'Додати товари',
  details:  (m) => m === 'master' ? 'Деталі запису' : 'Твої контакти',
  success:  '',
};

// ── Slide animation variants ──────────────────────────────────────────────────

const slide = {
  enter:  (d: number) => ({ x: d > 0 ? 52 : -52, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? -52 : 52, opacity: 0 }),
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StepProgress({ step, hasProducts }: { step: WizardStep; hasProducts: boolean }) {
  const visible = hasProducts ? PROGRESS : PROGRESS.filter(s => s !== 'products');
  const idx = visible.indexOf(step);
  if (idx < 0) return null;
  return (
    <div className="flex gap-1.5 mb-5">
      {visible.map((s, i) => (
        <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
          i <= idx ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'
        }`} />
      ))}
    </div>
  );
}

const PUSH_KEY = 'bookit_push_dismissed';
function PushPrompt() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
    if (Notification.permission !== 'default') return false;
    return localStorage.getItem(PUSH_KEY) !== '1';
  });
  if (!visible) return null;
  async function handleAllow() {
    setVisible(false);
    try {
      if (await Notification.requestPermission() !== 'granted') return;
      const reg = await navigator.serviceWorker.ready;
      const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!key) return;
      const pad = '='.repeat((4 - key.length % 4) % 4);
      const b64 = (key + pad).replace(/-/g, '+').replace(/_/g, '/');
      const raw = atob(b64);
      const buf = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: buf });
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
    } catch { /* push is optional */ }
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl bg-[#789A99]/8 border border-[#789A99]/20">
      <span className="text-xl flex-shrink-0">🔔</span>
      <div className="flex-1">
        <p className="text-xs font-semibold text-[#2C1A14]">Сповіщення про статус запису</p>
        <p className="text-[11px] text-[#A8928D] mt-0.5">Дізнайся першою, коли майстер підтвердить запис</p>
        <div className="flex gap-2 mt-2">
          <button onClick={handleAllow}
            className="px-3 py-1 rounded-lg bg-[#789A99] text-white text-[11px] font-semibold">
            Увімкнути
          </button>
          <button onClick={() => { setVisible(false); localStorage.setItem(PUSH_KEY, '1'); }}
            className="px-3 py-1 text-[#A8928D] text-[11px]">
            Ні, дякую
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BookingWizard({
  isOpen, onClose, masterId, masterName = '', workingHours,
  services, products = [], initialServices,
  mode, bookingsThisMonth = 0, subscriptionTier = 'starter', pricingRules,
  onSuccess, flashDeal,
}: BookingWizardProps) {

  // ── Step navigation ──────────────────────────────────────────────────────────
  const [step, setStep]           = useState<WizardStep>('services');
  const [direction, setDirection] = useState(1);

  const availableProducts = useMemo(() => products.filter(p => p.inStock !== false), [products]);
  const hasProducts = availableProducts.length > 0;
  const visibleSteps = useMemo(
    () => hasProducts ? ALL_STEPS : ALL_STEPS.filter(s => s !== 'products'),
    [hasProducts]
  );

  function go(next: WizardStep, dir: 1 | -1 = 1) {
    setDirection(dir); setStep(next);
  }
  function goBack() {
    const idx = visibleSteps.indexOf(step);
    if (idx > 0) go(visibleSteps[idx - 1], -1);
    else { onClose(); setTimeout(() => go('services'), 350); }
  }
  function closeWizard() { onClose(); setTimeout(() => go('services'), 350); }

  // ── Booking state ────────────────────────────────────────────────────────────
  const [selectedServices, setSelectedServices] = useState<WizardService[]>([]);
  const [cart, setCart]                         = useState<CartItem[]>([]);
  const [selectedDate, setSelectedDate]         = useState<Date | null>(null);
  const [selectedTime, setSelectedTime]         = useState<string | null>(null);
  const [clientName, setClientName]             = useState('');
  const [clientPhone, setClientPhone]           = useState('');
  const [clientEmail, setClientEmail]           = useState('');
  const [clientNotes, setClientNotes]           = useState('');
  const [discountPercent, setDiscountPercent]   = useState(0);
  const [durationOverride, setDurationOverride] = useState<number | null>(null);
  const [useDynamicPrice, setUseDynamicPrice]   = useState(true);

  // ── Client-mode extras ────────────────────────────────────────────────────────
  const [clientUserId, setClientUserId]             = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId]     = useState<string | null>(null);
  const [clientHistoryTimes, setClientHistoryTimes] = useState<string[]>([]);
  const [loyaltyDiscount, setLoyaltyDiscount]       = useState<{ name: string; percent: number } | null>(null);

  // ── Schedule data ─────────────────────────────────────────────────────────────
  const days = useMemo(() => getDays(30), []);
  const fromDateStr = useMemo(() => toISO(days[0]), [days]);
  const toDateStr   = useMemo(() => toISO(days[days.length - 1]), [days]);

  const {
    data: scheduleStore,
    isLoading: scheduleLoading,
    isError: scheduleError,
    refetch: refetchSchedule
  } = useWizardSchedule(isOpen ? masterId : null, fromDateStr, toDateStr);

  const offDayDates = useMemo(() => {
    if (!scheduleStore) return new Set<string>();
    return buildOffDaySet(
      Object.entries(scheduleStore.templates).map(([d, t]) => ({ day_of_week: d as any, is_working: t.is_working })),
      Object.entries(scheduleStore.exceptions).filter(([_, e]) => e.is_day_off).map(([d]) => ({ date: d })),
      days
    );
  }, [scheduleStore, days]);

  // ── Product auto-suggest ──────────────────────────────────────────────────────
  const [suggestedProductIds, setSuggestedProductIds] = useState<Set<string>>(new Set());

  // ── Submit state ──────────────────────────────────────────────────────────────
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState('');
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────────
  const dateStripRef  = useRef<HTMLDivElement>(null);
  const wasOpenRef    = useRef(false); // true if modal was already open (retry vs fresh open)

  const isAtLimit = mode === 'client' && subscriptionTier === 'starter' && bookingsThisMonth >= 30;

  // ── Derived totals ────────────────────────────────────────────────────────────
  const totalDuration = useMemo(
    () => selectedServices.reduce((s, sv) => s + sv.duration, 0),
    [selectedServices]
  );
  const effectiveDuration = durationOverride ?? totalDuration;

  const totalServicesPrice = useMemo(
    () => selectedServices.reduce((s, sv) => s + sv.price, 0),
    [selectedServices]
  );
  const dynamicPricing = useMemo(() => {
    if (!selectedDate || !selectedTime || !pricingRules) return null;
    return applyDynamicPricing(totalServicesPrice, pricingRules as Record<string, unknown>, selectedDate, selectedTime);
  }, [totalServicesPrice, pricingRules, selectedDate, selectedTime]);

  // Якщо майстер вимкнув toggle — використовуємо базову ціну
  const effectiveServicesPrice = (
    dynamicPricing && dynamicPricing.adjustedPrice !== totalServicesPrice && useDynamicPrice
  ) ? dynamicPricing.adjustedPrice : totalServicesPrice;
  const totalProductsPrice    = useMemo(() => cart.reduce((s, ci) => s + ci.product.price * ci.quantity, 0), [cart]);
  const grandTotal            = effectiveServicesPrice + totalProductsPrice;
  const loyaltyDiscountAmount = loyaltyDiscount ? Math.round(grandTotal * loyaltyDiscount.percent / 100) : 0;
  const masterDiscountAmount  = Math.round(grandTotal * discountPercent / 100);
  const flashDealAmount       = flashDeal ? Math.round(grandTotal * flashDeal.discountPct / 100) : 0;
  const finalTotal            = Math.max(0, grandTotal - loyaltyDiscountAmount - masterDiscountAmount - flashDealAmount);

  // ── Reset + fetch client history on open ───────────────────────────────────
  useEffect(() => {
    if (!isOpen) { wasOpenRef.current = false; return; }

    const isRetry = wasOpenRef.current;
    wasOpenRef.current = true;

    // Full form reset only on fresh open
    if (!isRetry) {
      go('services', 1);
      setSelectedServices(initialServices ?? []);
      setCart([]);
      setSelectedDate(null);
      setSelectedTime(null);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setClientNotes('');
      setDiscountPercent(0);
      setDurationOverride(null);
      setUseDynamicPrice(true);
      setClientUserId(null);
      setCreatedBookingId(null);
      setClientHistoryTimes([]);
      setLoyaltyDiscount(null);
      setSuggestedProductIds(new Set());
      setSaveError('');
    }

    if (mode === 'client' && masterId) {
      ensureClientProfile().then(({ userId, name, phone, email }) => {
        if (!userId) return;
        setClientUserId(userId);
        if (name)  setClientName(name);
        if (phone) setClientPhone(phone);
        if (email) setClientEmail(email);
        Promise.all([
          supabase.from('client_master_relations').select('total_visits').eq('client_id', userId).eq('master_id', masterId).maybeSingle(),
          supabase.from('loyalty_programs').select('name, target_visits, reward_type, reward_value').eq('master_id', masterId).eq('is_active', true),
          supabase.from('bookings').select('start_time').eq('client_id', userId).eq('master_id', masterId).eq('status', 'completed').limit(20),
        ]).then(([relRes, progRes, histRes]) => {
          const history = (histRes.data ?? []).map((b: { start_time: string | null }) => b.start_time?.slice(0, 5)).filter((t: string | undefined): t is string => !!t);
          if (history.length) setClientHistoryTimes(history);
          const visits = relRes.data?.total_visits ?? 0;
          const best = (progRes.data ?? [])
            .filter((p: { reward_type: string; target_visits: number }) => p.reward_type === 'percent_discount' && visits >= p.target_visits)
            .sort((a: { reward_value: unknown }, b: { reward_value: unknown }) => Number(b.reward_value) - Number(a.reward_value))[0];
          if (best) setLoyaltyDiscount({ name: best.name as string, percent: Number(best.reward_value) });
        }).catch(() => {});
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, masterId]);

  // ── Auto-suggest products ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedServices.length || !availableProducts.length) {
      setSuggestedProductIds(new Set()); return;
    }
    getAutoSuggestProductIds(selectedServices.map(s => s.id))
      .then(ids => setSuggestedProductIds(new Set(ids)))
      .catch(() => setSuggestedProductIds(new Set()));
  }, [selectedServices, availableProducts.length]);

  // ── Schedule-derived: breaks for selected date ────────────────────────────────
  const selectedDayBreaks = useMemo<TimeRange[]>(() => {
    if (!selectedDate || !scheduleStore) return [];
    const tpl = scheduleStore.templates[DOW[selectedDate.getDay()]];
    if (!tpl) return [];
    return [
      ...(tpl.break_start && tpl.break_end ? [{ start: tpl.break_start.slice(0, 5), end: tpl.break_end.slice(0, 5) }] : []),
      ...(workingHours?.breaks ?? []),
    ];
  }, [selectedDate, scheduleStore, workingHours]);

  // ── Schedule-derived: slots for selected date ─────────────────────────────────
  const slots = useMemo(() => {
    if (!selectedDate || !scheduleStore || effectiveDuration === 0) return [];
    const dateStr = toISO(selectedDate);
    if (offDayDates.has(dateStr)) return [];
    const tpl = scheduleStore.templates[DOW[selectedDate.getDay()]];
    if (!tpl) return [];
    const exc = scheduleStore.exceptions[dateStr];
    if (exc?.is_day_off) return [];
    const workStart = exc?.start_time?.slice(0, 5) ?? tpl.start_time.slice(0, 5);
    const workEnd   = exc?.end_time?.slice(0, 5)   ?? tpl.end_time.slice(0, 5);
    const raw = generateAvailableSlots({
      workStart, workEnd,
      bookings:          scheduleStore.bookingsByDate[dateStr] ?? [],
      breaks:            selectedDayBreaks,
      bufferMinutes:     workingHours?.buffer_time_minutes ?? 0,
      requestedDuration: effectiveDuration,
      stepMinutes:       15,
      selectedDate:      selectedDate,
    });
    return scoreSlots(raw, { clientHistoryTimes });
  }, [selectedDate, scheduleStore, offDayDates, effectiveDuration, selectedDayBreaks, workingHours, clientHistoryTimes]);

  // ── Schedule-derived: fully-booked dates ─────────────────────────────────────
  const fullyBookedDates = useMemo<Set<string>>(() => {
    if (!scheduleStore || effectiveDuration === 0) return new Set();
    const result = new Set<string>();
    for (const d of days) {
      const dateStr = toISO(d);
      if (offDayDates.has(dateStr)) continue;
      const tpl = scheduleStore.templates[DOW[d.getDay()]];
      if (!tpl) continue;
      const exc = scheduleStore.exceptions[dateStr];
      if (exc?.is_day_off) continue;
      const workStart = exc?.start_time?.slice(0, 5) ?? tpl.start_time.slice(0, 5);
      const workEnd   = exc?.end_time?.slice(0, 5)   ?? tpl.end_time.slice(0, 5);
      const dayBreaks: TimeRange[] = [
        ...(tpl.break_start && tpl.break_end ? [{ start: tpl.break_start.slice(0, 5), end: tpl.break_end.slice(0, 5) }] : []),
        ...(workingHours?.breaks ?? []),
      ];
      const s = generateAvailableSlots({
        workStart, workEnd,
        bookings:          scheduleStore.bookingsByDate[dateStr] ?? [],
        breaks:            dayBreaks,
        bufferMinutes:     workingHours?.buffer_time_minutes ?? 0,
        requestedDuration: effectiveDuration,
        stepMinutes:       15,
        selectedDate:      d,
      });
      if (!s.some(sl => sl.available)) result.add(dateStr);
    }
    return result;
  }, [scheduleStore, offDayDates, effectiveDuration, days, workingHours]);

  // ── Auto-focus: select first available day once pre-calc is done ─────────
  // Depends on fullyBookedDates (fires after month pre-calc finishes).
  // Only auto-selects when selectedDate is still null (never overrides user).
  useEffect(() => {
    if (step !== 'datetime' || !scheduleStore) return;
    if (selectedDate !== null) return;

    const firstAvailable = days.find(d => {
      const str = toISO(d);
      return !offDayDates.has(str) && !fullyBookedDates.has(str);
    });

    if (firstAvailable) setSelectedDate(firstAvailable);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, scheduleStore, fullyBookedDates]);

  // ── Scroll date strip whenever selectedDate changes ───────────────────────
  useEffect(() => {
    if (!selectedDate) return;
    const el = document.getElementById(`day-${toISO(selectedDate)}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedDate]);

  // ── Cart helpers ──────────────────────────────────────────────────────────────
  function addToCart(p: WizardProduct) {
    setCart(prev => {
      const ex = prev.find(ci => ci.product.id === p.id);
      if (ex) return prev.map(ci => ci.product.id === p.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      return [...prev, { product: p, quantity: 1 }];
    });
  }
  function removeFromCart(id: string) {
    setCart(prev => {
      const ex = prev.find(ci => ci.product.id === id);
      if (!ex) return prev;
      if (ex.quantity <= 1) return prev.filter(ci => ci.product.id !== id);
      return prev.map(ci => ci.product.id === id ? { ...ci, quantity: ci.quantity - 1 } : ci);
    });
  }
  function cartQty(id: string) { return cart.find(ci => ci.product.id === id)?.quantity ?? 0; }

  function toggleService(sv: WizardService) {
    setSelectedServices(prev => prev.some(s => s.id === sv.id) ? prev.filter(s => s.id !== sv.id) : [...prev, sv]);
    setSelectedTime(null);
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!selectedDate || !selectedTime) return;
    setSaving(true);
    setSaveError('');
    const result = await createBooking({
      masterId,
      clientName:              clientName.trim(),
      clientPhone:             clientPhone.trim(),
      clientEmail:             mode === 'client' ? (clientEmail.trim().toLowerCase() || null) : null,
      clientId:                mode === 'client' ? (clientUserId || null) : null,
      date:                    toISO(selectedDate),
      startTime:               selectedTime,
      services:                selectedServices.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })),
      products:                cart.map(ci => ({ id: ci.product.id, name: ci.product.name, price: ci.product.price, quantity: ci.quantity })),
      notes:                   clientNotes.trim() || null,
      source:                  mode === 'client' ? 'online' : 'manual',
      discountPercent:         mode === 'client' ? (loyaltyDiscount?.percent ?? 0) : discountPercent,
      durationOverrideMinutes: mode === 'master' ? (durationOverride ?? undefined) : undefined,
      flashDealId:             mode === 'client' ? (flashDeal?.id ?? undefined) : undefined,
      applyDynamicPricing:     mode === 'master' ? useDynamicPrice : true,
      referral_code_used:      mode === 'client'
        ? (typeof window !== 'undefined' ? localStorage.getItem('bookit_ref') ?? null : null)
        : null,
    });
    setSaving(false);
    if (result.error) {
      if (result.upgradeRequired && mode === 'master') {
        setUpgradePromptOpen(true);
      } else if (result.upgradeRequired && mode === 'client') {
        setSaveError('На жаль, запис до цього майстра тимчасово недоступний. Зверніться до майстра напряму.');
      } else {
        setSaveError(result.error);
      }
      return;
    }
    if (mode === 'client' && result.bookingId) {
      // Реф-код використано — очищаємо щоб не застосовувати повторно
      if (typeof window !== 'undefined') localStorage.removeItem('bookit_ref');
      setCreatedBookingId(result.bookingId);
      notifyMasterOnBooking({
        masterId, clientName: clientName.trim(),
        date: toISO(selectedDate), startTime: selectedTime,
        services: selectedServices.map(s => s.name).join(', '),
        totalPrice: result.finalTotal ?? finalTotal,
        notes: clientNotes.trim() || null,
        products: cart.length > 0 ? cart.map(ci => ({ name: ci.product.name, quantity: ci.quantity })) : undefined,
      }).catch(() => {});
    }
    if (mode === 'master') { onSuccess?.(); onClose(); return; }
    go('success', 1);
  }

  // ── Computed flags ────────────────────────────────────────────────────────────
  const canGoToDatetime    = selectedServices.length > 0;
  const canProceedDatetime = !!selectedDate && !!selectedTime;
  const canSubmit          = clientName.trim().length >= 2 && clientPhone.trim().length >= 9;

  const sortedProducts = useMemo(() => {
    if (!suggestedProductIds.size) return availableProducts;
    return [
      ...availableProducts.filter(p => suggestedProductIds.has(p.id)),
      ...availableProducts.filter(p => !suggestedProductIds.has(p.id)),
    ];
  }, [availableProducts, suggestedProductIds]);

  const categories = useMemo(() => [...new Set(services.map(s => s.category))], [services]);

  if (!isOpen) return null;

  // ── Shell ──────────────────────────────────────────────────────────────────────
  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-[#2C1A14]/25 backdrop-blur-sm z-[55]"
            onClick={closeWizard}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[60] max-h-[92dvh] flex flex-col rounded-t-[28px] overflow-hidden"
            style={{ background: 'rgba(255,248,244,0.97)', backdropFilter: 'blur(32px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-[#E8D5CF] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-2 flex-shrink-0">
              <button onClick={goBack}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5E8E3] text-[#6B5750] hover:bg-[#EDD9D1] transition-colors">
                <ChevronLeft size={16} />
              </button>
              <div className="text-center">
                {step !== 'success' && (
                  <>
                    {masterName && <p className="text-[10px] text-[#A8928D]">{masterName}</p>}
                    <p className="text-sm font-semibold text-[#2C1A14]">
                      {(() => { const t = STEP_TITLE[step]; return typeof t === 'function' ? t(mode) : t; })()}
                    </p>
                  </>
                )}
              </div>
              <button onClick={closeWizard}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5E8E3] text-[#6B5750] hover:bg-[#EDD9D1] transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8">

              {/* Starter limit */}
              {isAtLimit && step !== 'success' && (
                <div className="flex flex-col items-center text-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#D4935A]/12 flex items-center justify-center text-3xl">🔒</div>
                  <p className="text-base font-semibold text-[#2C1A14]">Ліміт записів вичерпано</p>
                  <p className="text-sm text-[#6B5750] leading-relaxed">
                    Майстер досяг ліміту 30 записів на місяць.<br />
                    Нові записи будуть доступні з наступного місяця.
                  </p>
                  <button onClick={closeWizard}
                    className="px-6 py-3 rounded-2xl bg-[#789A99] text-white text-sm font-semibold">
                    Зрозуміло
                  </button>
                </div>
              )}

              {!isAtLimit && (
                <>
                  {step !== 'success' && <StepProgress step={step} hasProducts={hasProducts} />}

                  <AnimatePresence mode="wait" custom={direction}>

                    {/* ─────────────── STEP 1: SERVICES ─────────────── */}
                    {step === 'services' && (
                      <motion.div key="services" custom={direction} variants={slide}
                        initial="enter" animate="center" exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}>

                        {categories.map(cat => (
                          <div key={cat} className="mb-5">
                            <p className="text-[11px] font-bold text-[#A8928D] uppercase tracking-widest mb-2">{cat}</p>
                            <div className="space-y-2">
                              {services.filter(s => s.category === cat).map(svc => {
                                const sel = selectedServices.some(s => s.id === svc.id);
                                return (
                                  <button
                                    key={svc.id}
                                    onClick={() => toggleService(svc)}
                                    className={`flex items-start gap-3 px-4 pt-4 pb-4 rounded-2xl border text-left w-full transition-colors ${
                                      sel
                                        ? 'bg-[#789A99]/10 border-[#789A99]/40'
                                        : 'bg-white/60 border-white/80 hover:border-[#789A99]/25 hover:bg-white/80'
                                    }`}
                                  >
                                    <div
                                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
                                      style={{ background: 'rgba(255,210,194,0.4)' }}
                                    >
                                      {svc.emoji}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-[#2C1A14]">{svc.name}</p>
                                      <p className="text-xs text-[#A8928D] flex items-center gap-1 mt-0.5">
                                        <Clock size={10} /> {formatDurationFull(svc.duration)}
                                      </p>

                                      {/* ── CSS grid accordion (jump-free, no JS measurement) ── */}
                                      {svc.description && (
                                        <div
                                          style={{
                                            display: 'grid',
                                            gridTemplateRows: sel ? '1fr' : '0fr',
                                            transition: 'grid-template-rows 0.9s ease',
                                          }}
                                        >
                                          <div style={{ overflow: 'hidden', minHeight: 0 }}>
                                            <div className="pt-2 pr-2 pb-0.5">
                                              <p
                                                className="text-xs text-[#6B5750] leading-relaxed"
                                                style={{
                                                  opacity: sel ? 1 : 0,
                                                  transition: 'opacity 0.3s ease 0.3s',
                                                }}
                                              >
                                                {svc.description}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-start gap-2 flex-shrink-0 mt-0.5">
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-[#2C1A14]">{fmt(svc.price)}</p>
                                        {svc.popular && (
                                          <span className="text-[9px] font-semibold text-[#789A99]">популярне</span>
                                        )}
                                      </div>
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                        sel ? 'bg-[#789A99] border-[#789A99]' : 'border-[#C8B8B2] bg-white/60'
                                      }`}>
                                        {sel && <Check size={12} className="text-white" strokeWidth={3} />}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {/* Master: duration override — CSS grid accordion, no jump */}
                        {mode === 'master' && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateRows: selectedServices.length > 0 ? '1fr' : '0fr',
                              transition: 'grid-template-rows 0.28s ease',
                            }}
                          >
                            <div style={{ overflow: 'hidden', minHeight: 0 }}>
                              <div
                                className="mb-5"
                                style={{
                                  opacity: selectedServices.length > 0 ? 1 : 0,
                                  transition: 'opacity 0.2s ease 0.05s',
                                }}
                              >
                                <label className="text-xs font-medium text-[#6B5750] mb-1.5 flex items-center gap-1.5">
                                  <Clock size={11} className="text-[#789A99]" />
                                  Нестандартна тривалість, хв
                                  <span className="font-normal text-[#A8928D]">(необов'язково)</span>
                                </label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="number" min={5} max={480} step={5}
                                    value={durationOverride ?? ''}
                                    onChange={e => {
                                      const v = parseInt(e.target.value, 10);
                                      setDurationOverride(isNaN(v) ? null : Math.min(480, Math.max(5, v)));
                                      setSelectedTime(null);
                                    }}
                                    placeholder={String(totalDuration)}
                                    className="w-24 px-3 py-2 rounded-xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20"
                                  />
                                  {durationOverride !== null && (
                                    <button onClick={() => { setDurationOverride(null); setSelectedTime(null); }}
                                      className="text-xs text-[#A8928D] hover:text-[#6B5750] transition-colors">
                                      Скинути
                                    </button>
                                  )}
                                  <span className="text-xs text-[#A8928D]">
                                    {durationOverride !== null ? `стандарт: ${totalDuration}хв` : 'за послугами'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Selection summary chip — CSS grid accordion, no jump */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateRows: selectedServices.length > 0 ? '1fr' : '0fr',
                            transition: 'grid-template-rows 0.28s ease',
                          }}
                        >
                          <div style={{ overflow: 'hidden', minHeight: 0 }}>
                            <div className="pb-4">
                              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#789A99]/8 border border-[#789A99]/20"
                                style={{
                                  opacity: selectedServices.length > 0 ? 1 : 0,
                                  transition: 'opacity 0.2s ease 0.05s',
                                }}
                              >
                                <div className="flex -space-x-1 flex-shrink-0">
                                  {selectedServices.slice(0, 3).map(s => <span key={s.id}>{s.emoji}</span>)}
                                </div>
                                <p className="text-xs text-[#6B5750] flex-1 min-w-0 break-words leading-tight">
                                  <span className="font-semibold text-[#2C1A14]">
                                    {selectedServices.length === 1 ? selectedServices[0].name : pluralize(selectedServices.length, ['послуга', 'послуги', 'послуг'])}
                                  </span>
                                  <span className="ml-1 text-[#A8928D]">· {formatDurationFull(effectiveDuration)} · {fmt(totalServicesPrice)}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="sticky bottom-0 pt-3 pb-1 bg-gradient-to-t from-[rgba(255,248,244,1)] to-transparent">
                          <button
                            disabled={!canGoToDatetime}
                            onClick={() => go('datetime', 1)}
                            className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all ${
                              canGoToDatetime
                                ? 'bg-[#789A99] text-white hover:bg-[#6B8C8B] active:scale-[0.98]'
                                : 'bg-[#E8D5CF] text-[#A8928D] cursor-not-allowed'
                            }`}
                          >
                            {canGoToDatetime
                              ? `Далі · ${pluralize(selectedServices.length, ['послуга', 'послуги', 'послуг'])} · ${fmt(totalServicesPrice)}`
                              : 'Обери послугу'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* ─────────────── STEP 2: DATE & TIME ─────────────── */}
                    {step === 'datetime' && (
                      <motion.div key="datetime" custom={direction} variants={slide}
                        initial="enter" animate="center" exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}>

                        {/* Services recap chip */}
                        <button onClick={() => go('services', -1)}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-[#789A99]/10 border border-[#789A99]/25 mb-5 w-full text-left">
                          <div className="flex -space-x-1.5 flex-shrink-0">
                            {selectedServices.slice(0, 3).map(s => (
                              <div key={s.id} className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                                style={{ background: 'rgba(255,210,194,0.5)' }}>
                                {s.emoji}
                              </div>
                            ))}
                            {selectedServices.length > 3 && (
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-[#6B5750]"
                                style={{ background: 'rgba(255,210,194,0.5)' }}>
                                +{selectedServices.length - 3}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#2C1A14] truncate">
                              {selectedServices.length === 1 ? selectedServices[0].name : pluralize(selectedServices.length, ['послуга', 'послуги', 'послуг'])}
                            </p>
                            <p className="text-xs text-[#A8928D]">{formatDurationFull(effectiveDuration)} · {fmt(totalServicesPrice)}</p>
                          </div>
                          <ChevronRight size={14} className="text-[#A8928D] rotate-180 flex-shrink-0" />
                        </button>

                        {/* ── Date strip ── */}
                        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-2">Дата</p>

                        {scheduleError ? (
                          <div className="flex flex-col items-center gap-3 py-6 mb-4">
                            <p className="text-sm text-[#C05B5B]">Не вдалося завантажити розклад</p>
                            <button
                              onClick={() => refetchSchedule()}
                              className="px-4 py-2 rounded-xl bg-[#789A99] text-white text-xs font-semibold"
                            >
                              Спробувати знову
                            </button>
                          </div>
                        ) : scheduleLoading ? (
                          <div className="flex justify-center py-6 mb-4">
                            <div className="w-5 h-5 border-2 border-[#789A99] border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-5">
                            {/* Prev day */}
                            <button
                              onClick={() => {
                                const base = selectedDate ?? days[0];
                                const prev = addDays(base, -1);
                                if (prev >= days[0]) { setSelectedDate(prev); setSelectedTime(null); }
                              }}
                              className="w-8 h-8 rounded-full bg-white/70 border border-stone-200 flex items-center justify-center flex-shrink-0 hover:bg-white transition-colors text-stone-500"
                            >
                              <ChevronLeft size={14} />
                            </button>

                            {/* Scrollable date strip */}
                            <div
                              ref={dateStripRef}
                              className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
                              style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                              {days.map((d, i) => {
                                const dateStr    = toISO(d);
                                const isSelected = selectedDate?.toDateString() === d.toDateString();
                                const isToday    = d.toDateString() === new Date().toDateString();
                                const isOff      = offDayDates.has(dateStr);
                                const isFull     = !isOff && effectiveDuration > 0 && fullyBookedDates.has(dateStr);
                                const isDisabled = isOff || isFull;
                                return (
                                  <button
                                    key={i}
                                    id={`day-${dateStr}`}
                                    disabled={isDisabled}
                                    onClick={() => {
                                      if (!isDisabled) {
                                        setSelectedDate(d);
                                        setSelectedTime(null);
                                      }
                                    }}
                                    className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-2xl flex-shrink-0 min-w-[54px] transition-all ${
                                      isOff
                                        ? 'bg-white/40 border border-dashed border-stone-200 cursor-not-allowed opacity-50'
                                        : isFull
                                        ? 'bg-red-50 border border-dashed border-red-200 cursor-not-allowed'
                                        : isSelected
                                        ? 'bg-[#789A99] text-white shadow-md'
                                        : 'bg-white/70 border border-stone-200 text-stone-700 hover:bg-white hover:border-[#789A99]/40'
                                    }`}
                                  >
                                    <span className={`text-[10px] font-medium whitespace-normal text-balance break-words text-center leading-tight ${
                                      isOff ? 'text-stone-300' :
                                      isFull ? 'text-red-300' :
                                      isSelected ? 'text-white/80' : 'text-stone-400'
                                    }`}>
                                      {isToday && !isDisabled ? 'Сьогодні' : DAY_S[d.getDay()]}
                                    </span>
                                    <span className={`text-base font-bold leading-none ${
                                      isOff || isFull ? 'text-stone-300' : ''
                                    }`}>
                                      {d.getDate()}
                                    </span>
                                    {isOff ? (
                                      <span className="text-[9px] text-stone-300 leading-none">вих.</span>
                                    ) : isFull ? (
                                      <span className="text-[9px] font-semibold text-red-400 bg-red-50 rounded-full px-1 py-0.5 leading-none">зайнято</span>
                                    ) : (
                                      <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-stone-400'}`}>
                                        {MONTH_S[d.getMonth()]}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Next day */}
                            <button
                              onClick={() => {
                                const base = selectedDate ?? days[0];
                                const next = addDays(base, 1);
                                if (next <= days[days.length - 1]) { setSelectedDate(next); setSelectedTime(null); }
                              }}
                              className="w-8 h-8 rounded-full bg-white/70 border border-stone-200 flex items-center justify-center flex-shrink-0 hover:bg-white transition-colors text-stone-500"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        )}

                        {/* ── Time grid ── */}
                        {selectedDate && (
                          <>
                            <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-3">Час</p>

                            {offDayDates.has(toISO(selectedDate)) ? (
                              <div className="flex flex-col items-center gap-2 py-8 rounded-2xl bg-stone-50 border border-dashed border-stone-200">
                                <span className="text-3xl">😴</span>
                                <p className="text-sm font-semibold text-stone-500">Вихідний день</p>
                                <p className="text-xs text-stone-400">Оберіть інший день</p>
                              </div>
                            ) : (() => {
                              const renderItems = buildSlotRenderItems(slots, selectedDayBreaks);
                              const hasAvail = renderItems.some(i => i.kind === 'slot');

                              if (!hasAvail) return (
                                <div className="flex flex-col items-center gap-2 py-8 rounded-2xl bg-stone-50 border border-dashed border-stone-200">
                                  <span className="text-3xl">📅</span>
                                  <p className="text-sm font-semibold text-stone-500">Немає вільних слотів</p>
                                  <p className="text-xs text-stone-400">Всі вікна зайняті</p>
                                </div>
                              );

                              return (
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                  {renderItems.map((item, idx) =>
                                    item.kind === 'break' ? (
                                      /* Break separator spans all 3 columns */
                                      <div key={`brk-${idx}`} className="col-span-3 flex items-center gap-2 py-0.5">
                                        <div className="flex-1 h-px bg-stone-200" />
                                        <span className="text-xs text-stone-400 flex-shrink-0">
                                          🍽 {item.label} · {item.start}–{item.end}
                                        </span>
                                        <div className="flex-1 h-px bg-stone-200" />
                                      </div>
                                    ) : (
                                      <motion.button
                                        key={item.slot.time}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedTime(item.slot.time)}
                                        className={`relative rounded-xl py-3 text-center text-sm font-medium transition-all ${
                                          selectedTime === item.slot.time
                                            ? 'bg-[#789A99] text-white shadow-md ring-2 ring-[#789A99]/30 border-transparent'
                                            : item.slot.isSuggested
                                            ? 'bg-[#789A99]/8 border border-[#789A99]/30 text-[#2C1A14]'
                                            : 'bg-white/60 text-stone-600 border border-stone-200 hover:bg-white hover:border-[#789A99]/30'
                                        }`}
                                      >
                                        {item.slot.isSuggested && selectedTime !== item.slot.time && (
                                          <span className="absolute -top-1.5 -right-1 text-[8px] bg-[#789A99] text-white rounded-full px-1 py-0.5 font-bold leading-none">★</span>
                                        )}
                                        <span className="block font-semibold">{item.slot.time}</span>
                                        <span className={`block text-[11px] font-normal mt-0.5 ${
                                          selectedTime === item.slot.time ? 'text-white/70' : 'text-stone-400'
                                        }`}>
                                          {slotFromMins(slotToMins(item.slot.time) + effectiveDuration)}
                                        </span>
                                      </motion.button>
                                    )
                                  )}
                                </div>
                              );
                            })()}

                            {/* Dynamic pricing badge — для клієнта: інфо-бейдж */}
                            {dynamicPricing?.label && mode === 'client' && (
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium mb-3 ${
                                dynamicPricing.modifier > 0
                                  ? 'bg-red-50 text-red-700 border border-red-100'
                                  : 'bg-green-50 text-green-700 border border-green-100'
                              }`}>
                                {dynamicPricing.label}
                                <span className="ml-auto font-bold">{fmt(dynamicPricing.adjustedPrice)}</span>
                              </div>
                            )}

                            {/* Dynamic pricing toggle — тільки для майстра, якщо правило спрацювало */}
                            {mode === 'master' && dynamicPricing && dynamicPricing.adjustedPrice !== totalServicesPrice && selectedTime && (
                              <button
                                type="button"
                                onClick={() => setUseDynamicPrice(v => !v)}
                                className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl border transition-all mb-3 ${
                                  useDynamicPrice
                                    ? 'bg-[#789A99]/10 border-[#789A99]/30'
                                    : 'bg-white/70 border-white/80 hover:bg-white'
                                }`}
                              >
                                <div className="text-left">
                                  <p className="text-sm font-medium text-[#2C1A14]">Застосувати динамічну ціну</p>
                                  <p className="text-xs text-[#A8928D] mt-0.5">
                                    {dynamicPricing.label} → {fmt(dynamicPricing.adjustedPrice)}
                                  </p>
                                </div>
                                <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-3 ${
                                  useDynamicPrice ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'
                                }`}>
                                  <motion.div
                                    animate={{ x: useDynamicPrice ? 20 : 2 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                  />
                                </div>
                              </button>
                            )}
                          </>
                        )}

                        {/* Continue CTA */}
                        <div className="sticky bottom-0 pt-3 pb-1 bg-gradient-to-t from-[rgba(255,248,244,1)] to-transparent">
                          <button
                            disabled={!canProceedDatetime}
                            onClick={() => go(hasProducts ? 'products' : 'details', 1)}
                            className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all ${
                              canProceedDatetime
                                ? 'bg-[#789A99] text-white hover:bg-[#6B8C8B] active:scale-[0.98]'
                                : 'bg-[#E8D5CF] text-[#A8928D] cursor-not-allowed'
                            }`}
                          >
                            {canProceedDatetime
                              ? `Далі — ${selectedDate!.getDate()} ${MONTH_S[selectedDate!.getMonth()]} о ${selectedTime}`
                              : selectedDate ? 'Обери час' : 'Обери день'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* ─────────────── STEP 3: PRODUCTS ─────────────── */}
                    {step === 'products' && (
                      <motion.div key="products" custom={direction} variants={slide}
                        initial="enter" animate="center" exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}>

                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingBag size={16} className="text-[#789A99]" />
                          <p className="text-sm font-semibold text-[#2C1A14]">Додати до візиту?</p>
                        </div>
                        <p className="text-xs text-[#A8928D] mb-5">Додайте товари — вони увійдуть у загальний чек</p>

                        <div className="flex flex-col gap-2 mb-5">
                          {sortedProducts.map(p => {
                            const qty      = cartQty(p.id);
                            const isLinked = suggestedProductIds.has(p.id);
                            return (
                              <div key={p.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                                qty > 0 ? 'bg-[#789A99]/10 border-[#789A99]/40' : 'bg-white/60 border-white/80'
                              }`}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                                  style={{ background: 'rgba(255,210,194,0.4)' }}>
                                  {p.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[#2C1A14] truncate">{p.name}</p>
                                  {p.description && <p className="text-xs text-[#A8928D] truncate">{p.description}</p>}
                                  <p className="text-sm font-bold text-[#789A99] mt-0.5">
                                    {fmt(p.price)}{isLinked && <span className="ml-1.5 text-xs font-normal">✨</span>}
                                  </p>
                                </div>
                                {qty === 0 ? (
                                  <button onClick={() => addToCart(p)}
                                    className="w-8 h-8 rounded-full bg-[#789A99] text-white flex items-center justify-center hover:bg-[#5C7E7D] transition-colors">
                                    <Plus size={15} />
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => removeFromCart(p.id)}
                                      className="w-8 h-8 rounded-full bg-[#F5E8E3] text-[#6B5750] flex items-center justify-center hover:bg-[#EDD9D1] transition-colors">
                                      <Minus size={14} />
                                    </button>
                                    <span className="text-sm font-bold text-[#2C1A14] w-4 text-center">{qty}</span>
                                    <button onClick={() => addToCart(p)}
                                      disabled={p.stock !== null && p.stock !== undefined && qty >= (p.stock ?? Infinity)}
                                      className="w-8 h-8 rounded-full bg-[#789A99] text-white flex items-center justify-center hover:bg-[#5C7E7D] transition-colors disabled:opacity-40">
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {cart.length > 0 && (
                          <div className="flex items-center justify-between px-1 mb-4">
                            <span className="text-xs text-[#A8928D]">Товари ({cart.reduce((n, ci) => n + ci.quantity, 0)} шт.)</span>
                            <span className="text-sm font-bold text-[#789A99]">{fmt(totalProductsPrice)}</span>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button onClick={() => go('details', 1)}
                            className="flex-1 py-3.5 rounded-2xl border border-[#E8D5CF] text-sm font-semibold text-[#6B5750] hover:bg-[#F5E8E3] transition-all">
                            Пропустити
                          </button>
                          <button onClick={() => go('details', 1)}
                            className="flex-1 py-3.5 rounded-2xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#6B8C8B] active:scale-[0.98] transition-all">
                            {cart.length > 0 ? `Далі · ${fmt(totalProductsPrice)}` : 'Далі'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* ─────────────── STEP 4: DETAILS ─────────────── */}
                    {step === 'details' && (
                      <motion.div key="details" custom={direction} variants={slide}
                        initial="enter" animate="center" exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}>

                        {/* Recap badge */}
                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#789A99]/10 border border-[#789A99]/20 mb-4">
                          <span className="text-base">📅</span>
                          <p className="text-xs text-[#6B5750]">
                            <span className="font-semibold text-[#2C1A14]">
                              {selectedServices.length === 1 ? selectedServices[0].name : pluralize(selectedServices.length, ['послуга', 'послуги', 'послуг'])}
                            </span>
                            {' — '}
                            {selectedDate && `${selectedDate.getDate()} ${MONTH_S[selectedDate.getMonth()]}`}
                            {' о '}
                            <span className="font-semibold text-[#789A99]">{selectedTime}</span>
                          </p>
                        </div>

                        {mode === 'client' && clientUserId && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#5C9E7A]/10 border border-[#5C9E7A]/20 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#5C9E7A]" />
                            <p className="text-xs text-[#5C9E7A] font-medium">Дані підтягнуто з вашого профілю</p>
                          </div>
                        )}

                        <div className="flex flex-col gap-4 mb-5">
                          <div>
                            <label className="text-sm font-medium text-[#2C1A14] flex items-center gap-1.5 mb-1.5">
                              <User size={13} className="text-[#A8928D]" />
                              {mode === 'master' ? "Ім'я клієнта" : "Ім'я"}
                            </label>
                            <input type="text"
                              placeholder={mode === 'master' ? 'Олена Петрова' : 'Твоє імʼя та прізвище'}
                              value={clientName} onChange={e => setClientName(e.target.value)}
                              className="w-full h-12 px-4 rounded-xl bg-white/75 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#2C1A14] flex items-center gap-1.5 mb-1.5">
                              <Phone size={13} className="text-[#A8928D]" /> Телефон
                            </label>
                            <input type="tel" placeholder="+380 XX XXX XX XX"
                              value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                              className="w-full h-12 px-4 rounded-xl bg-white/75 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#2C1A14] flex items-center gap-1.5 mb-1.5">
                              <MessageSquare size={13} className="text-[#A8928D]" />
                              {mode === 'master' ? 'Нотатки' : 'Побажання'}
                              <span className="text-xs text-[#A8928D] font-normal">(необов'язково)</span>
                            </label>
                            <textarea
                              placeholder={mode === 'master' ? 'Нотатки для себе...' : 'Алергія, особливості, побажання...'}
                              value={clientNotes} onChange={e => setClientNotes(e.target.value)} rows={2}
                              className="w-full px-4 py-3 rounded-xl bg-white/75 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all resize-none"
                            />
                          </div>

                          {mode === 'master' && (
                            <div>
                              <label className="text-sm font-medium text-[#2C1A14] mb-1.5 block">Знижка майстра, %</label>
                              <div className="flex items-center gap-3">
                                <input type="number" min={0} max={100} step={5}
                                  value={discountPercent || ''} onChange={e => {
                                    const v = parseInt(e.target.value, 10);
                                    setDiscountPercent(isNaN(v) ? 0 : Math.min(100, Math.max(0, v)));
                                  }}
                                  placeholder="0"
                                  className="w-24 h-12 px-4 rounded-xl bg-white/75 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
                                />
                                <span className="text-xs text-[#A8928D]">
                                  {discountPercent > 0 ? `−${masterDiscountAmount.toLocaleString('uk-UA')} ₴` : 'без знижки'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Price summary */}
                        <div className="rounded-2xl bg-white/60 border border-white/80 p-4 flex flex-col gap-2 mb-5">
                          <p className="text-xs font-bold text-[#A8928D] uppercase tracking-wide mb-1">Підсумок</p>
                          {selectedServices.map(s => (
                            <div key={s.id} className="flex justify-between text-xs">
                              <span className="text-[#6B5750]">{s.emoji} {s.name}</span>
                              <span className="font-semibold text-[#2C1A14]">{fmt(s.price)}</span>
                            </div>
                          ))}
                          {dynamicPricing?.label && useDynamicPrice && (
                            <div className="flex justify-between text-xs">
                              <span className="text-[#789A99]">{dynamicPricing.label}</span>
                              <span className={`font-medium ${dynamicPricing.modifier > 0 ? 'text-[#D4935A]' : 'text-[#5C9E7A]'}`}>
                                {dynamicPricing.modifier > 0 ? '+' : ''}{(dynamicPricing.adjustedPrice - totalServicesPrice).toLocaleString('uk-UA')} ₴
                              </span>
                            </div>
                          )}
                          {totalProductsPrice > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-[#6B5750]">Товари</span>
                              <span className="font-semibold text-[#2C1A14]">+{fmt(totalProductsPrice)}</span>
                            </div>
                          )}
                          {loyaltyDiscount && (
                            <div className="flex justify-between text-xs">
                              <span className="text-[#5C9E7A]">🎁 {loyaltyDiscount.name} <span className="text-[10px] font-bold">-{loyaltyDiscount.percent}%</span></span>
                              <span className="font-semibold text-[#5C9E7A]">−{fmt(loyaltyDiscountAmount)}</span>
                            </div>
                          )}
                          {flashDeal && flashDealAmount > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-amber-600">⚡ Флеш-акція <span className="text-[10px] font-bold">-{flashDeal.discountPct}%</span></span>
                              <span className="font-semibold text-amber-600">−{fmt(flashDealAmount)}</span>
                            </div>
                          )}
                          {mode === 'master' && discountPercent > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-[#5C9E7A]">Знижка {discountPercent}%</span>
                              <span className="font-semibold text-[#5C9E7A]">−{fmt(masterDiscountAmount)}</span>
                            </div>
                          )}
                          <div className="border-t border-[#E8D5CF] pt-2 flex justify-between items-center">
                            <span className="text-sm font-bold text-[#2C1A14]">
                              {mode === 'client' ? 'До сплати' : 'Разом'}
                            </span>
                            <span className="text-lg font-bold text-[#789A99]">{fmt(finalTotal)}</span>
                          </div>
                        </div>

                        {saveError && <p className="text-xs text-[#C05B5B] text-center mb-3">{saveError}</p>}
                        {mode === 'client' && (
                          <p className="text-xs text-[#A8928D] text-center mb-3">
                            Майстер отримає сповіщення та підтвердить запис
                          </p>
                        )}

                        <button
                          disabled={!canSubmit || saving}
                          onClick={handleSubmit}
                          className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            canSubmit && !saving
                              ? 'bg-[#789A99] text-white hover:bg-[#6B8C8B] active:scale-[0.98]'
                              : 'bg-[#E8D5CF] text-[#A8928D] cursor-not-allowed'
                          }`}
                        >
                          {saving
                            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Зберігаємо...</>
                            : mode === 'client' ? 'Підтвердити запис' : 'Зберегти запис'
                          }
                        </button>
                      </motion.div>
                    )}

                    {/* ─────────────── STEP 5: SUCCESS ─────────────── */}
                    {step === 'success' && (
                      <motion.div key="success" custom={direction} variants={slide}
                        initial="enter" animate="center" exit="exit"
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="flex flex-col items-center text-center py-6 gap-5">

                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 18 }}
                          className="w-20 h-20 rounded-full bg-[#5C9E7A]/15 flex items-center justify-center">
                          <Check size={36} className="text-[#5C9E7A]" strokeWidth={2.5} />
                        </motion.div>

                        <div>
                          <h2 className="heading-serif text-2xl text-[#2C1A14]">Запис підтверджено!</h2>
                          <p className="text-sm text-[#6B5750] mt-2 leading-relaxed">
                            {selectedServices.length === 1 ? selectedServices[0].name : pluralize(selectedServices.length, ['послуга', 'послуги', 'послуг'])}
                            {' — '}
                            {selectedDate && `${selectedDate.getDate()} ${MONTH_S[selectedDate.getMonth()]}, `}
                            <span className="font-semibold text-[#789A99]">
                              {selectedTime && (() => {
                                const endTime = formatFns(
                                  addMinutes(parseFns(selectedTime, 'HH:mm', new Date()), totalDuration),
                                  'HH:mm'
                                );
                                return `${selectedTime} – ${endTime}`;
                              })()}
                            </span>
                          </p>
                          {cart.length > 0 && (
                            <p className="text-xs text-[#A8928D] mt-1">
                              + {pluralize(cart.length, ['товар', 'товари', 'товарів'])} · {fmt(finalTotal)}
                            </p>
                          )}
                          {masterName && (
                            <p className="text-xs text-[#A8928D] mt-1">
                              Очікуй підтвердження від {masterName} 🌸
                            </p>
                          )}
                        </div>

                        {!clientUserId && createdBookingId ? (
                          <div className="w-full border-t border-[#F5E8E3] pt-5">
                            <PostBookingAuth
                              bookingId={createdBookingId}
                              clientPhone={clientPhone.trim()}
                              onSkip={closeWizard}
                            />
                          </div>
                        ) : (
                          <div className="w-full flex flex-col gap-3">
                            <PushPrompt />
                            <button
                              onClick={closeWizard}
                              className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm hover:bg-[#6B8C8B] active:scale-[0.98] transition-all"
                            >
                              Чудово!
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Upgrade prompt — master hits monthly booking limit */}
    <UpgradePromptModal
      isOpen={upgradePromptOpen}
      onClose={() => setUpgradePromptOpen(false)}
      feature="Безліміт записів"
      description="На тарифі Starter — 30 записів на місяць. Перейдіть на Pro, щоб приймати необмежену кількість клієнтів."
    />
    </>
  );
}
