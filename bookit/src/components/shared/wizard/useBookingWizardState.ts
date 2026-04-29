'use client';
// src/components/shared/wizard/useBookingWizardState.ts
import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { getAutoSuggestProductIds } from '@/lib/supabase/hooks/useProductLinks';
import { ensureClientProfile } from '@/app/[slug]/actions';
import { checkC2cEligibility } from '@/lib/actions/referrals';
import { normalizeToE164 } from '@/lib/utils/phone';
import { useToast } from '@/lib/toast/context';
import { bookingClientSchema, type BookingClientData } from '@/lib/validations/booking';
import { ALL_STEPS } from './helpers';
import type { WizardService, WizardProduct, WizardStep, CartItem } from './types';

interface UseBookingWizardStateParams {
  isOpen: boolean;
  masterId: string;
  mode: 'client' | 'master';
  initialServices?: WizardService[];
  products?: WizardProduct[];
  onClose: () => void;
  initialStep?: WizardStep;
  initialDate?: string;  // YYYY-MM-DD — flash deal locked date
  initialTime?: string;  // HH:MM — flash deal locked time
  isFlashFastTrack?: boolean;
  c2cRefCode?: string | null;
  c2cDiscountPct?: number | null;
}

export function useBookingWizardState({
  isOpen,
  masterId,
  mode,
  initialServices,
  products = [],
  onClose,
  initialStep,
  initialDate,
  initialTime,
  isFlashFastTrack = false,
  c2cRefCode = null,
  c2cDiscountPct = null,
}: UseBookingWizardStateParams) {
  const { showToast } = useToast();

  // ── Step navigation ──────────────────────────────────────────────────────────
  const [step, setStep]           = useState<WizardStep>('services');
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log(`[Wizard] Step initialized/changed to: ${step}`);
    }
  }, [step]);

  // ── Booking state ────────────────────────────────────────────────────────────
  const [selectedServices, setSelectedServices] = useState<WizardService[]>([]);
  const [cart, setCart]                         = useState<CartItem[]>([]);
  const [selectedDate, setSelectedDate]         = useState<Date | null>(null);
  // Ref kept in sync with selectedDate every render — read by auto-select effect
  // to avoid adding selectedDate to deps (would re-run on every user date-click).
  const selectedDateRef = useRef<Date | null>(null);
  selectedDateRef.current = selectedDate;
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
  const [selectedClientId, setSelectedClientId]     = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId]     = useState<string | null>(null);
  const [clientHistoryTimes, setClientHistoryTimes] = useState<string[]>([]);
  const [loyaltyDiscount, setLoyaltyDiscount]       = useState<{ name: string; percent: number } | null>(null);
  const [partners, setPartners]                     = useState<{ id: string; name: string; slug: string; emoji: string; category?: string }[]>([]);

  // ── C2C referrer balance (how much % the client has accumulated as referrer) ──
  const [c2cReferrerBalance, setC2cReferrerBalance] = useState<number>(0);
  const [c2cBonusToUse, setC2cBonusToUse]           = useState<number>(0);
  const [activeC2cDiscountPct, setActiveC2cDiscountPct] = useState<number | null>(c2cDiscountPct ?? null);
  const [c2cAlreadyUsed, setC2cAlreadyUsed]             = useState(false);
  const c2cCheckRef = useRef<string>('');

  // ── Product auto-suggest ──────────────────────────────────────────────────────
  const [suggestedProductIds, setSuggestedProductIds] = useState<Set<string>>(new Set());

  // ── Submit state ──────────────────────────────────────────────────────────────
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState('');
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);

  // ── Validation Form (targeted approach for details step) ──────────────────
  const {
    register,
    setValue,
    watch,
    formState: { errors },
    trigger,
    reset: resetForm,
  } = useForm<BookingClientData>({
    resolver: zodResolver(bookingClientSchema),
    defaultValues: {
      clientName: '',
      clientPhone: '',
    },
  });

  const watchName = watch('clientName');
  const watchPhone = watch('clientPhone');

  // Sync manual state with form state (to keep rest of wizard happy)
  useEffect(() => {
    setClientName(watchName || '');
  }, [watchName]);

  useEffect(() => {
    setClientPhone(watchPhone || '');
  }, [watchPhone]);

  // ── Refs ──────────────────────────────────────────────────────────────────────
  const wasOpenRef = useRef(false); // true if modal was already open (retry vs fresh open)

  // ── Available products (after all state is declared) ─────────────────────────
  const availableProducts = useMemo(() => {
    const selectedServiceIds = new Set(selectedServices.map(s => s.id));
    return products.filter(p => {
      if (p.inStock === false) return false;
      if (p.recommendAlways !== false) return true;
      return (p.linkedServiceIds ?? []).some(sid => selectedServiceIds.has(sid));
    });
  }, [products, selectedServices]);
  const hasProducts = availableProducts.length > 0;
  const visibleSteps = useMemo(
    () => hasProducts ? ALL_STEPS : ALL_STEPS.filter(s => s !== 'products'),
    [hasProducts]
  );

  function go(next: WizardStep, dir: 1 | -1 = 1) {
    if (typeof window !== 'undefined') {
      console.log(`[Wizard] Transitioning from ${step} to ${next} (dir: ${dir})`);
    }
    setDirection(dir); setStep(next);
  }
  function goBack() {
    // Flash fast-track: 'details' is the locked entry point — back = close
    if (isFlashFastTrack && step === 'details') {
      onClose(); setTimeout(() => go('services'), 350); return;
    }
    // Product-only path: from products with no services selected → back to services (skip datetime)
    if (step === 'products' && selectedServices.length === 0) {
      go('services', -1); return;
    }
    // Product-only path: from details with no services → back to products
    if (step === 'details' && selectedServices.length === 0 && hasProducts) {
      go('products', -1); return;
    }
    const idx = visibleSteps.indexOf(step);
    if (idx > 0) go(visibleSteps[idx - 1], -1);
    else { onClose(); setTimeout(() => go('services'), 350); }
  }
  function closeWizard() { onClose(); setTimeout(() => go('services'), 350); }

  // ── Reset + fetch client history on open ──────────────────────────────────
  useEffect(() => {
    // Race condition guard: prevents stale async callbacks from updating state
    // after the modal closes or masterId changes mid-flight.
    let cancelled = false;

    if (!isOpen) { wasOpenRef.current = false; return () => { cancelled = true; }; }

    const isRetry = wasOpenRef.current;
    wasOpenRef.current = true;

    // Full form reset only on fresh open
    if (!isRetry) {
      go(initialStep ?? 'services', 1);
      setSelectedServices(initialServices ?? []);
      setCart([]);
      // Flash deal fast-track: pre-fill locked date & time
      setSelectedDate(initialDate ? new Date(initialDate + 'T12:00:00') : null);
      setSelectedTime(initialTime ?? null);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setClientNotes('');
      setDiscountPercent(0);
      setDurationOverride(null);
      setUseDynamicPrice(true);
      setClientUserId(null);
      setSelectedClientId(null);
      setCreatedBookingId(null);
      setClientHistoryTimes([]);
      setLoyaltyDiscount(null);
      setC2cReferrerBalance(0);
      setC2cBonusToUse(0);
      setActiveC2cDiscountPct(c2cDiscountPct ?? null);
      setC2cAlreadyUsed(false);
      c2cCheckRef.current = '';
      setSuggestedProductIds(new Set());
      setSaveError('');
      resetForm({
        clientName: '',
        clientPhone: '',
      });
    }

    if (mode === 'client' && masterId) {
      ensureClientProfile().then(({ userId, name, phone, email }) => {
        if (cancelled || !userId) return;
        setClientUserId(userId);
        if (name) {
          setClientName(name);
          setValue('clientName', name);
        }
        if (phone) {
          const e164 = normalizeToE164(phone);
          const normalizedPhone = e164 ? '+' + e164 : phone;
          setClientPhone(normalizedPhone);
          setValue('clientPhone', normalizedPhone, { shouldValidate: true });
        }
        if (email) setClientEmail(email);
        const sb = createClient();
        Promise.all([
          sb.from('client_master_relations').select('total_visits').eq('client_id', userId).eq('master_id', masterId).maybeSingle(),
          sb.from('loyalty_programs').select('name, target_visits, reward_type, reward_value').eq('master_id', masterId).eq('is_active', true),
          sb.from('bookings').select('start_time').eq('client_id', userId).eq('master_id', masterId).eq('status', 'completed').limit(20),
          sb.from('master_partners').select('partner_id, status, master_profiles!master_partners_partner_id_fkey(id, slug, avatar_emoji, categories, profiles(full_name))').eq('master_id', masterId).eq('status', 'accepted').limit(5),
          sb.rpc('get_c2c_balance', { p_referrer_id: userId, p_master_id: masterId }),
        ]).then(([relRes, progRes, histRes, partRes, c2cBalRes]) => {
          if (cancelled) return;
          const history = (histRes.data ?? []).map((b: { start_time: string | null }) => b.start_time?.slice(0, 5)).filter((t: string | undefined): t is string => !!t);
          if (history.length) setClientHistoryTimes(history);
          const visits = relRes.data?.total_visits ?? 0;
          const totalVisitsWithThisOne = visits + 1;
          const best = (progRes.data ?? [])
            .filter((p: { reward_type: string; target_visits: number }) => p.reward_type === 'percent_discount' && totalVisitsWithThisOne >= p.target_visits)
            .sort((a: { reward_value: unknown }, b: { reward_value: unknown }) => Number(b.reward_value) - Number(a.reward_value))[0];
          if (best) setLoyaltyDiscount({ name: best.name as string, percent: Number(best.reward_value) });

          const balance = typeof c2cBalRes.data === 'number' ? c2cBalRes.data : 0;
          setC2cReferrerBalance(balance);
          setC2cBonusToUse(0);

          if (partRes.data) {
            type PartnerRow = {
              partner_id: string;
              status: string;
              master_profiles: { id: string; slug: string; avatar_emoji: string | null; categories: string[] | null; profiles: { full_name: string | null } | null } | Array<{ id: string; slug: string; avatar_emoji: string | null; categories: string[] | null; profiles: { full_name: string | null } | null }> | null;
            };
            setPartners(partRes.data.map((p: PartnerRow) => {
              const mp = Array.isArray(p.master_profiles) ? p.master_profiles[0] : p.master_profiles;
              const profile = Array.isArray(mp?.profiles) ? mp.profiles[0] : mp?.profiles;
              return {
                id: mp?.id,
                slug: mp?.slug,
                emoji: mp?.avatar_emoji || '💅',
                name: profile?.full_name || 'Майстер',
                category: mp?.categories?.[0] || 'Beauty',
              };
            }));
          }
        }).catch((e: unknown) => {
          if (process.env.NODE_ENV !== 'production') console.error('[BookingWizard] client data fetch failed:', e);
        });
      }).catch((e: unknown) => {
        if (process.env.NODE_ENV !== 'production') console.error('[BookingWizard] ensureClientProfile failed:', e);
      });
    }

    return () => { cancelled = true; };
   
  // Intentionally limited to [isOpen, masterId]:
  //   initialServices — stable per wizard lifecycle (parent closes+reopens to change it)
  //   mode            — constant per component instance
  //   resetForm/setValue — RHF stable refs, never change identity
  //   ensureClientProfile — imported stable function from actions module
  }, [isOpen, masterId]);

  // ── C2C eligibility re-check when phone changes ───────────────────────────────
  useEffect(() => {
    if (!c2cRefCode || !masterId || mode !== 'client') return;
    const phone = watchPhone;
    if (phone.length < 13 || c2cCheckRef.current === phone) return;
    c2cCheckRef.current = phone;

    checkC2cEligibility(phone, masterId, c2cRefCode).then((res) => {
      setActiveC2cDiscountPct(res.eligible ? (c2cDiscountPct ?? null) : null);
      setC2cAlreadyUsed(!res.eligible);
    });
  }, [watchPhone, c2cRefCode, masterId, mode, c2cDiscountPct]);

  // ── Auto-suggest products ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedServices.length || !availableProducts.length) {
      setSuggestedProductIds(new Set()); return;
    }
    getAutoSuggestProductIds(selectedServices.map(s => s.id))
      .then(ids => setSuggestedProductIds(new Set(ids)))
      .catch(() => setSuggestedProductIds(new Set()));
  }, [selectedServices, availableProducts.length]);

  // ── saveError → Toast ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (saveError) {
      showToast({ type: 'error', title: 'Помилка запису', message: saveError });
    }
  }, [saveError]);

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

  return {
    // Step
    step, direction, go, goBack, closeWizard, visibleSteps, hasProducts, availableProducts,
    // Booking
    selectedServices, cart,
    selectedDate, setSelectedDate, selectedDateRef,
    selectedTime, setSelectedTime,
    clientName, clientPhone,
    clientEmail, setClientEmail,
    clientNotes, setClientNotes,
    discountPercent, setDiscountPercent,
    durationOverride, setDurationOverride,
    useDynamicPrice, setUseDynamicPrice,
    // Client extras
    clientUserId, selectedClientId, setSelectedClientId,
    createdBookingId, setCreatedBookingId,
    clientHistoryTimes, loyaltyDiscount, partners,
    c2cReferrerBalance, c2cBonusToUse, setC2cBonusToUse,
    c2cRefCode, c2cDiscountPct,
    activeC2cDiscountPct, c2cAlreadyUsed,
    // Submit state
    saving, setSaving, saveError, setSaveError, upgradePromptOpen, setUpgradePromptOpen,
    // Products
    suggestedProductIds,
    // Form
    register, errors, trigger, watchName, watchPhone, setValue,
    // Helpers
    addToCart, removeFromCart, cartQty, toggleService,
  };
}
