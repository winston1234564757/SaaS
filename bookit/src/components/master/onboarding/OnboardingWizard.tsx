'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';

const AVATAR_EMOJIS = ['💅','👑','✂️','💆','💇','🌸','✨','💎','🌺','🪞','🖌️','💄'];
const SERVICE_EMOJIS = ['💅','✂️','💆','💇','💄','🌸','✨','💎'];
const DAYS_ORDER = ['mon','tue','wed','thu','fri','sat','sun'] as const;
const DAYS_UA: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд',
};

type DayKey = typeof DAYS_ORDER[number];
type DaySchedule = { is_working: boolean; start_time: string; end_time: string };

const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS_ORDER.map(d => [d, { is_working: !['sat','sun'].includes(d), start_time: '09:00', end_time: '18:00' }])
) as Record<DayKey, DaySchedule>;

const inputCls = 'w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all';

export function OnboardingWizard() {
  const { profile, masterProfile, refresh } = useMasterContext();
  const { showToast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1|2|3>(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Profile
  const [avatar, setAvatar] = useState('💅');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [slug, setSlug] = useState('');

  // Step 2: First service
  const [skipService, setSkipService] = useState(false);
  const [serviceEmoji, setServiceEmoji] = useState('✨');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('60');

  // Step 3: Schedule + publish
  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(DEFAULT_SCHEDULE);
  const [isPublished, setIsPublished] = useState(false);

  function toggleDay(day: DayKey) {
    setSchedule(s => ({ ...s, [day]: { ...s[day], is_working: !s[day].is_working } }));
  }

  async function handleFinish() {
    if (!masterProfile?.id || !profile?.id) return;
    setSaving(true);

    const ops = [
      supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id),
      supabase.from('master_profiles').update({
        bio: bio || null,
        city: city || null,
        slug: slug || null,
        avatar_emoji: avatar,
        is_published: isPublished,
      }).eq('id', masterProfile.id),
      ...DAYS_ORDER.map(day =>
        supabase.from('schedule_templates').upsert({
          master_id: masterProfile.id,
          day_of_week: day,
          ...schedule[day],
        }, { onConflict: 'master_id,day_of_week' })
      ),
    ];

    if (!skipService && serviceName.trim() && servicePrice) {
      ops.push(
        supabase.from('services').insert({
          master_id: masterProfile.id,
          name: serviceName.trim(),
          emoji: serviceEmoji,
          category: 'Інше',
          price: parseFloat(servicePrice),
          duration_minutes: parseInt(serviceDuration),
          is_active: true,
          is_popular: false,
          sort_order: 0,
        })
      );
    }

    await Promise.all(ops);
    await refresh();
    setSaving(false);
    showToast({ type: 'success', title: 'Профіль налаштовано!' });
    router.push('/dashboard');
  }

  const slideVariants = {
    enter: { opacity: 0, x: 40, scale: 0.97 },
    center: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -40, scale: 0.97 },
  };

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
        <div className="flex items-center gap-1.5 mb-6">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="flex-1 h-1.5 rounded-full transition-all duration-500"
              style={{ background: step >= n ? '#789A99' : '#E8D5CF' }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── Step 1: Profile ─── */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bento-card p-6"
            >
              <h2 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Твій профіль</h2>
              <p className="text-sm text-[#A8928D] mb-5">Розкажи клієнтам про себе</p>

              {/* Avatar picker */}
              <p className="text-xs font-medium text-[#6B5750] mb-2">Аватар</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {AVATAR_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => setAvatar(e)}
                    className={`w-10 h-10 rounded-xl text-xl transition-all ${
                      avatar === e
                        ? 'bg-[#789A99]/20 ring-2 ring-[#789A99] scale-105'
                        : 'bg-white/70 border border-white/80 hover:bg-white'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
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
                  <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Про себе</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Майстер з манікюру, 5 років досвіду..."
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Місто</label>
                  <input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Київ"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Адреса сторінки</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-3 rounded-2xl bg-white/40 border border-white/60 text-xs text-[#A8928D] flex-shrink-0 whitespace-nowrap">
                      bookit.com.ua/
                    </span>
                    <input
                      value={slug}
                      onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="your-slug"
                      className={`${inputCls} flex-1`}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!fullName.trim()}
                className="mt-5 w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors disabled:opacity-50"
              >
                Далі <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ─── Step 2: First service ─── */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bento-card p-6"
            >
              <h2 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Перша послуга</h2>
              <p className="text-sm text-[#A8928D] mb-5">Що ти пропонуєш клієнтам?</p>

              {!skipService ? (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 flex-wrap">
                    {SERVICE_EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setServiceEmoji(e)}
                        className={`w-10 h-10 rounded-xl text-xl transition-all ${
                          serviceEmoji === e
                            ? 'bg-[#789A99]/20 ring-2 ring-[#789A99] scale-105'
                            : 'bg-white/70 border border-white/80 hover:bg-white'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
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
                      <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Тривалість, хв</label>
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
                  <p className="text-4xl mb-3">✂️</p>
                  <p className="text-sm text-[#6B5750]">Послугу можна додати пізніше</p>
                  <p className="text-xs text-[#A8928D] mt-1">Розділ «Послуги» у бічному меню</p>
                </div>
              )}

              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => setStep(1)}
                  className="p-3.5 rounded-2xl bg-white/70 border border-white/80 hover:bg-white transition-colors flex-shrink-0"
                >
                  <ArrowLeft size={16} className="text-[#6B5750]" />
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors"
                >
                  Далі <ArrowRight size={16} />
                </button>
              </div>
              <button
                onClick={() => setSkipService(p => !p)}
                className="mt-2.5 w-full text-sm text-[#A8928D] hover:text-[#789A99] transition-colors py-1.5"
              >
                {skipService ? 'Додати послугу' : 'Пропустити'}
              </button>
            </motion.div>
          )}

          {/* ─── Step 3: Schedule + Publish ─── */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bento-card p-6"
            >
              <h2 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Графік роботи</h2>
              <p className="text-sm text-[#A8928D] mb-4">Коли ти приймаєш клієнтів</p>

              <div className="flex flex-col gap-1.5 mb-4">
                {DAYS_ORDER.map(day => (
                  <div
                    key={day}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-opacity ${
                      schedule[day].is_working ? '' : 'opacity-50'
                    }`}
                  >
                    <button
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
                    <span className="text-sm font-medium text-[#2C1A14] w-5 flex-shrink-0">
                      {DAYS_UA[day]}
                    </span>
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

              {/* Publish toggle */}
              <button
                onClick={() => setIsPublished(p => !p)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all mb-5 ${
                  isPublished
                    ? 'bg-[#5C9E7A]/10 border-[#5C9E7A]/30'
                    : 'bg-white/70 border-white/80 hover:bg-white'
                }`}
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-[#2C1A14]">
                    {isPublished ? 'Сторінка відкрита' : 'Опублікувати зараз?'}
                  </p>
                  <p className="text-xs text-[#A8928D] mt-0.5">
                    {isPublished ? 'Клієнти можуть знайти тебе' : 'Можна увімкнути пізніше'}
                  </p>
                </div>
                <div className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${isPublished ? 'bg-[#5C9E7A]' : 'bg-[#E8D5CF]'}`}>
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-[left] duration-200"
                    style={{ left: isPublished ? '20px' : '2px' }}
                  />
                </div>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="p-3.5 rounded-2xl bg-white/70 border border-white/80 hover:bg-white transition-colors flex-shrink-0"
                >
                  <ArrowLeft size={16} className="text-[#6B5750]" />
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors disabled:opacity-70"
                >
                  {saving
                    ? <><Loader2 size={16} className="animate-spin" /> Збереження...</>
                    : <><Check size={16} /> Готово!</>
                  }
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
