'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Camera, Check, Loader2, Copy, ExternalLink, Plus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import {
  revalidateAfterOnboarding,
  saveOnboardingProfile,
  saveOnboardingSchedule,
  saveOnboardingService,
} from '@/app/(master)/dashboard/onboarding/actions';
import { e164ToInputPhone, formatPhoneDisplay, normalizePhoneInput, toFullPhone } from '@/lib/utils/phone';

type Step =
  | 'BASIC'
  | 'SCHEDULE_PROMPT'
  | 'SCHEDULE_FORM'
  | 'SERVICES_PROMPT'
  | 'SERVICES_FORM'
  | 'SUCCESS';

const STEP_ORDER: Step[] = [
  'BASIC',
  'SCHEDULE_PROMPT',
  'SCHEDULE_FORM',
  'SERVICES_PROMPT',
  'SERVICES_FORM',
  'SUCCESS',
];

const SPECIALIZATIONS = [
  { emoji: '💅', label: 'Манікюр' },
  { emoji: '✂️', label: 'Стрижки' },
  { emoji: '💆', label: 'Масаж' },
  { emoji: '👁️', label: 'Lash' },
  { emoji: '🌸', label: 'Брови' },
  { emoji: '💄', label: 'Макіяж' },
  { emoji: '💎', label: 'Нарощення' },
  { emoji: '✨', label: 'Інше' },
];

const DAYS_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAYS_UA: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд',
};

type DayKey = typeof DAYS_ORDER[number];
type DaySchedule = { is_working: boolean; start_time: string; end_time: string };

const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS_ORDER.map(d => [d, { is_working: !['sat', 'sun'].includes(d), start_time: '09:00', end_time: '18:00' }])
) as Record<DayKey, DaySchedule>;

const TEMPLATE_SCHEDULE = Object.fromEntries(
  DAYS_ORDER.map(d => [d, { is_working: !['sat', 'sun'].includes(d), start_time: '10:00', end_time: '19:00' }])
) as Record<DayKey, DaySchedule>;

const BUFFER_PRESETS = [0, 5, 10, 15, 20, 30];
const DURATION_PRESETS = [30, 45, 60, 90, 120];

const inputCls = 'w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all';

const CONFETTI_COLORS = ['#789A99', '#FFB4A0', '#5C9E7A', '#D4935A', '#C8A4C8', '#A8D8D8'];

function ConfettiParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: 5 + (i / 18) * 90,
    delay: (i / 18) * 0.5,
    duration: 1.4 + (i % 3) * 0.3,
    size: 5 + (i % 4) * 3,
    rotate: (i * 47) % 360,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: '110%', x: `${p.x}%`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: '-15%', opacity: 0, rotate: p.rotate, scale: 0.4 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          className="absolute bottom-0 rounded-sm"
          style={{ width: p.size, height: p.size, background: p.color }}
        />
      ))}
    </div>
  );
}

function getProgressStep(s: Step): number {
  if (s === 'BASIC') return 1;
  if (s === 'SCHEDULE_PROMPT' || s === 'SCHEDULE_FORM') return 2;
  if (s === 'SERVICES_PROMPT' || s === 'SERVICES_FORM') return 3;
  return 3;
}

