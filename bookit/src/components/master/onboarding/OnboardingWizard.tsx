'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Camera, Check, Loader2, Copy, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';

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

export function OnboardingWizard() {
  const { profile, masterProfile, refresh } = useMasterContext();
  const { showToast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState('');
  const [copied, setCopied] = useState(false);

  // Step 1: Brand face
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [specialization, setSpecialization] = useState('💅');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Schedule
  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(DEFAULT_SCHEDULE);

  // Step 3: First service
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('60');
  const [skipService, setSkipService] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function toggleDay(day: DayKey) {
    setSchedule(s => ({ ...s, [day]: { ...s[day], is_working: !s[day].is_working } }));
  }

  function goTo(next: 1 | 2 | 3 | 4) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const uid = profile?.id ?? user.id;

      // Upload avatar if provided
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() ?? 'jpg';
        const path = `avatars/${uid}.${ext}`;
        const { data: up } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
        if (up) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
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

      if (!masterProfile?.id) {
        await supabase.from('profiles').upsert(
          {
            id: uid,
            role: 'master',
            full_name: fullName,
            email: user.email,
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          },
          { onConflict: 'id' }
        ).throwOnError();

        await supabase.from('master_profiles').insert({
          id: uid,
          slug: finalSlug,
          avatar_emoji: specialization,
          is_published: true,
          referral_code: referralCode,
        }).throwOnError();
      } else {
        await Promise.all([
          supabase.from('profiles').update({
            full_name: fullName,
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          }).eq('id', uid).throwOnError(),
          supabase.from('master_profiles').update({
            slug: finalSlug,
            avatar_emoji: specialization,
            is_published: true,
          }).eq('id', masterProfile.id).throwOnError(),
        ]);
      }

      const masterId = masterProfile?.id ?? uid;

      await Promise.all(
        DAYS_ORDER.map(day =>
          supabase.from('schedule_templates').upsert({
            master_id: masterId,
            day_of_week: day,
            ...schedule[day],
          }, { onConflict: 'master_id,day_of_week' })
        )
      );

      if (!skipService && serviceName.trim() && servicePrice) {
        await supabase.from('services').insert({
          master_id: masterId,
          name: serviceName.trim(),
          emoji: specialization,
          category: 'Інше',
          price: parseFloat(servicePrice),
          duration_minutes: parseInt(serviceDuration),
          is_active: true,
          is_popular: false,
          sort_order: 0,
        });
      }

      await refresh();
      setSavedSlug(finalSlug);
      setDirection(1);
      setStep(4);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Щось пішло не так';
      showToast({ type: 'error', title: 'Помилка', message: msg });
    } finally {
      setSaving(false);
    }
  }

  function handleGoToDashboard() {
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

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <p className="text-center mb-7">
          <span className="font-serif text-2xl font-semibold text-[#2C1A14]">
            Bookit<span className="text-[#789A99]">.</span>
          </span>
        </p>

        {/* Progress bar — hidden on success step */}
        {step < 4 && (
          <div className="flex items-center gap-1.5 mb-6">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="flex-1 h-1.5 rounded-full transition-all duration-500"
                style={{ background: step >= n ? '#789A99' : '#E8D5CF' }}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>

          {/* ─── Step 1: Brand Face ─── */}
          {step === 1 && (
            <motion.div
              key="step1"
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

              {/* Avatar upload */}
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <p className="text-xs text-[#A8928D] mt-2">Натисни щоб додати фото</p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">{"Ім'я та прізвище"}</label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ксенія Коваль"
                    className={inputCls}
                  />
                </div>

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
                onClick={() => goTo(2)}
                disabled={!fullName.trim()}
                className="mt-6 w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors disabled:opacity-50"
              >
                Далі <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ─── Step 2: Schedule ─── */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="bento-card p-6"
            >
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

              <div className="flex flex-col gap-1.5 mb-4">
                {DAYS_ORDER.map(day => (
                  <div
                    key={day}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-opacity ${
                      schedule[day].is_working ? '' : 'opacity-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                        schedule[day].is_working ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'
                      }`}
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  className="p-3.5 rounded-2xl bg-white/70 border border-white/80 hover:bg-white transition-colors flex-shrink-0"
                >
                  <ArrowLeft size={16} className="text-[#6B5750]" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(3)}
                  className="flex-1 py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors"
                >
                  Далі <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: First Service ─── */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="bento-card p-6"
            >
              <h2 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Ваша коронна послуга</h2>
              <p className="text-sm text-[#A8928D] mb-5">Додайте послугу, на яку до вас записуються найчастіше. Інші послуги ви зможете додати пізніше в налаштуваннях.</p>

              {!skipService ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Назва послуги</label>
                    <input
                      value={serviceName}
                      onChange={e => setServiceName(e.target.value)}
                      placeholder="Манікюр класичний"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Ціна, ₴</label>
                      <input
                        type="number"
                        value={servicePrice}
                        onChange={e => setServicePrice(e.target.value)}
                        placeholder="500"
                        min="0"
                        className={inputCls}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Хвилин</label>
                      <input
                        type="number"
                        value={serviceDuration}
                        onChange={e => setServiceDuration(e.target.value)}
                        placeholder="60"
                        min="15"
                        step="15"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-4xl mb-3">✨</p>
                  <p className="text-sm text-[#6B5750]">Послугу можна додати пізніше</p>
                  <p className="text-xs text-[#A8928D] mt-1">Розділ «Послуги» в меню</p>
                </div>
              )}

              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  className="p-3.5 rounded-2xl bg-white/70 border border-white/80 hover:bg-white transition-colors flex-shrink-0"
                >
                  <ArrowLeft size={16} className="text-[#6B5750]" />
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors disabled:opacity-70"
                >
                  {saving
                    ? <><Loader2 size={16} className="animate-spin" /> Збереження...</>
                    : <><Check size={16} /> Все готово!</>}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSkipService(p => !p)}
                className="mt-2.5 w-full text-sm text-[#A8928D] hover:text-[#789A99] transition-colors py-1.5"
              >
                {skipService ? 'Додати послугу' : 'Пропустити'}
              </button>
            </motion.div>
          )}

          {/* ─── Step 4: Success / Magic ─── */}
          {step === 4 && (
            <motion.div
              key="step4"
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
                {/* Success icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-[#5C9E7A]/15 flex items-center justify-center mb-4"
                >
                  <Check size={28} className="text-[#5C9E7A]" strokeWidth={2.5} />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="heading-serif text-2xl text-[#2C1A14] mb-1"
                >
                  Твій Bookit готовий!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm text-[#A8928D] mb-6"
                >
                  Ділись посиланням і отримуй записи
                </motion.p>

                {/* Link card */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="w-full rounded-2xl bg-white/70 border border-white/80 p-4 mb-4 text-left"
                >
                  <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wide mb-2">
                    Твоя публічна сторінка
                  </p>
                  <p className="text-sm font-mono text-[#2C1A14] mb-3 truncate">
                    bookit.com.ua/{savedSlug}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        copied
                          ? 'bg-[#5C9E7A]/15 text-[#5C9E7A]'
                          : 'bg-[#789A99]/10 text-[#789A99] hover:bg-[#789A99]/20'
                      }`}
                    >
                      {copied
                        ? <><Check size={12} /> Скопійовано</>
                        : <><Copy size={12} /> Копіювати</>}
                    </button>
                    <a
                      href={`/${savedSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/60 text-[#6B5750] hover:bg-white/80 transition-all"
                    >
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
                  onClick={handleGoToDashboard}
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
