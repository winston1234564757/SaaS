'use client';

import { useState, useEffect, useRef } from 'react';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, ExternalLink, Instagram, Send, Lock, MessageSquare, CreditCard, ChevronRight, LogOut, Plus, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { VacationManager } from './VacationManager';
import { ImageUploader } from '@/components/master/services/ImageUploader';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import { moodThemes, type MoodThemeKey } from '@/lib/constants/themes';
import type { BreakWindow } from '@/types/database';
import { e164ToInputPhone, formatPhoneDisplay, normalizePhoneInput, normalizeToE164, toFullPhone } from '@/lib/utils/phone';
import { generateTelegramConnectToken } from '@/app/(master)/dashboard/settings/actions';
import { markTourSeen } from '@/app/(master)/dashboard/actions';

const AVATAR_EMOJIS = ['💅','👑','✂️','💆','💇','🌸','✨','💎','🌺','🪞','🖌️','💄'];

const DAYS_UA: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд',
};
const DAYS_ORDER = ['mon','tue','wed','thu','fri','sat','sun'] as const;

type DayKey = typeof DAYS_ORDER[number];

interface DaySchedule {
  is_working: boolean;
  start_time: string;
  end_time: string;
}

type Schedule = Record<DayKey, DaySchedule>;

const DEFAULT_SCHEDULE: Schedule = Object.fromEntries(
  DAYS_ORDER.map(d => [d, { is_working: !['sat','sun'].includes(d), start_time: '09:00', end_time: '18:00' }])
) as Schedule;