export function OnboardingWizard() {
  const { profile, masterProfile, refresh } = useMasterContext();
  const { showToast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('BASIC');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState('');
  const [savedMasterId, setSavedMasterId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // BASIC: Brand face
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  // Якщо авторизація через SMS — phone вже збережений у profile, поле не показуємо
  const [phone, setPhone] = useState(() => e164ToInputPhone(profile?.phone));
  const hasPhone = !!profile?.phone;
  const [specialization, setSpecialization] = useState('💅');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'BASIC') {
      const t = setTimeout(() => firstInputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [step]);

  // SCHEDULE_FORM: Schedule + working hours
  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(DEFAULT_SCHEDULE);
  const [bufferTime, setBufferTime] = useState(0);
  const [breaks, setBreaks] = useState<Array<{ start: string; end: string }>>([]);

  // SERVICES_FORM: First service
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState(60);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function toggleDay(day: DayKey) {
    setSchedule(s => ({ ...s, [day]: { ...s[day], is_working: !s[day].is_working } }));
  }

  function addBreak() {
    setBreaks(prev => [...prev, { start: '13:00', end: '14:00' }]);
  }

  function removeBreak(i: number) {
    setBreaks(prev => prev.filter((_, idx) => idx !== i));
  }

  function setBreakField(i: number, field: 'start' | 'end', val: string) {
    setBreaks(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b));
  }

  function goTo(next: Step) {
    const currentIdx = STEP_ORDER.indexOf(step);
    const nextIdx = STEP_ORDER.indexOf(next);
    setDirection(nextIdx >= currentIdx ? 1 : -1);
    setStep(next);
  }

  // ── BASIC: зберегти профіль (обов'язково) ───────────────────────────────────
  async function handleSaveProfile() {
    if (!fullName.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const uid = profile?.id ?? user.id;

      // Upload avatar client-side (binary file)
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() ?? 'jpg';
        const path = `avatars/${uid}/${uid}.${ext}`;
        let uploadTimeoutId: ReturnType<typeof setTimeout> | undefined;
        try {
          const { data: up, error: upError } = await Promise.race([
            supabase.storage.from('images').upload(path, avatarFile, { upsert: true }),
            new Promise<never>((_, reject) => {
              uploadTimeoutId = setTimeout(() => reject(new Error('Timeout завантаження аватара')), 10_000);
            }),
          ]);
          clearTimeout(uploadTimeoutId);
          if (up) {
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
            avatarUrl = urlData.publicUrl;
          } else if (upError) {
            console.error('[onboarding] avatar upload error:', upError.message);
            showToast({ type: 'error', title: 'Аватар не завантажено', message: 'Спробуйте пізніше в налаштуваннях' });
          }
        } catch (uploadErr) {
          clearTimeout(uploadTimeoutId);
          console.error('[onboarding] avatar upload failed:', uploadErr);
          showToast({ type: 'error', title: 'Аватар не завантажено', message: 'Спробуйте пізніше в налаштуваннях' });
        }
      }

      const nameSlug = fullName.trim()
        .toLowerCase()
        .replace(/[іїєьъ]/g, '')
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24);
      const finalSlug = nameSlug || `master-${uid.slice(0, 8)}`;

      const arr = new Uint32Array(2);
      crypto.getRandomValues(arr);
      const referralCode = arr[0].toString(36).toUpperCase().slice(0, 8);

      const { error } = await saveOnboardingProfile({
        fullName: fullName.trim(),
        phone: phone.trim() ? toFullPhone(phone) : null,
        avatarUrl,
        avatarEmoji: specialization,
        slug: finalSlug,
        referralCode,
      });

      if (error) {
        showToast({ type: 'error', title: 'Помилка збереження', message: error });
        return;
      }

      setSavedSlug(finalSlug);
      setSavedMasterId(uid);
      goTo('SCHEDULE_PROMPT');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Щось пішло не так';
      showToast({ type: 'error', title: 'Помилка', message: msg });
    } finally {
      setSaving(false);
    }
  }

  // ── SCHEDULE_FORM: зберегти розклад (опціонально) ───────────────────────────
  async function handleSaveSchedule() {
    setSaving(true);
    try {
      const { error } = await saveOnboardingSchedule({ schedule, bufferTime, breaks });

      if (error) {
        showToast({ type: 'error', title: 'Помилка збереження', message: error });
        return;
      }

      goTo('SERVICES_PROMPT');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Щось пішло не так';
      showToast({ type: 'error', title: 'Помилка', message: msg });
    } finally {
      setSaving(false);
    }
  }

  // ── SERVICES_FORM: зберегти послугу (опціонально) ───────────────────────────
  async function handleSaveService() {
    if (!serviceName.trim() || !servicePrice) { goTo('SUCCESS'); return; }

    setSaving(true);
    try {
      const { error } = await saveOnboardingService({
        name: serviceName.trim(),
        emoji: specialization,
        price: parseFloat(servicePrice),
        durationMinutes: serviceDuration,
      });

      if (error) {
        showToast({ type: 'error', title: 'Помилка збереження', message: error });
        return;
      }

      goTo('SUCCESS');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Щось пішло не так';
      showToast({ type: 'error', title: 'Помилка', message: msg });
    } finally {
      setSaving(false);
    }
  }

  // ── SUCCESS: завершити онбординг ─────────────────────────────────────────────
  async function handleComplete() {
    await revalidateAfterOnboarding();
    await refresh();
    if (typeof window !== 'undefined') {
      localStorage.setItem('bookit_hints_pending', 'true');
    }
    router.push('/dashboard');
  }

  function handleCopyLink() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bookit.com.ua';
    navigator.clipboard.writeText(`${origin}/${savedSlug}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 44, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -44, scale: 0.97 }),
  };
  const transition = { type: 'spring' as const, stiffness: 320, damping: 28 };

  const progressStep = getProgressStep(step);
  const showProgress = step !== 'SUCCESS';

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <p className="text-center mb-7">
          <span className="font-serif text-2xl font-semibold text-[#2C1A14]">
            Bookit<span className="text-[#789A99]">.</span>
          </span>
        </p>

        {/* Progress bar */}
        {showProgress && (
          <div className="flex items-center gap-1.5 mb-6">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="flex-1 h-1.5 rounded-full transition-all duration-500"
                style={{ background: progressStep >= n ? '#789A99' : '#E8D5CF' }}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>

          {/* ─── BASIC: Brand Face ─── */}
          {step === 'BASIC' && (
            <motion.div
              key="BASIC"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="bento-card p-6"
            >
              <h2 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Обличчя бренду</h2>
              <p className="text-sm text-[#A8928D] mb-6">Як тебе побачать клієнти</p>

              <div className="flex flex-col items-center mb-6">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#789A99]/30 bg-white/70 flex items-center justify-center group hover:border-[#789A99] transition-colors"
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="Аватар" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{specialization}</span>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera size={20} className="text-white" />
                  </div>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <p className="text-xs text-[#A8928D] mt-2">Натисни щоб додати фото</p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">{"Ім'я та прізвище"}</label>
                  <input ref={firstInputRef} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ксенія Коваль" className={inputCls} />
                </div>
                {!hasPhone && (
                  <div>
                    <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Мобільний телефон</label>
                    <div className="flex items-center gap-0 rounded-2xl border border-white/80 bg-white/70 overflow-hidden focus-within:border-[#789A99] focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
                      <span className="pl-4 pr-2 text-[#6B5750] font-medium text-sm select-none shrink-0">+38</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="0XX XXX XX XX"
                        value={formatPhoneDisplay(phone)}
                        onChange={e => setPhone(normalizePhoneInput(e.target.value))}
                        className="flex-1 py-3 pr-4 text-[#2C1A14] text-sm bg-transparent outline-none placeholder:text-[#A8928D]"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-[#6B5750] mb-2 block">Спеціалізація</label>
                  <div className="grid grid-cols-4 gap-2">
                    {SPECIALIZATIONS.map(s => (
                      <button
                        key={s.emoji}
                        type="button"
                        onClick={() => setSpecialization(s.emoji)}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs transition-all ${
                          specialization === s.emoji
                            ? 'bg-[#789A99]/15 ring-2 ring-[#789A99] text-[#2C1A14] font-medium'
                            : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
                        }`}
                      >
                        <span className="text-xl">{s.emoji}</span>
                        <span className="text-[9px] leading-tight text-center">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={!fullName.trim() || saving}
                className="mt-6 w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors disabled:opacity-50"
              >
                {saving
                  ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
                  : <>Далі <ArrowRight size={16} /></>}
              </button>
            </motion.div>
          )}

          {/* ─── SCHEDULE_PROMPT ─── */}
          {step === 'SCHEDULE_PROMPT' && (
            <motion.div
              key="SCHEDULE_PROMPT"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="bento-card p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.05 }}
                className="text-5xl mb-4"
              >
                🎉
              </motion.div>

              <h2 className="heading-serif text-xl text-[#2C1A14] mb-2">Профіль успішно створено!</h2>
              <p className="text-sm text-[#6B5750] mb-7 leading-relaxed">
                Щоб клієнти могли до вас записуватися, потрібно налаштувати робочі години. Зробимо це зараз?
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => goTo('SCHEDULE_FORM')}
                  className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors"
                >
                  Налаштувати графік <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => goTo('SERVICES_PROMPT')}
                  className="w-full py-3 rounded-2xl bg-white/70 border border-white/80 text-sm font-medium text-[#6B5750] hover:bg-white transition-colors"
                >
                  Пропустити
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── SCHEDULE_FORM ─── */}
          {step === 'SCHEDULE_FORM' && (
            <motion.div
              key="SCHEDULE_FORM"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="bento-card p-6"
            >
              <button
                type="button"
                onClick={() => goTo('SCHEDULE_PROMPT')}
                className="flex items-center gap-1.5 text-xs text-[#A8928D] hover:text-[#6B5750] transition-colors mb-4"
              >
                <ArrowLeft size={13} /> Назад
              </button>

              <h2 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Твій час</h2>
              <p className="text-sm text-[#A8928D] mb-4">Коли ти приймаєш клієнтів</p>

              {/* Quick template */}
              <button
                type="button"
                onClick={() => setSchedule(TEMPLATE_SCHEDULE)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#789A99]/10 border border-[#789A99]/20 mb-4 hover:bg-[#789A99]/15 transition-colors"
              >
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#789A99]">Шаблон: Пн–Пт, 10:00–19:00</p>
                  <p className="text-[10px] text-[#A8928D] mt-0.5">Один клік — і розклад готовий</p>
                </div>
                <span className="text-[10px] font-semibold text-[#789A99] bg-[#789A99]/10 px-2.5 py-1 rounded-xl flex-shrink-0">
                  Застосувати
                </span>
              </button>

              {/* Day toggles */}
              <div className="flex flex-col gap-1.5 mb-5">
                {DAYS_ORDER.map(day => (
                  <div
                    key={day}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-opacity ${schedule[day].is_working ? '' : 'opacity-50'}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${schedule[day].is_working ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'}`}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-[left] duration-200"
                        style={{ left: schedule[day].is_working ? '17px' : '2px' }}
                      />
                    </button>
                    <span className="text-sm font-medium text-[#2C1A14] w-5 flex-shrink-0">{DAYS_UA[day]}</span>
                    {schedule[day].is_working ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="time"
                          value={schedule[day].start_time}
                          onChange={e => setSchedule(s => ({ ...s, [day]: { ...s[day], start_time: e.target.value } }))}
                          className="flex-1 px-2 py-1.5 rounded-lg bg-white/70 border border-white/80 text-xs text-[#2C1A14] outline-none focus:border-[#789A99]"
                        />
                        <span className="text-xs text-[#A8928D]">—</span>
                        <input
                          type="time"
                          value={schedule[day].end_time}
                          onChange={e => setSchedule(s => ({ ...s, [day]: { ...s[day], end_time: e.target.value } }))}
                          className="flex-1 px-2 py-1.5 rounded-lg bg-white/70 border border-white/80 text-xs text-[#2C1A14] outline-none focus:border-[#789A99]"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-[#A8928D]">Вихідний</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Buffer */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#6B5750] mb-2">Буфер між записами</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {BUFFER_PRESETS.map(min => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setBufferTime(min)}
                      className={`py-2 rounded-xl text-xs font-medium transition-all ${
                        bufferTime === min ? 'bg-[#789A99] text-white' : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
                      }`}
                    >
                      {min === 0 ? 'Без буферу' : `${min} хв`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Breaks */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#6B5750]">Перерви</p>
                  <button type="button" onClick={addBreak} className="flex items-center gap-1 text-xs text-[#789A99] font-medium hover:text-[#5C7E7D] transition-colors">
                    <Plus size={12} /> Додати
                  </button>
                </div>
                {breaks.length === 0 ? (
                  <p className="text-xs text-[#A8928D] py-1">Немає перерв — весь робочий час доступний</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {breaks.map((b, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="time" value={b.start} onChange={e => setBreakField(i, 'start', e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg bg-white/70 border border-white/80 text-xs text-[#2C1A14] outline-none focus:border-[#789A99]" />
                        <span className="text-xs text-[#A8928D]">—</span>
                        <input type="time" value={b.end} onChange={e => setBreakField(i, 'end', e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg bg-white/70 border border-white/80 text-xs text-[#2C1A14] outline-none focus:border-[#789A99]" />
                        <button type="button" onClick={() => removeBreak(i)} className="text-[#A8928D] hover:text-[#C05B5B] transition-colors flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors disabled:opacity-70"
              >
                {saving
                  ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
                  : <>Налаштувати та продовжити <ArrowRight size={16} /></>}
              </button>
            </motion.div>
          )}

          {/* ─── SERVICES_PROMPT ─── */}
          {step === 'SERVICES_PROMPT' && (
            <motion.div
              key="SERVICES_PROMPT"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="bento-card p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.05 }}
                className="text-5xl mb-4"
              >
                🚀
              </motion.div>

              <h2 className="heading-serif text-xl text-[#2C1A14] mb-2">Майже все!</h2>
              <p className="text-sm text-[#6B5750] mb-7 leading-relaxed">
                Додамо вашу першу послугу чи товар, щоб клієнтам було з чого обирати?
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => goTo('SERVICES_FORM')}
                  className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors"
                >
                  Додати послугу <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  className="w-full py-3 rounded-2xl bg-white/70 border border-white/80 text-sm font-medium text-[#6B5750] hover:bg-white transition-colors"
                >
                  Завершити та перейти в Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── SERVICES_FORM ─── */}
          {step === 'SERVICES_FORM' && (
            <motion.div
              key="SERVICES_FORM"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="bento-card p-6"
            >
              <button
                type="button"
                onClick={() => goTo('SERVICES_PROMPT')}
                className="flex items-center gap-1.5 text-xs text-[#A8928D] hover:text-[#6B5750] transition-colors mb-4"
              >
                <ArrowLeft size={13} /> Назад
              </button>

              <h2 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Ваша коронна послуга</h2>
              <p className="text-sm text-[#A8928D] mb-5">
                Додайте послугу, яку записують найчастіше. Решту зможете додати пізніше.
              </p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Назва послуги</label>
                  <input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Манікюр класичний" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Ціна, ₴</label>
                  <input type="number" value={servicePrice} onChange={e => setServicePrice(e.target.value)} placeholder="500" min="0" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B5750] mb-2 block">Тривалість</label>
                  <div className="flex gap-1.5">
                    {DURATION_PRESETS.map(min => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => setServiceDuration(min)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                          serviceDuration === min ? 'bg-[#789A99] text-white' : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
                        }`}
                      >
                        {min < 60 ? `${min}хв` : `${min / 60}г`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleSaveService}
                  disabled={saving || !serviceName.trim() || !servicePrice}
                  className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors disabled:opacity-50"
                >
                  {saving
                    ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
                    : <><Check size={16} /> Додати послугу</>}
                </button>
                <button
                  type="button"
                  onClick={() => goTo('SERVICES_PROMPT')}
                  disabled={saving}
                  className="w-full py-2 text-sm text-[#A8928D] hover:text-[#789A99] transition-colors"
                >
                  Скасувати
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── SUCCESS ─── */}
          {step === 'SUCCESS' && (
            <motion.div
              key="SUCCESS"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="relative bento-card p-6 overflow-hidden"
            >
              <ConfettiParticles />

              <div className="relative z-10 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-[#5C9E7A]/15 flex items-center justify-center mb-4"
                >
                  <Check size={28} className="text-[#5C9E7A]" strokeWidth={2.5} />
                </motion.div>

                <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="heading-serif text-2xl text-[#2C1A14] mb-1">
                  Твій Bookit готовий!
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-sm text-[#A8928D] mb-6">
                  Ділись посиланням і отримуй записи
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="w-full rounded-2xl bg-white/70 border border-white/80 p-4 mb-4 text-left">
                  <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wide mb-2">Твоя публічна сторінка</p>
                  <p className="text-sm font-mono text-[#2C1A14] mb-3 truncate">bookit.com.ua/{savedSlug}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${copied ? 'bg-[#5C9E7A]/15 text-[#5C9E7A]' : 'bg-[#789A99]/10 text-[#789A99] hover:bg-[#789A99]/20'}`}
                    >
                      {copied ? <><Check size={12} /> Скопійовано</> : <><Copy size={12} /> Копіювати</>}
                    </button>
                    <a href={`/${savedSlug}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/60 text-[#6B5750] hover:bg-white/80 transition-all">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleComplete}
                  className="w-full py-4 rounded-2xl bg-[#789A99] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors shadow-[0_8px_24px_rgba(120,154,153,0.35)]"
                >
                  Поїхали в CRM! <ArrowRight size={18} />
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
