'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Clock, CalendarDays, User, Phone, MessageSquare, ShoppingBag, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { notifyMasterOnBooking, sendClientBookingConfirmation, ensureClientProfile } from '@/app/[slug]/actions';
import { getAutoSuggestProductIds } from '@/lib/supabase/hooks/useProductLinks';
import { scoreSlots, type SlotWithScore } from '@/lib/utils/smartSlots';
import { applyDynamicPricing } from '@/lib/utils/dynamicPricing';
import { ClientAuthSheet } from './ClientAuthSheet';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  popular: boolean;
  emoji: string;
  category: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  emoji: string;
  inStock: boolean;
}

interface CartProduct {
  product: Product;
  quantity: number;
}

interface BookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  products?: Product[];
  initialService: Service | null;
  initialServices?: Service[];
  initialStep?: Step;
  masterName: string;
  masterId: string;
  bookingsThisMonth?: number;
  subscriptionTier?: string;
  pricingRules?: Record<string, any>;
}

type Step = 'service' | 'datetime' | 'products' | 'client' | 'confirm' | 'success';

// ── Slot helpers ─────────────────────────────────────────────────────────────
function buildSlots(startH: number, endH: number, bookedSet: Set<string>, slotsNeeded = 1) {
  const allSlots: string[] = [];
  for (let h = startH; h < endH; h++) {
    for (const m of [0, 30]) {
      allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return allSlots.map((time, i) => {
    const enoughRoom = i + slotsNeeded <= allSlots.length;
    const allFree = enoughRoom && allSlots.slice(i, i + slotsNeeded).every(t => !bookedSet.has(t));
    return { time, available: allFree };
  });
}

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

function getWeekDays(from: Date, count = 14) {
  const days: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_SHORT = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];

function formatPrice(p: number) { return p.toLocaleString('uk-UA') + ' ₴'; }
function formatDur(m: number) {
  const h = Math.floor(m / 60); const r = m % 60;
  return h ? (r ? `${h} год ${r} хв` : `${h} год`) : `${m} хв`;
}

// ── Step indicators ───────────────────────────────────────────────────────────
function StepBar({ current, steps }: { current: Step; steps: readonly Step[] }) {
  const idx = steps.indexOf(current as Step);
  if (idx === -1) return null;
  return (
    <div className="flex items-center gap-1 mb-5">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i <= idx ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'
          }`} />
        </div>
      ))}
    </div>
  );
}

// ── Web Push Prompt ──────────────────────────────────────────────────────────
const PUSH_DISMISSED_KEY = 'bookit_push_dismissed';

function PushPrompt() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
    if (Notification.permission !== 'default') return false;
    return localStorage.getItem(PUSH_DISMISSED_KEY) !== '1';
  });

  if (!visible) return null;

  async function handleAllow() {
    setVisible(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
    } catch {
      // Ignore errors — push is optional
    }
  }

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem(PUSH_DISMISSED_KEY, '1');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl bg-[#789A99]/8 border border-[#789A99]/20"
    >
      <span className="text-xl flex-shrink-0">🔔</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#2C1A14]">Сповіщення про статус запису</p>
        <p className="text-[11px] text-[#A8928D] mt-0.5">Дізнайся першою, коли майстер підтвердить запис</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleAllow}
            className="px-3 py-1 rounded-lg bg-[#789A99] text-white text-[11px] font-semibold hover:bg-[#5C7E7D] transition-colors"
          >
            Увімкнути
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1 rounded-lg text-[#A8928D] text-[11px] hover:text-[#6B5750] transition-colors"
          >
            Ні, дякую
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

// ── Main component ────────────────────────────────────────────────────────────
export function BookingFlow({
  isOpen, onClose, services, products = [], initialService, initialServices,
  initialStep, masterName, masterId, bookingsThisMonth = 0, subscriptionTier = 'starter',
  pricingRules,
}: BookingFlowProps) {
  const STARTER_LIMIT = 30;
  const isAtLimit = subscriptionTier === 'starter' && bookingsThisMonth >= STARTER_LIMIT;

  const [step, setStep] = useState<Step>(initialStep ?? 'service');
  const [selectedServices, setSelectedServices] = useState<Service[]>(
    initialServices?.length ? initialServices : initialService ? [initialService] : []
  );
  const [selectedProducts, setSelectedProducts] = useState<CartProduct[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slots, setSlots] = useState<SlotWithScore[]>([]);
  const [clientHistoryTimes, setClientHistoryTimes] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [offDayDates, setOffDayDates] = useState<Set<string>>(new Set());
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<{ name: string; percent: number } | null>(null);

  const today = new Date();
  const weekDays = getWeekDays(today, 14);

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalDuration = useMemo(() => selectedServices.reduce((sum, s) => sum + s.duration, 0), [selectedServices]);
  const totalServicesPrice = useMemo(() => selectedServices.reduce((sum, s) => sum + s.price, 0), [selectedServices]);
  const slotsNeeded = useMemo(() => Math.ceil(totalDuration / 30), [totalDuration]);

  const availableProducts = useMemo(() => products.filter(p => p.inStock), [products]);

  // Cross-sell: filter products by service links when on the products step
  const [productsToShow, setProductsToShow] = useState<Product[]>([]);

  useEffect(() => {
    if (step !== 'products' || availableProducts.length === 0) return;

    const serviceIds = selectedServices.map(s => s.id);
    getAutoSuggestProductIds(serviceIds).then(linkedIds => {
      if (linkedIds.length === 0) {
        // No links configured → show all available products
        setProductsToShow(availableProducts);
      } else {
        // Show linked products first, then the rest
        const linked = availableProducts.filter(p => linkedIds.includes(p.id));
        const rest = availableProducts.filter(p => !linkedIds.includes(p.id));
        setProductsToShow([...linked, ...rest]);
      }
    }).catch(() => setProductsToShow(availableProducts));
  }, [step, availableProducts, selectedServices]);

  const hasProducts = availableProducts.length > 0;

  const totalProductsPrice = useMemo(
    () => selectedProducts.reduce((sum, cp) => sum + cp.product.price * cp.quantity, 0),
    [selectedProducts]
  );
  const dynamicPricing = useMemo(() => {
    if (!selectedDate || !selectedTime || !pricingRules) return null;
    return applyDynamicPricing(totalServicesPrice, pricingRules as any, selectedDate, selectedTime);
  }, [totalServicesPrice, pricingRules, selectedDate, selectedTime]);

  const adjustedServicesPrice = dynamicPricing?.adjustedPrice ?? totalServicesPrice;
  const grandTotal = adjustedServicesPrice + totalProductsPrice;
  const discountAmount = loyaltyDiscount ? Math.round(grandTotal * loyaltyDiscount.percent / 100) : 0;
  const finalTotal = grandTotal - discountAmount;

  // Dynamic step sequence — products step is inserted only when there are products
  const FLOW_STEPS: readonly Step[] = useMemo(
    () => hasProducts
      ? ['service', 'datetime', 'products', 'client', 'confirm']
      : ['service', 'datetime', 'client', 'confirm'],
    [hasProducts]
  );

  // ── Cart helpers ────────────────────────────────────────────────────────────
  function addProduct(product: Product) {
    setSelectedProducts(prev => {
      const existing = prev.find(cp => cp.product.id === product.id);
      if (existing) {
        return prev.map(cp => cp.product.id === product.id ? { ...cp, quantity: cp.quantity + 1 } : cp);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeProduct(productId: string) {
    setSelectedProducts(prev => {
      const existing = prev.find(cp => cp.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter(cp => cp.product.id !== productId);
      return prev.map(cp => cp.product.id === productId ? { ...cp, quantity: cp.quantity - 1 } : cp);
    });
  }

  function toggleService(service: Service) {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === service.id);
      return exists ? prev.filter(s => s.id !== service.id) : [...prev, service];
    });
    setSelectedTime(null);
  }

  // ── Slots loading ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDate || !masterId) return;
    if (offDayDates.has(toISO(selectedDate))) { setSlots([]); return; }

    setSlotsLoading(true);
    const supabase = createClient();
    const dayOfWeek = ['sun','mon','tue','wed','thu','fri','sat'][selectedDate.getDay()];
    const dateStr = toISO(selectedDate);

    Promise.all([
      supabase.from('schedule_templates')
        .select('start_time, end_time, is_working, break_start, break_end')
        .eq('master_id', masterId).eq('day_of_week', dayOfWeek).single(),
      supabase.from('bookings')
        .select('start_time, end_time')
        .eq('master_id', masterId).eq('date', dateStr).neq('status', 'cancelled'),
      supabase.from('schedule_exceptions')
        .select('is_day_off, start_time, end_time')
        .eq('master_id', masterId).eq('date', dateStr).maybeSingle(),
    ]).then(([schedRes, bookRes, excRes]) => {
      const exc = excRes.data;
      const tpl = schedRes.data;

      const isDayOff = exc?.is_day_off === true || (tpl ? !tpl.is_working : false);
      if (isDayOff) {
        setOffDayDates(prev => new Set([...prev, dateStr]));
        setSlots([]);
        setSlotsLoading(false);
        return;
      }

      const startH = exc?.start_time ? parseInt(exc.start_time.slice(0, 2)) : tpl ? parseInt(tpl.start_time.slice(0, 2)) : 9;
      const endH   = exc?.end_time   ? parseInt(exc.end_time.slice(0, 2))   : tpl ? parseInt(tpl.end_time.slice(0, 2))   : 18;

      const bookedSet = new Set<string>();
      (bookRes.data ?? []).forEach((b: { start_time: string; end_time: string }) => {
        const [sh, sm] = b.start_time.slice(0, 5).split(':').map(Number);
        const [eh, em] = b.end_time.slice(0, 5).split(':').map(Number);
        let cur = sh * 60 + sm; const end = eh * 60 + em;
        while (cur < end) { bookedSet.add(`${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`); cur += 30; }
      });
      if (tpl?.break_start && tpl?.break_end) {
        const [bsh, bsm] = tpl.break_start.slice(0, 5).split(':').map(Number);
        const [beh, bem] = tpl.break_end.slice(0, 5).split(':').map(Number);
        let cur = bsh * 60 + bsm; const end = beh * 60 + bem;
        while (cur < end) { bookedSet.add(`${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`); cur += 30; }
      }

      setSlots(scoreSlots(buildSlots(startH, endH, bookedSet, slotsNeeded), { clientHistoryTimes }));
      setSlotsLoading(false);
    });
  }, [selectedDate, masterId, slotsNeeded, offDayDates]);

  // ── Reset on open ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setSelectedServices(initialServices?.length ? initialServices : initialService ? [initialService] : []);
      setSelectedProducts([]);
      setStep(initialStep ?? (initialServices?.length || initialService ? 'datetime' : 'service'));
      setSelectedDate(null);
      setSelectedTime(null);
      setOffDayDates(new Set());
      setScheduleLoading(true);
      setClientUserId(null);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setClientNotes('');
      setLoyaltyDiscount(null);

      ensureClientProfile().then(({ userId, name, phone, email }) => {
        if (userId) {
          setClientUserId(userId);
          if (name) setClientName(name);
          if (phone) setClientPhone(phone);
          if (email) setClientEmail(email); // silent — no UI field, used for confirmation email

          // Fetch loyalty discount + client booking history for smart slots
          const supabase = createClient();
          Promise.all([
            supabase.from('client_master_relations').select('total_visits').eq('client_id', userId).eq('master_id', masterId).maybeSingle(),
            supabase.from('loyalty_programs').select('name, target_visits, reward_type, reward_value').eq('master_id', masterId).eq('is_active', true),
            supabase.from('bookings').select('start_time').eq('client_id', userId).eq('master_id', masterId).eq('status', 'completed').limit(20),
          ]).then(([relRes, progsRes, histRes]) => {
            const history = (histRes.data ?? []).map((b: any) => (b.start_time as string | null)?.slice(0, 5)).filter((t): t is string => !!t);
            if (history.length > 0) setClientHistoryTimes(history);
            const visits = relRes.data?.total_visits ?? 0;
            const best = (progsRes.data ?? [])
              .filter((p: any) => p.reward_type === 'percent_discount' && visits >= p.target_visits)
              .sort((a: any, b: any) => Number(b.reward_value) - Number(a.reward_value))[0];
            if (best) setLoyaltyDiscount({ name: best.name as string, percent: Number(best.reward_value) });
          }).catch(() => {});
        }
      }).catch(() => {});

      if (masterId) {
        const supabase = createClient();
        const from = toISO(today);
        const to = toISO(weekDays[weekDays.length - 1]);
        const DOW_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

        Promise.all([
          supabase.from('schedule_templates').select('day_of_week, is_working').eq('master_id', masterId),
          supabase.from('schedule_exceptions').select('date').eq('master_id', masterId).eq('is_day_off', true).gte('date', from).lte('date', to),
        ]).then(([tmplRes, excRes]) => {
          const nonWorkingDows = new Set<string>(
            (tmplRes.data ?? []).filter((r: any) => r.is_working === false).map((r: any) => r.day_of_week as string)
          );
          const offDates = new Set<string>();
          weekDays.forEach(d => { if (nonWorkingDows.has(DOW_MAP[d.getDay()])) offDates.add(toISO(d)); });
          (excRes.data ?? []).forEach((r: any) => offDates.add(r.date as string));
          setOffDayDates(offDates);
          setScheduleLoading(false);
        });
      } else {
        setScheduleLoading(false);
      }
    }
  }, [isOpen, initialService, initialServices, initialStep]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  function handleClose() {
    onClose();
    setTimeout(() => setStep('service'), 350);
  }

  function goBack() {
    const i = FLOW_STEPS.indexOf(step as Step);
    if (i > 0) setStep(FLOW_STEPS[i - 1]);
    else handleClose();
  }

  function goNextFromDatetime() {
    setStep(hasProducts ? 'products' : 'client');
  }

  // ── Confirm & save ──────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (selectedServices.length === 0 || !selectedDate || !selectedTime) return;
    setIsLoading(true);

    const supabase = createClient();
    const dateStr = toISO(selectedDate);
    const [sh, sm] = selectedTime.split(':').map(Number);
    const endMin = sh * 60 + sm + totalDuration;
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
    const emailTrimmed = clientEmail.trim().toLowerCase();
    const bookingId = crypto.randomUUID();

    const { error } = await supabase.from('bookings').insert({
      id: bookingId,
      master_id: masterId,
      client_id: clientUserId || null,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      client_email: emailTrimmed || null,
      date: dateStr,
      start_time: selectedTime,
      end_time: endTime,
      status: 'pending',
      total_services_price: totalServicesPrice,
      total_products_price: totalProductsPrice,
      total_price: finalTotal,
      source: 'public_page',
      notes: clientNotes.trim() || null,
    });

    if (!error) {
      setCreatedBookingId(bookingId);

      // booking_services
      await supabase.from('booking_services').insert(
        selectedServices.map(s => ({
          booking_id: bookingId,
          service_id: s.id,
          service_name: s.name,
          service_price: s.price,
          duration_minutes: s.duration,
        }))
      );

      // booking_products (only when products were added to the cart)
      if (selectedProducts.length > 0) {
        await supabase.from('booking_products').insert(
          selectedProducts.map(cp => ({
            booking_id: bookingId,
            product_id: cp.product.id,
            product_name: cp.product.name,
            product_price: cp.product.price,
            quantity: cp.quantity,
          }))
        );
      }

      // Telegram-сповіщення майстру (fire-and-forget)
      notifyMasterOnBooking({
        masterId,
        clientName: clientName.trim(),
        date: dateStr,
        startTime: selectedTime,
        services: selectedServices.map(s => s.name).join(', '),
        totalPrice: finalTotal,
        notes: clientNotes.trim() || null,
        products: selectedProducts.length > 0
          ? selectedProducts.map(cp => ({ name: cp.product.name, quantity: cp.quantity }))
          : undefined,
      }).catch(() => {});

      // Email-підтвердження клієнту (fire-and-forget)
      if (emailTrimmed) {
        sendClientBookingConfirmation({
          bookingId,
          clientEmail: emailTrimmed,
          clientName: clientName.trim(),
        }).catch(() => {});
      }
    }

    setIsLoading(false);
    setStep('success');
  }

  const canProceedDatetime = !!selectedDate && !!selectedTime;
  const canProceedClient = clientName.trim().length >= 2 && clientPhone.trim().length >= 10;
  const categories = [...new Set(services.map(s => s.category))];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-[#2C1A14]/25 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[92dvh] flex flex-col rounded-t-[28px] overflow-hidden"
            style={{ background: 'rgba(255, 248, 244, 0.97)', backdropFilter: 'blur(32px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-[#E8D5CF] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
              <button onClick={goBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5E8E3] text-[#6B5750] hover:bg-[#EDD9D1] transition-colors">
                <ChevronLeft size={16} />
              </button>
              <div className="text-center">
                {step !== 'success' && (
                  <>
                    <p className="text-xs text-[#A8928D]">{masterName}</p>
                    <p className="text-sm font-semibold text-[#2C1A14]">
                      {step === 'service'   ? 'Обери послуги'     :
                       step === 'datetime'  ? 'Обери дату та час' :
                       step === 'products'  ? 'Додати товари'     :
                       step === 'client'    ? 'Твої контакти'     :
                                             'Підтвердження'}
                    </p>
                  </>
                )}
              </div>
              <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5E8E3] text-[#6B5750] hover:bg-[#EDD9D1] transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">

              {/* Ліміт Starter */}
              {isAtLimit && step !== 'success' && (
                <div className="flex flex-col items-center text-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#D4935A]/12 flex items-center justify-center text-3xl">🔒</div>
                  <div>
                    <p className="text-base font-semibold text-[#2C1A14]">Ліміт записів вичерпано</p>
                    <p className="text-sm text-[#6B5750] mt-1 leading-relaxed">
                      Майстер досяг ліміту 30 записів на місяць.<br/>
                      Нові записи будуть доступні з наступного місяця.
                    </p>
                  </div>
                  <button onClick={handleClose} className="px-6 py-3 rounded-2xl bg-[#789A99] text-white text-sm font-semibold">
                    Зрозуміло
                  </button>
                </div>
              )}

              {!isAtLimit && step !== 'success' && <StepBar current={step} steps={FLOW_STEPS} />}

              {!isAtLimit && <AnimatePresence mode="wait">

                {/* ── Step: Service ── */}
                {step === 'service' && (
                  <motion.div key="service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                    {categories.map(cat => (
                      <div key={cat} className="mb-5">
                        <p className="text-[11px] font-bold text-[#A8928D] uppercase tracking-widest mb-2">{cat}</p>
                        <div className="flex flex-col gap-2">
                          {services.filter(s => s.category === cat).map(service => {
                            const isSelected = selectedServices.some(s => s.id === service.id);
                            return (
                              <button
                                key={service.id}
                                onClick={() => toggleService(service)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                                  isSelected
                                    ? 'bg-[#789A99]/10 border-[#789A99]/40'
                                    : 'bg-white/60 border-white/80 hover:border-[#789A99]/25 hover:bg-white/80'
                                }`}
                              >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'rgba(255,210,194,0.4)' }}>
                                  {service.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[#2C1A14]">{service.name}</p>
                                  <p className="text-xs text-[#A8928D] flex items-center gap-1 mt-0.5">
                                    <Clock size={10} /> {formatDur(service.duration)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-[#2C1A14]">{formatPrice(service.price)}</p>
                                    {service.popular && <span className="text-[9px] font-semibold text-[#789A99]">популярне</span>}
                                  </div>
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected ? 'bg-[#789A99] border-[#789A99]' : 'border-[#C8B8B2] bg-white/60'
                                  }`}>
                                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="sticky bottom-0 pt-3 pb-1 bg-gradient-to-t from-[rgba(255,248,244,1)] to-[rgba(255,248,244,0)]">
                      <Button fullWidth size="lg" disabled={selectedServices.length === 0} onClick={() => setStep('datetime')}>
                        {selectedServices.length === 0
                          ? 'Обери послугу'
                          : `Далі · ${selectedServices.length} посл. · ${formatPrice(totalServicesPrice)}`
                        }
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── Step: DateTime ── */}
                {step === 'datetime' && (
                  <motion.div key="datetime" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>

                    <button onClick={() => setStep('service')} className="flex items-center gap-3 p-3 rounded-2xl bg-[#789A99]/10 border border-[#789A99]/25 mb-5 w-full text-left">
                      <div className="flex -space-x-1.5 flex-shrink-0">
                        {selectedServices.slice(0, 3).map(s => (
                          <div key={s.id} className="w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{ background: 'rgba(255,210,194,0.5)' }}>
                            {s.emoji}
                          </div>
                        ))}
                        {selectedServices.length > 3 && (
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-[#6B5750]" style={{ background: 'rgba(255,210,194,0.5)' }}>
                            +{selectedServices.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2C1A14] truncate">
                          {selectedServices.length === 1 ? selectedServices[0].name : `${selectedServices.length} послуги`}
                        </p>
                        <p className="text-xs text-[#A8928D]">{formatDur(totalDuration)} · {formatPrice(totalServicesPrice)}</p>
                      </div>
                      <ChevronRight size={14} className="text-[#A8928D]" />
                    </button>

                    <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wide mb-2">Дата</p>
                    {scheduleLoading ? (
                      <div className="flex items-center justify-center py-4 mb-5">
                        <div className="w-4 h-4 border-2 border-[#789A99] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide -mx-1 px-1">
                        {weekDays.map((d, i) => {
                          const isSelected = selectedDate?.toDateString() === d.toDateString();
                          const isToday = d.toDateString() === today.toDateString();
                          const isOff = offDayDates.has(toISO(d));
                          return (
                            <button
                              key={i} disabled={isOff}
                              onClick={() => { if (!isOff) { setSelectedDate(d); setSelectedTime(null); } }}
                              className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-2xl flex-shrink-0 min-w-[52px] transition-all ${
                                isOff
                                  ? 'bg-white/40 border border-dashed border-[#E8D5CF] cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-[#789A99] text-white shadow-[0_4px_14px_rgba(120,154,153,0.38)]'
                                  : 'bg-white/70 border border-white/80 text-[#2C1A14] hover:bg-white/90'
                              }`}
                            >
                              <span className={`text-[10px] font-medium ${isOff ? 'text-[#C8B8B2]' : isSelected ? 'text-white/80' : 'text-[#A8928D]'}`}>
                                {isToday && !isOff ? 'Сьогодні' : DAY_SHORT[d.getDay()]}
                              </span>
                              <span className={`text-base font-bold leading-none ${isOff ? 'text-[#C8B8B2]' : ''}`}>
                                {d.getDate()}
                              </span>
                              {isOff ? (
                                <span className="text-[9px] font-semibold text-[#C8B8B2] bg-[#F0E4DE] rounded-full px-1.5 py-0.5 leading-none">вих.</span>
                              ) : (
                                <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-[#A8928D]'}`}>{MONTH_SHORT[d.getMonth()]}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedDate && (
                      offDayDates.has(toISO(selectedDate)) ? (
                        <div className="flex flex-col items-center gap-2 py-6 mb-4 rounded-2xl bg-[#F5E8E3]/60 border border-dashed border-[#E8D5CF]">
                          <span className="text-2xl">😴</span>
                          <p className="text-sm font-semibold text-[#6B5750]">Вихідний день</p>
                          <p className="text-xs text-[#A8928D]">Оберіть інший день</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wide mb-2">Час</p>
                          {slotsLoading ? (
                            <div className="flex items-center justify-center py-6 mb-4">
                              <div className="w-5 h-5 border-2 border-[#789A99] border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : slots.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-6 mb-4 rounded-2xl bg-[#F5E8E3]/60 border border-dashed border-[#E8D5CF]">
                              <span className="text-2xl">📅</span>
                              <p className="text-sm font-semibold text-[#6B5750]">Немає доступних слотів</p>
                              <p className="text-xs text-[#A8928D]">Спробуйте інший день</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-2 mb-4">
                              {slots.map(slot => (
                                <button
                                  key={slot.time} disabled={!slot.available}
                                  onClick={() => setSelectedTime(slot.time)}
                                  className={`relative py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    !slot.available
                                      ? 'bg-white/30 text-[#C8B8B2] cursor-not-allowed line-through'
                                      : selectedTime === slot.time
                                      ? 'bg-[#789A99] text-white shadow-[0_3px_10px_rgba(120,154,153,0.35)]'
                                      : slot.isSuggested
                                      ? 'bg-[#789A99]/12 border border-[#789A99]/30 text-[#2C1A14] hover:bg-[#789A99]/20'
                                      : 'bg-white/70 border border-white/80 text-[#2C1A14] hover:bg-white/90'
                                  }`}
                                >
                                  {slot.isSuggested && selectedTime !== slot.time && (
                                    <span className="absolute -top-1.5 -right-1 text-[8px] leading-none bg-[#789A99] text-white rounded-full px-1 py-0.5 font-bold">★</span>
                                  )}
                                  {slot.time}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    )}

                    {/* Dynamic pricing badge */}
                    {dynamicPricing && dynamicPricing.label && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium mb-2 ${
                        dynamicPricing.modifier > 0
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'bg-green-50 text-green-700 border border-green-100'
                      }`}>
                        {dynamicPricing.label}
                        <span className="ml-auto font-bold">
                          {formatPrice(dynamicPricing.adjustedPrice)}
                        </span>
                      </div>
                    )}

                    <Button fullWidth size="lg" disabled={!canProceedDatetime} onClick={goNextFromDatetime}>
                      Далі
                    </Button>
                  </motion.div>
                )}

                {/* ── Step: Products ── */}
                {step === 'products' && (
                  <motion.div key="products" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>

                    {/* Heading */}
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingBag size={16} className="text-[#789A99]" />
                      <p className="text-sm font-semibold text-[#2C1A14]">Додати до візиту?</p>
                    </div>
                    <p className="text-xs text-[#A8928D] mb-5">Додайте товари — вони увійдуть у загальний чек</p>

                    {/* Product cards */}
                    <div className="flex flex-col gap-2 mb-5">
                      {productsToShow.map(product => {
                        const cartItem = selectedProducts.find(cp => cp.product.id === product.id);
                        const qty = cartItem?.quantity ?? 0;
                        return (
                          <div
                            key={product.id}
                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                              qty > 0
                                ? 'bg-[#789A99]/10 border-[#789A99]/40'
                                : 'bg-white/60 border-white/80'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'rgba(255,210,194,0.4)' }}>
                              {product.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#2C1A14] truncate">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-[#A8928D] truncate">{product.description}</p>
                              )}
                              <p className="text-sm font-bold text-[#789A99] mt-0.5">{formatPrice(product.price)}</p>
                            </div>

                            {qty === 0 ? (
                              <button
                                onClick={() => addProduct(product)}
                                className="w-8 h-8 rounded-full bg-[#789A99] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#5C7E7D] transition-colors"
                              >
                                <Plus size={15} />
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => removeProduct(product.id)}
                                  className="w-8 h-8 rounded-full bg-[#F5E8E3] text-[#6B5750] flex items-center justify-center hover:bg-[#EDD9D1] transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="text-sm font-bold text-[#2C1A14] w-4 text-center">{qty}</span>
                                <button
                                  onClick={() => addProduct(product)}
                                  className="w-8 h-8 rounded-full bg-[#789A99] text-white flex items-center justify-center hover:bg-[#5C7E7D] transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Products subtotal */}
                    {selectedProducts.length > 0 && (
                      <div className="flex items-center justify-between px-1 mb-4">
                        <span className="text-xs text-[#A8928D]">
                          Товари ({selectedProducts.reduce((n, cp) => n + cp.quantity, 0)} шт.)
                        </span>
                        <span className="text-sm font-bold text-[#789A99]">{formatPrice(totalProductsPrice)}</span>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <Button variant="ghost" size="lg" onClick={() => setStep('client')} className="flex-1">
                        Пропустити
                      </Button>
                      <Button size="lg" onClick={() => setStep('client')} className="flex-1">
                        {selectedProducts.length > 0
                          ? `Далі · ${formatPrice(totalProductsPrice)}`
                          : 'Далі'
                        }
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── Step: Client ── */}
                {step === 'client' && (
                  <motion.div key="client" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>

                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#789A99]/10 border border-[#789A99]/20 mb-4">
                      <CalendarDays size={14} className="text-[#789A99] flex-shrink-0" />
                      <p className="text-xs text-[#6B5750]">
                        <span className="font-semibold text-[#2C1A14]">
                          {selectedServices.length === 1 ? selectedServices[0].name : `${selectedServices.length} послуги`}
                        </span>
                        {' — '}
                        {selectedDate && `${selectedDate.getDate()} ${MONTH_SHORT[selectedDate.getMonth()]}`}
                        {' о '}
                        <span className="font-semibold text-[#789A99]">{selectedTime}</span>
                      </p>
                    </div>

                    {clientUserId && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#5C9E7A]/10 border border-[#5C9E7A]/20 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#5C9E7A]" />
                        <p className="text-xs text-[#5C9E7A] font-medium">Дані підтягнуто з вашого профілю</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-4 mb-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#2C1A14] flex items-center gap-1.5">
                          <User size={14} className="text-[#A8928D]" /> Імʼя
                        </label>
                        <input type="text" placeholder="Твоє імʼя та прізвище" value={clientName}
                          onChange={e => setClientName(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl bg-white/75 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#2C1A14] flex items-center gap-1.5">
                          <Phone size={14} className="text-[#A8928D]" /> Телефон
                        </label>
                        <input type="tel" placeholder="+380 XX XXX XX XX" value={clientPhone}
                          onChange={e => setClientPhone(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl bg-white/75 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#2C1A14] flex items-center gap-1.5">
                          <MessageSquare size={14} className="text-[#A8928D]" />
                          Побажання
                          <span className="text-xs text-[#A8928D] font-normal">(необов'язково)</span>
                        </label>
                        <textarea placeholder="Алергія, особливості, побажання до майстра..." value={clientNotes}
                          onChange={e => setClientNotes(e.target.value)} rows={2}
                          className="w-full px-4 py-3 rounded-xl bg-white/75 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all resize-none"
                        />
                      </div>
                    </div>

                    <Button fullWidth size="lg" disabled={!canProceedClient} onClick={() => setStep('confirm')}>
                      Далі
                    </Button>
                  </motion.div>
                )}

                {/* ── Step: Confirm ── */}
                {step === 'confirm' && (
                  <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>

                    <div className="bento-card p-5 mb-4">
                      <p className="text-xs font-bold text-[#A8928D] uppercase tracking-wide mb-3">Деталі запису</p>
                      <div className="flex flex-col gap-3">

                        {/* Services */}
                        {selectedServices.length === 1 ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-[#A8928D]">Послуга</span>
                            <span className="text-sm font-semibold text-[#2C1A14]">{selectedServices[0].name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-[#A8928D]">Послуги</span>
                            {selectedServices.map(s => (
                              <div key={s.id} className="flex items-center justify-between">
                                <span className="text-xs text-[#6B5750] flex items-center gap-1.5">
                                  <span>{s.emoji}</span> {s.name}
                                </span>
                                <span className="text-xs font-semibold text-[#2C1A14]">{formatPrice(s.price)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Products — shown only if added */}
                        {selectedProducts.length > 0 && (
                          <>
                            <div className="h-px bg-[#F5E8E3]" />
                            <div className="flex flex-col gap-1.5">
                              <span className="text-xs text-[#A8928D]">Товари</span>
                              {selectedProducts.map(cp => (
                                <div key={cp.product.id} className="flex items-center justify-between">
                                  <span className="text-xs text-[#6B5750] flex items-center gap-1.5">
                                    <span>{cp.product.emoji}</span>
                                    {cp.product.name}
                                    {cp.quantity > 1 && <span className="text-[#A8928D]">× {cp.quantity}</span>}
                                  </span>
                                  <span className="text-xs font-semibold text-[#2C1A14]">
                                    {formatPrice(cp.product.price * cp.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        <div className="h-px bg-[#F5E8E3]" />
                        <Row label="Тривалість" value={formatDur(totalDuration)} />
                        <Row label="Дата" value={selectedDate ? `${selectedDate.getDate()} ${MONTH_SHORT[selectedDate.getMonth()]}` : ''} />
                        <Row label="Час" value={selectedTime ?? ''} accent />
                        <div className="h-px bg-[#F5E8E3]" />
                        <Row label="Клієнт" value={clientName} />
                        <Row label="Телефон" value={clientPhone} />
                        {clientNotes.trim() && (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-[#A8928D]">Побажання</span>
                            <p className="text-xs text-[#6B5750] italic bg-[#F5E8E3]/50 px-3 py-2 rounded-xl">{clientNotes.trim()}</p>
                          </div>
                        )}
                        <div className="h-px bg-[#F5E8E3]" />

                        {/* Subtotals — shown when products are added */}
                        {selectedProducts.length > 0 && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#A8928D]">Послуги</span>
                              <span className="text-xs font-semibold text-[#2C1A14]">{formatPrice(totalServicesPrice)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#A8928D]">Товари</span>
                              <span className="text-xs font-semibold text-[#2C1A14]">{formatPrice(totalProductsPrice)}</span>
                            </div>
                            <div className="h-px bg-[#F5E8E3]" />
                          </>
                        )}

                        {loyaltyDiscount && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#A8928D]">Разом</span>
                              <span className="text-xs font-semibold text-[#A8928D] line-through">{formatPrice(grandTotal)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-[#5C9E7A]">🎁 {loyaltyDiscount.name}</span>
                                <span className="text-[10px] font-bold text-[#5C9E7A] bg-[#5C9E7A]/10 px-1.5 py-0.5 rounded-full">-{loyaltyDiscount.percent}%</span>
                              </div>
                              <span className="text-xs font-semibold text-[#5C9E7A]">-{formatPrice(discountAmount)}</span>
                            </div>
                            <div className="h-px bg-[#F5E8E3]" />
                          </>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#2C1A14]">До сплати</span>
                          <span className="text-lg font-bold text-[#789A99]">{formatPrice(finalTotal)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#A8928D] text-center mb-4">
                      Майстер отримає сповіщення та підтвердить запис
                    </p>
                    <Button fullWidth size="lg" isLoading={isLoading} onClick={handleConfirm}>
                      Підтвердити запис
                    </Button>
                  </motion.div>
                )}

                {/* ── Step: Success ── */}
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    className="flex flex-col items-center text-center py-6 gap-5"
                  >
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
                      className="w-20 h-20 rounded-full bg-[#5C9E7A]/15 flex items-center justify-center"
                    >
                      <Check size={36} className="text-[#5C9E7A]" strokeWidth={2.5} />
                    </motion.div>

                    <div>
                      <h2 className="heading-serif text-2xl text-[#2C1A14]">Запис підтверджено!</h2>
                      <p className="text-sm text-[#6B5750] mt-2 leading-relaxed">
                        {selectedServices.length === 1 ? selectedServices[0].name : `${selectedServices.length} послуги`}
                        {' о '}
                        <span className="font-semibold text-[#789A99]">{selectedTime}</span>
                        {selectedDate && `, ${selectedDate.getDate()} ${MONTH_SHORT[selectedDate.getMonth()]}`}
                      </p>
                      {selectedProducts.length > 0 && (
                        <p className="text-xs text-[#A8928D] mt-1">
                          + {selectedProducts.length} {selectedProducts.length === 1 ? 'товар' : 'товари'} · {formatPrice(finalTotal)}
                        </p>
                      )}
                      <p className="text-xs text-[#A8928D] mt-1">
                        Очікуй підтвердження від {masterName} 🌸
                      </p>
                    </div>

                    {!clientUserId && createdBookingId ? (
                      <div className="w-full border-t border-[#F5E8E3] pt-5">
                        <ClientAuthSheet bookingId={createdBookingId} onSkip={handleClose} />
                      </div>
                    ) : (
                      <div className="w-full flex flex-col gap-3">
                        <PushPrompt />
                        <Button fullWidth size="lg" onClick={handleClose}>Чудово!</Button>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-[#A8928D]">{label}</span>
      <span className={`text-sm font-semibold ${accent ? 'text-[#789A99]' : 'text-[#2C1A14]'}`}>{value}</span>
    </div>
  );
}