export function SettingsPage() {
  const { profile, masterProfile, refresh } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('settings', 2, {
    initialSeen: seenTours?.settings ?? false,
    onComplete: () => markTourSeen('settings').then(() => undefined),
  });
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Форма профілю
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [slug, setSlug] = useState('');
  const [avatar, setAvatar] = useState('💅');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [themeKey, setThemeKey] = useState<MoodThemeKey>('default');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);

  // Working-hours config (buffer + global breaks)
  const [bufferTime, setBufferTime] = useState(0);
  const [breaks, setBreaks] = useState<BreakWindow[]>([]);

  // Guard: only initialize form from server data once — prevents useEffect from
  // overwriting user's in-progress edits whenever profile refreshes after save.
  const formInitialized = useRef(false);
  const scheduleInitialized = useRef(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle');
  const [isDirty, setIsDirty] = useState(false);

  // Snapshots captured on first load — used for dirty detection and cancel reset
  const initialFormSnap = useRef<{
    fullName: string; phone: string; bio: string; slug: string;
    city: string; address: string; instagram: string; telegram: string; telegramChatId: string;
    isPublished: boolean; avatar: string; themeKey: MoodThemeKey;
    avatarUrl: string | null; bufferTime: number; breaks: BreakWindow[];
  } | null>(null);
  const initialScheduleSnap = useRef<Schedule | null>(null);

  // Telegram connect token flow (SEC-HIGH-2: one-time token instead of public slug)
  const [tgConnectToken, setTgConnectToken] = useState<string | null>(null);
  const [tgConnectLoading, setTgConnectLoading] = useState(false);


  // Ініціалізація з даних — runs once when both profile and masterProfile first arrive.
  // formInitialized.current prevents subsequent context refreshes (after save) from
  // overwriting edits the user is currently making in the form.
  useEffect(() => {
    if (formInitialized.current || !profile || !masterProfile) return;
    formInitialized.current = true;
    setFullName(profile.full_name ?? '');
    setPhone(e164ToInputPhone(profile.phone));
    setAvatarUrl(profile.avatar_url ?? null);
    setBio(masterProfile.bio ?? '');
    setSlug(masterProfile.slug ?? '');
    setCity(masterProfile.city ?? '');
    setAddress((masterProfile as any).address ?? '');
    setInstagram(masterProfile.instagram_url ?? '');
    setTelegram(masterProfile.telegram_url ?? '');
    setTelegramChatId(masterProfile.telegram_chat_id ?? '');
    setIsPublished(masterProfile.is_published ?? false);
    setAvatar(masterProfile.avatar_emoji ?? '💅');
    setThemeKey((masterProfile.mood_theme as MoodThemeKey) ?? 'default');
    const wh = masterProfile.working_hours;
    setBufferTime(wh?.buffer_time_minutes ?? 0);
    setBreaks(wh?.breaks ?? []);
    initialFormSnap.current = {
      fullName: profile.full_name ?? '',
      phone: e164ToInputPhone(profile.phone),
      bio: masterProfile.bio ?? '',
      slug: masterProfile.slug ?? '',
      city: masterProfile.city ?? '',
      address: (masterProfile as any).address ?? '',
      instagram: masterProfile.instagram_url ?? '',
      telegram: masterProfile.telegram_url ?? '',
      telegramChatId: masterProfile.telegram_chat_id ?? '',
      isPublished: masterProfile.is_published ?? false,
      avatar: masterProfile.avatar_emoji ?? '💅',
      themeKey: (masterProfile.mood_theme as MoodThemeKey) ?? 'default',
      avatarUrl: profile.avatar_url ?? null,
      bufferTime: wh?.buffer_time_minutes ?? 0,
      breaks: wh?.breaks ?? [],
    };
  }, [profile, masterProfile]);

  // Перевірка доступності slug
  useEffect(() => {
    if (!slug || !masterProfile?.id || slug === masterProfile.slug) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('master_profiles')
        .select('id')
        .eq('slug', slug)
        .neq('id', masterProfile.id)
        .maybeSingle();
      setSlugStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timer);
  }, [slug, masterProfile?.id, masterProfile?.slug]);

  // Завантаження графіку — once only, same guard as form fields
  useEffect(() => {
    if (scheduleInitialized.current || !masterProfile?.id) return;
    scheduleInitialized.current = true;
    // Set default schedule snapshot immediately so dirty detection works even if fetch is slow
    initialScheduleSnap.current = { ...DEFAULT_SCHEDULE };
    const supabase = createClient();
    supabase
      .from('schedule_templates')
      .select('*')
      .eq('master_id', masterProfile.id)
      .then((res: { data: any[] | null }) => {
        const data = res.data;
        if (data && data.length > 0) {
          const s = { ...DEFAULT_SCHEDULE };
          data.forEach((row: any) => {
            if (row.day_of_week in s) {
              s[row.day_of_week as DayKey] = {
                is_working: row.is_working,
                start_time: (row.start_time as string | null)?.slice(0, 5) ?? '09:00',
                end_time: (row.end_time as string | null)?.slice(0, 5) ?? '18:00',
              };
            }
          });
          setSchedule(s);
          initialScheduleSnap.current = s;
        }
      });
  }, [masterProfile?.id]);

  // Dirty detection — compares current field values against initial snapshot
  useEffect(() => {
    if (!initialFormSnap.current || !initialScheduleSnap.current) return;
    const f = initialFormSnap.current;
    const formChanged =
      fullName !== f.fullName || phone !== f.phone || bio !== f.bio ||
      slug !== f.slug || city !== f.city || address !== f.address || instagram !== f.instagram ||
      telegram !== f.telegram || telegramChatId !== f.telegramChatId ||
      isPublished !== f.isPublished || avatar !== f.avatar ||
      themeKey !== f.themeKey || avatarUrl !== f.avatarUrl ||
      bufferTime !== f.bufferTime ||
      JSON.stringify(breaks) !== JSON.stringify(f.breaks);
    const scheduleChanged =
      JSON.stringify(schedule) !== JSON.stringify(initialScheduleSnap.current);
    setIsDirty(formChanged || scheduleChanged);
  }, [fullName, phone, bio, slug, city, address, instagram, telegram, telegramChatId,
      isPublished, avatar, themeKey, avatarUrl, bufferTime, breaks, schedule]);

  function handleCancel() {
    const f = initialFormSnap.current;
    if (!f) return;
    setFullName(f.fullName);
    setPhone(f.phone);
    setBio(f.bio);
    setSlug(f.slug);
    setCity(f.city);
    setAddress(f.address);
    setInstagram(f.instagram);
    setTelegram(f.telegram);
    setTelegramChatId(f.telegramChatId);
    setIsPublished(f.isPublished);
    setAvatar(f.avatar);
    setThemeKey(f.themeKey);
    setAvatarUrl(f.avatarUrl);
    setBufferTime(f.bufferTime);
    setBreaks(f.breaks);
    if (initialScheduleSnap.current) setSchedule(initialScheduleSnap.current);
    setIsDirty(false);
  }

  async function handleSave() {
    if (!masterProfile?.id || !profile?.id) {
      showToast({ type: 'error', title: 'Помилка', message: 'Профіль ще завантажується, спробуйте ще раз' });
      return;
    }
    setSaving(true);
    const supabase = createClient();

    try {
      const cleanPhone = phone.trim() ? (normalizeToE164(toFullPhone(phone)) ?? null) : null;
      await Promise.all([
        supabase.from('profiles').update({ full_name: fullName, phone: cleanPhone, avatar_url: avatarUrl }).eq('id', profile.id).throwOnError(),
        supabase.from('master_profiles').update({
          bio, city, address: address || null, slug,
          avatar_emoji: avatar,
          instagram_url: instagram || null,
          telegram_url: telegram || null,
          telegram_chat_id: telegramChatId.trim() || null,
          is_published: isPublished,
          mood_theme: themeKey,
          working_hours: {
            buffer_time_minutes: bufferTime,
            breaks: breaks.filter(b => b.start && b.end),
          },
        }).eq('id', masterProfile.id).throwOnError(),
        // Upsert кожен день
        ...DAYS_ORDER.map(day =>
          supabase.from('schedule_templates').upsert({
            master_id: masterProfile.id,
            day_of_week: day,
            ...schedule[day],
          }, { onConflict: 'master_id,day_of_week' }).throwOnError()
        ),
      ]);

      setSaved(true);
      showToast({ type: 'success', title: 'Налаштування збережено' });
      setTimeout(() => setSaved(false), 2500);
      // Update snapshots so cancel would reset to the freshly saved state
      initialFormSnap.current = { fullName, phone, bio, slug, city, address, instagram, telegram, telegramChatId, isPublished, avatar, themeKey, avatarUrl, bufferTime, breaks };
      initialScheduleSnap.current = { ...schedule };
      setIsDirty(false);
      // Оновлюємо контекст у фоні — не блокуємо UI
      refresh().catch(() => {});
    } catch (error: any) {
      showToast({ type: 'error', title: 'Помилка збереження', message: error?.message || 'Спробуйте ще раз' });
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateTelegramToken() {
    setTgConnectLoading(true);
    setTgConnectToken(null);
    const { token, error } = await generateTelegramConnectToken();
    setTgConnectLoading(false);
    if (error || !token) {
      showToast({ type: 'error', title: 'Помилка', message: error ?? 'Спробуйте ще раз' });
      return;
    }
    setTgConnectToken(token);
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

  function toggleDay(day: DayKey) {
    setSchedule(s => ({ ...s, [day]: { ...s[day], is_working: !s[day].is_working } }));
  }

  function setDayTime(day: DayKey, field: 'start_time' | 'end_time', val: string) {
    setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: val } }));
  }

  const inputCls = "w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none transition-all focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20";

  return (
    <div className="flex flex-col gap-4 pb-10">
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Налаштування</h1>
        <p className="text-sm text-[#A8928D]">Профіль, графік та публікація</p>
      </div>

      {/* Аватар + ім'я */}
      <Section title="Профіль">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-2">Фото профілю</p>
            {profile?.id && (
              <ImageUploader
                folder="avatars"
                masterId={profile.id}
                value={avatarUrl ?? undefined}
                onChange={setAvatarUrl}
              />
            )}
            {avatarUrl && (
              <p className="text-[11px] text-[#A8928D] mt-1.5">
                Фото використовується замість emoji-аватару на публічній сторінці
              </p>
            )}
          </div>

          {!avatarUrl && (
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-2">Emoji-аватар <span className="font-normal text-[#A8928D]">(якщо немає фото)</span></p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => setAvatar(e)}
                    className={`w-11 h-11 rounded-2xl text-2xl transition-all ${
                      avatar === e
                        ? 'bg-[#789A99]/20 ring-2 ring-[#789A99] scale-105'
                        : 'bg-white/70 border border-white/80 hover:bg-white'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Повне ім'я</label>
            <input data-testid="settings-name-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ваше ім'я та прізвище" className={inputCls} />
          </div>

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

          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Про себе</label>
            <textarea
              data-testid="settings-bio-textarea"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Розкажіть про себе та свої послуги..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Місто</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Київ" className={inputCls} />
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Адреса (вулиця, номер)</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="вул. Хрещатик, 1"
              className={inputCls}
            />
            <p className="text-[11px] text-[#A8928D] mt-1">Клієнти зможуть відкрити адресу на картах</p>
          </div>
        </div>
      </Section>

      {/* Публічна сторінка */}
      <Section title="Публічна сторінка">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Адреса сторінки</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center px-4 py-3 rounded-2xl bg-white/40 border border-white/60 text-sm text-[#A8928D] flex-shrink-0">
                bookit.com.ua/
              </div>
              <input
                data-testid="settings-slug-input"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="your-slug"
                className={`${inputCls} flex-1`}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 min-h-[18px]">
              {slug && (
                <a
                  href={`/${slug}`}
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs text-[#789A99] hover:text-[#5C7E7D] transition-colors"
                >
                  <ExternalLink size={12} />
                  Переглянути
                </a>
              )}
              <span className="ml-auto text-xs">
                {slugStatus === 'checking' && (
                  <span className="flex items-center gap-1 text-[#A8928D]">
                    <Loader2 size={11} className="animate-spin" /> Перевірка...
                  </span>
                )}
                {slugStatus === 'available' && (
                  <span className="text-[#5C9E7A] font-medium">✓ Доступно</span>
                )}
                {slugStatus === 'taken' && (
                  <span className="text-[#C05B5B] font-medium">✗ Вже зайнято</span>
                )}
              </span>
            </div>
          </div>

          {/* Публікація */}
          <button
            onClick={() => setIsPublished(p => !p)}
            className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all ${
              isPublished
                ? 'bg-[#5C9E7A]/10 border-[#5C9E7A]/30'
                : 'bg-white/70 border-white/80 hover:bg-white'
            }`}
          >
            <div className="text-left">
              <p className="text-sm font-medium text-[#2C1A14]">
                {isPublished ? 'Сторінка опублікована' : 'Сторінка прихована'}
              </p>
              <p className="text-xs text-[#A8928D] mt-0.5">
                {isPublished ? 'Клієнти можуть знайти вас та записатися' : 'Ніхто не бачить вашу сторінку'}
              </p>
            </div>
            <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${isPublished ? 'bg-[#5C9E7A]' : 'bg-[#E8D5CF]'}`}>
              <motion.div
                animate={{ x: isPublished ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </div>
          </button>
        </div>
      </Section>

      {/* Соціальні мережі */}
      <Section title="Соціальні мережі">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 flex items-center gap-1.5">
              <Instagram size={12} /> Instagram
            </label>
            <input
              data-testid="settings-instagram-input"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="https://instagram.com/..."
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 flex items-center gap-1.5">
              <Send size={12} /> Telegram
            </label>
            <input
              data-testid="settings-telegram-input"
              value={telegram}
              onChange={e => setTelegram(e.target.value)}
              placeholder="https://t.me/..."
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">
              Telegram сповіщення
            </label>
            {process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ? (
              <div className="flex flex-col gap-2">
                {telegramChatId ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#5C9E7A]/8 border border-[#5C9E7A]/20">
                    <span className="text-xs text-[#5C9E7A] font-medium flex-1">Telegram підключено (ID: {telegramChatId})</span>
                    <button
                      onClick={() => { setTelegramChatId(''); setTgConnectToken(null); }}
                      className="text-[11px] text-[#C05B5B] hover:underline"
                    >
                      Відключити
                    </button>
                  </div>
                ) : tgConnectToken ? (
                  <div className="flex flex-col gap-2">
                    <a
                      href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME}?start=${tgConnectToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#229ED9] text-white text-sm font-semibold hover:bg-[#1a85c4] transition-colors"
                    >
                      <Send size={14} /> Відкрити Telegram бота
                    </a>
                    <p className="text-[11px] text-[#A8928D]">
                      Натисніть кнопку вище — бот підтвердить підключення автоматично. Токен діє одноразово.
                    </p>
                    <button
                      onClick={handleGenerateTelegramToken}
                      className="text-xs text-[#789A99] hover:underline self-start"
                    >
                      Згенерувати новий токен
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateTelegramToken}
                    disabled={tgConnectLoading}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#229ED9] text-white text-sm font-semibold hover:bg-[#1a85c4] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {tgConnectLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Підключити Telegram бота
                  </button>
                )}
                <p className="text-[11px] text-[#A8928D]">Після підключення бот надсилатиме сповіщення про нові записи</p>
              </div>
            ) : (
              <div>
                <input
                  value={telegramChatId}
                  onChange={e => setTelegramChatId(e.target.value)}
                  placeholder="123456789"
                  className={inputCls}
                />
                <p className="text-[11px] text-[#A8928D] mt-1">
                  Вставте свій Telegram Chat ID
                </p>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Тема сторінки */}
      <Section title="Тема сторінки">
        <div className="grid grid-cols-2 gap-2.5">
          {(Object.entries(moodThemes) as [MoodThemeKey, typeof moodThemes[MoodThemeKey]][]).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setThemeKey(key)}
              className="relative p-3.5 rounded-2xl border transition-all text-left"
              style={
                themeKey === key
                  ? { boxShadow: `0 0 0 2px ${t.accent}`, background: `${t.accent}10`, borderColor: `${t.accent}40` }
                  : { background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.8)' }
              }
            >
              {/* Кольоровий превʼю */}
              <div
                className="w-full h-9 rounded-xl mb-2 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})` }}
              >
                <div
                  className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full"
                  style={{ background: t.accent }}
                />
              </div>
              <p className="text-xs font-semibold text-[#2C1A14]">{t.name}</p>
              {t.isExclusive && (
                <div className="absolute top-2 right-2 flex items-center gap-0.5">
                  <Lock size={9} className="text-[#A8928D]" />
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#A8928D] mt-2.5">Тема відображається на вашій публічній сторінці</p>
      </Section>

      <div className={cn(
        'relative rounded-2xl transition-all duration-500',
        currentStep === 0 && 'tour-glow z-40 scale-[1.02]'
      )}>
        <AnchoredTooltip
          isOpen={currentStep === 0}
          onClose={closeTour}
          title="🕐 Робочий час"
          text="Налаштуйте свої робочі години та стандартні перерви. Ваша публічна сторінка автоматично підлаштується."
          position="bottom"
          primaryButtonText="Далі →"
          onPrimaryClick={nextStep}
        />
        {/* Графік роботи */}
        <Section title="Графік роботи">
        <div className="flex flex-col gap-2">
          {DAYS_ORDER.map(day => (
            <div
              key={day}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors ${
                schedule[day].is_working ? 'bg-white/50' : 'opacity-50'
              }`}
            >
              <button
                data-testid={`settings-day-toggle-${day}`}
                onClick={() => toggleDay(day)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  schedule[day].is_working ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'
                }`}
              >
                <motion.div
                  animate={{ x: schedule[day].is_working ? 18 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                />
              </button>

              <span className="text-sm font-medium text-[#2C1A14] w-6 flex-shrink-0">{DAYS_UA[day]}</span>

              {schedule[day].is_working ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={schedule[day].start_time}
                    onChange={e => setDayTime(day, 'start_time', e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-xl bg-white/70 border border-white/80 text-xs text-[#2C1A14] outline-none focus:border-[#789A99]"
                  />
                  <span className="text-xs text-[#A8928D]">—</span>
                  <input
                    type="time"
                    value={schedule[day].end_time}
                    onChange={e => setDayTime(day, 'end_time', e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-xl bg-white/70 border border-white/80 text-xs text-[#2C1A14] outline-none focus:border-[#789A99]"
                  />
                </div>
              ) : (
                <span className="text-xs text-[#A8928D]">Вихідний</span>
              )}
            </div>
          ))}
        </div>
        </Section>
      </div>

      {/* Перерви та буфер між клієнтами */}
      <Section title="Перерви та буфер">
        <div className="flex flex-col gap-4">

          {/* Buffer time */}
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-2">
              Час між клієнтами
              <span className="ml-1.5 font-normal text-[#A8928D]">— щоб підготуватися до наступного</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {[0, 5, 10, 15, 20, 30].map(min => (
                <button
                  key={min}
                  onClick={() => setBufferTime(min)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    bufferTime === min
                      ? 'bg-[#789A99] text-white'
                      : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
                  }`}
                >
                  {min === 0 ? 'Без буферу' : `${min} хв`}
                </button>
              ))}
            </div>
          </div>

          {/* Breaks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#6B5750]">
                Перерви
                <span className="ml-1.5 font-normal text-[#A8928D]">— обід, кава, особисті справи</span>
              </p>
              <button
                onClick={addBreak}
                className="flex items-center gap-1 text-xs font-medium text-[#789A99] px-2.5 py-1 rounded-xl bg-[#789A99]/10 hover:bg-[#789A99]/20 transition-colors"
              >
                <Plus size={11} /> Додати
              </button>
            </div>

            {breaks.length === 0 ? (
              <p className="text-xs text-[#A8928D] text-center py-3 rounded-2xl bg-white/40 border border-dashed border-[#E8D5CF]">
                Перерви не налаштовані
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {breaks.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/50">
                    <input
                      type="time"
                      value={b.start}
                      onChange={e => setBreakField(i, 'start', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-xl bg-white/70 border border-white/80 text-xs text-[#2C1A14] outline-none focus:border-[#789A99]"
                    />
                    <span className="text-xs text-[#A8928D]">—</span>
                    <input
                      type="time"
                      value={b.end}
                      onChange={e => setBreakField(i, 'end', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-xl bg-white/70 border border-white/80 text-xs text-[#2C1A14] outline-none focus:border-[#789A99]"
                    />
                    <button
                      onClick={() => removeBreak(i)}
                      className="w-7 h-7 rounded-xl bg-[#C05B5B]/10 flex items-center justify-center text-[#C05B5B] hover:bg-[#C05B5B]/20 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-[#A8928D] mt-2">
              Перерви застосовуються до всіх робочих днів
            </p>
          </div>
        </div>
      </Section>

      <div className={cn(
        'relative rounded-2xl transition-all duration-500',
        currentStep === 1 && 'tour-glow z-40 scale-[1.02]'
      )}>
        <AnchoredTooltip
          isOpen={currentStep === 1}
          onClose={closeTour}
          title="🌴 Відпустка"
          text="Плануєте відпочинок? Додайте відпустку сюди, і система заблокує ці дні для запису, щоб вас ніхто не турбував."
          position="bottom"
          primaryButtonText="Зрозуміло"
          onPrimaryClick={nextStep}
        />
        {/* Вихідні та відпустка */}
        <Section title="Вихідні та відпустка">
          <VacationManager />
        </Section>
      </div>

      {/* Навігація (мобільна) */}
      <div className="bento-card p-4 lg:hidden">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-2">Додатково</p>
        {[
          { href: '/dashboard/reviews', icon: MessageSquare, label: 'Відгуки клієнтів' },
          { href: '/dashboard/billing', icon: CreditCard,    label: 'Тариф та оплата'  },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-white/60 transition-colors"
          >
            <Icon size={16} className="text-[#789A99]" />
            <span className="text-sm text-[#2C1A14] flex-1">{label}</span>
            <ChevronRight size={14} className="text-[#A8928D]" />
          </Link>
        ))}
      </div>

      {/* Кнопка збереження */}
      <button
        data-testid="settings-save-profile-btn"
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          saved
            ? 'bg-[#5C9E7A] text-white'
            : 'bg-[#789A99] text-white hover:bg-[#6B8C8B] active:scale-[0.98]'
        }`}
      >
        {saving ? (
          <><Loader2 size={16} className="animate-spin" /> Збереження...</>
        ) : saved ? (
          <><Check size={16} /> Збережено</>
        ) : (
          'Зберегти зміни'
        )}
      </button>

      {/* Режим клієнта */}
      <button
        onClick={() => {
          document.cookie = 'view_mode=client; path=/; max-age=86400';
          window.location.href = '/my/bookings';
        }}
        className="w-full py-3.5 rounded-2xl text-sm font-medium text-[#789A99] bg-[#789A99]/8 hover:bg-[#789A99]/15 border border-[#789A99]/20 transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-base">👤</span>
        Перейти в режим клієнта
      </button>

      {/* Вийти з акаунту */}
      <button
        onClick={async () => {
          try {
            const supabase = createClient();
            await supabase.auth.signOut();
            queryClient.clear();
            // Clear role cookie so next login re-fetches fresh role from DB
            document.cookie = 'user_role=; path=/; max-age=0';
            window.location.href = '/login';
          } catch (error) {
            console.error('Logout error:', error);
          }
        }}
        className="w-full py-3.5 rounded-2xl text-sm font-medium text-[#C05B5B] bg-[#C05B5B]/8 hover:bg-[#C05B5B]/15 border border-[#C05B5B]/20 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={15} />
        Вийти з акаунту
      </button>

      {/* Floating save bar — appears when form has unsaved changes */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="fixed bottom-[84px] lg:bottom-6 left-1/2 -translate-x-1/2 z-50
                       w-[calc(100%-2rem)] max-w-md"
          >
            <div className="bento-card px-4 py-3 flex items-center gap-3
                            border-[#789A99]/25 bg-white/95 backdrop-blur-md shadow-xl">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#2C1A14]">Незбережені зміни</p>
              </div>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#6B5750]
                           bg-white/80 border border-white/80 hover:bg-white
                           disabled:opacity-50 transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleSave}
                disabled={saving || slugStatus === 'taken'}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white
                           bg-[#789A99] hover:bg-[#6B8C8B] disabled:opacity-50
                           transition-colors flex items-center gap-1.5"
              >
                {saving
                  ? <><Loader2 size={12} className="animate-spin" /> Збереження...</>
                  : 'Зберегти'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bento-card p-5">
      <p className="text-sm font-semibold text-[#2C1A14] mb-4">{title}</p>
      {children}
    </div>
  );
}
