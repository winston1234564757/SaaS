'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Check, Loader2, Mail, CalendarDays,
  AlertTriangle, Link2, AtSign, ChevronDown,
  LogOut, Send,
} from 'lucide-react';
import { updateClientProfile, disconnectClientTelegram } from '@/app/my/profile/actions';
import { PushSubscribeCard } from '@/components/shared/PushSubscribeCard';
import { LegalFooterLinks } from '@/components/shared/LegalFooterLinks';
import { PhotoUploader } from '@/components/shared/PhotoUploader';
import { useToast } from '@/lib/toast/context';
import {
  e164ToInputPhone, formatPhoneDisplay, normalizePhoneInput, toFullPhone,
} from '@/lib/utils/phone';
import { parseError } from '@/lib/utils/errors';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import Cookies from 'js-cookie';

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

const THEMES = [
  { key: 'frost',   label: 'Frost',   color: '#EFF2FF', wip: false },
  { key: 'default', label: 'Blossom', color: '#DDD5C6', wip: true },
  { key: 'studio',  label: 'Studio',  color: '#0E1D21', wip: true },
];

interface Props {
  profile: {
    fullName: string;
    phone: string;
    email: string;
    memberSince: string;
    telegramChatId: string | null;
    userId: string;
    medicalNotes: string;
    healthNotes: string;
    avatarUrl: string | null;
    instagramUrl: string;
    telegramHandle: string;
  };
}

const inputCls = [
  'w-full px-4 py-3 rounded-2xl bg-secondary border border-border',
  'text-sm text-foreground placeholder:text-muted-foreground/50',
  'outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
  'transition-all min-h-[44px]',
].join(' ');

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-1 mb-3">
      {children}
    </p>
  );
}

export function MyProfilePage({ profile }: Props) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [healthExpanded, setHealthExpanded] = useState(
    !!(profile.medicalNotes || profile.healthNotes),
  );

  const [themeKey, setThemeKey] = useState<string>(() => {
    if (typeof window !== 'undefined') return Cookies.get('client_theme') || 'frost';
    return 'frost';
  });

  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(() => e164ToInputPhone(profile.phone));
  const [medicalNotes, setMedicalNotes] = useState(profile.medicalNotes);
  const [healthNotes, setHealthNotes] = useState(profile.healthNotes);
  const [instagramUrl, setInstagramUrl] = useState(profile.instagramUrl);
  const [telegramHandle, setTelegramHandle] = useState(profile.telegramHandle);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl);

  const memberSinceFormatted = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const handleThemeChange = (key: string) => {
    const theme = THEMES.find(t => t.key === key);
    if (theme?.wip) {
      showToast({ type: 'info', title: 'Скоро', message: 'Ця тема зараз у розробці' });
      return;
    }
    setThemeKey(key);
    Cookies.remove('client_theme', { path: '/' });
    if (key !== 'frost') Cookies.set('client_theme', key, { expires: 365, path: '/' });
    document.documentElement.setAttribute('data-theme', key === 'default' ? 'frost' : key);
    const colors: Record<string, string> = { studio: '#0E1D21', frost: '#EFF2FF', default: '#EFF2FF' };
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[key] ?? '#EFF2FF');
  };

  function handleSave() {
    startTransition(async () => {
      const { error } = await updateClientProfile(
        fullName,
        toFullPhone(phone),
        medicalNotes,
        healthNotes,
        avatarUrl ?? undefined,
        instagramUrl,
        telegramHandle,
      );
      if (error) {
        showToast({ type: 'error', title: 'Помилка збереження', message: parseError(error) });
        return;
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setIsDirty(false);
      }, 1800);
    });
  }

  async function handleDisconnectTelegram() {
    setDisconnecting(true);
    try {
      await disconnectClientTelegram();
    } finally {
      setDisconnecting(false);
    }
  }

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;

  return (
    <div className="flex flex-col gap-6 pt-4 pb-28">

      <div className="bg-surface rounded-3xl p-6 flex flex-col items-center gap-4">
        <PhotoUploader
          entity={{ type: 'client-avatar', userId: profile.userId }}
          value={avatarUrl}
          aspectRatio={1}
          onChange={url => {
            setAvatarUrl(url);
            setIsDirty(true);
          }}
        >
          {({ triggerUpload, uploading, preview }) => (
            <div className="relative">
              <button
                type="button"
                onClick={triggerUpload}
                aria-label="Змінити фото профілю"
                className="relative size-24 rounded-full overflow-hidden bg-accent/15 flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                {(preview ?? avatarUrl) ? (
                  <Image
                    src={preview ?? avatarUrl ?? ''}
                    alt=""
                    fill
                    className={cn('object-cover transition-opacity duration-200', uploading && 'opacity-40')}
                  />
                ) : (
                  <span className="heading-serif text-3xl font-bold text-accent">
                    {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                  </span>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={22} className="animate-spin text-accent" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={triggerUpload}
                aria-label="Завантажити фото"
                className="absolute -bottom-0.5 -right-0.5 size-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
              >
                <Camera size={14} />
              </button>
            </div>
          )}
        </PhotoUploader>

        <div className="text-center space-y-2">
          <h1 className="heading-serif text-2xl text-foreground leading-tight">
            {fullName || 'Мій профіль'}
          </h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {!profile.email.endsWith('@bookit.app') && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/60 bg-secondary/80 px-2.5 py-1 rounded-full">
                <Mail size={10} />
                {profile.email}
              </span>
            )}
            {memberSinceFormatted && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/60 bg-secondary/80 px-2.5 py-1 rounded-full">
                <CalendarDays size={10} />
                з {memberSinceFormatted}
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Про вас</SectionLabel>
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="profile-fullname" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {"Ім'я та прізвище"}
            </label>
            <input
              id="profile-fullname"
              value={fullName}
              onChange={e => { setFullName(e.target.value); setIsDirty(true); }}
              placeholder="Ім'я та прізвище"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Телефон
            </label>
            <div className="flex items-center rounded-2xl border border-border bg-secondary overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all min-h-[44px]">
              <span className="pl-4 pr-2 text-muted-foreground font-medium text-sm select-none shrink-0">+38</span>
              <input
                id="profile-phone"
                type="tel"
                inputMode="numeric"
                placeholder="0XX XXX XX XX"
                value={formatPhoneDisplay(phone)}
                onChange={e => { setPhone(normalizePhoneInput(e.target.value)); setIsDirty(true); }}
                className="flex-1 py-3 pr-4 text-foreground text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {!profile.email.endsWith('@bookit.app') && (
            <div>
              <label htmlFor="profile-email" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Email
              </label>
              <input
                id="profile-email"
                value={profile.email}
                disabled
                className={cn(inputCls, 'opacity-50 cursor-not-allowed')}
              />
              <p className="text-[11px] text-muted-foreground/50 mt-1.5 px-1">Email не можна змінити</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionLabel>Соцмережі</SectionLabel>
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="profile-instagram" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Instagram
            </label>
            <div className="flex items-center rounded-2xl border border-border bg-secondary overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all min-h-[44px]">
              <span className="pl-4 pr-2 flex-shrink-0">
                <Link2 size={15} className="text-muted-foreground/50" />
              </span>
              <input
                id="profile-instagram"
                value={instagramUrl}
                onChange={e => { setInstagramUrl(e.target.value); setIsDirty(true); }}
                placeholder="@нікнейм або посилання"
                className="flex-1 py-3 pr-4 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-tg-handle" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Telegram
            </label>
            <div className="flex items-center rounded-2xl border border-border bg-secondary overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all min-h-[44px]">
              <span className="pl-4 pr-2 flex-shrink-0">
                <AtSign size={15} className="text-muted-foreground/50" />
              </span>
              <input
                id="profile-tg-handle"
                value={telegramHandle}
                onChange={e => { setTelegramHandle(e.target.value); setIsDirty(true); }}
                placeholder="@нікнейм"
                className="flex-1 py-3 pr-4 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>{"Здоров'я та безпека"}</SectionLabel>
        <AnimatePresence mode="popLayout" initial={false}>
          {!healthExpanded ? (
            <motion.button
              key="health-add"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              onClick={() => setHealthExpanded(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-border text-sm text-muted-foreground hover:border-accent/50 hover:text-foreground transition-colors cursor-pointer min-h-[44px]"
            >
              <ChevronDown size={15} />
              Додати нотатки
            </motion.button>
          ) : (
            <motion.div
              key="health-content"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SPRING}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-warning/10 border border-warning/20">
                <AlertTriangle size={16} className="text-warning flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground leading-none mb-0.5">{"Здоров'я та безпека"}</p>
                  <p className="text-[11px] text-muted-foreground/70">Для безпечного візиту</p>
                </div>
              </div>

              <div>
                <label htmlFor="profile-medical" className="text-xs font-medium text-muted-foreground mb-1.5 block px-1">
                  Алергії та протипоказання
                </label>
                <textarea
                  id="profile-medical"
                  value={medicalNotes}
                  onChange={e => { setMedicalNotes(e.target.value); setIsDirty(true); }}
                  placeholder="Наприклад, алергія на фарбу або діабет"
                  rows={2}
                  className={cn(
                    'w-full px-4 py-3 rounded-2xl bg-secondary border text-sm text-foreground',
                    'placeholder:text-muted-foreground/50 outline-none transition-all resize-none',
                    medicalNotes
                      ? 'border-destructive/30 focus:border-destructive focus:ring-2 focus:ring-destructive/10'
                      : 'border-border focus:border-accent focus:ring-2 focus:ring-accent/20',
                  )}
                />
              </div>

              <div>
                <label htmlFor="profile-health" className="text-xs font-medium text-muted-foreground mb-1.5 block px-1">
                  Загальні нотатки
                </label>
                <textarea
                  id="profile-health"
                  value={healthNotes}
                  onChange={e => { setHealthNotes(e.target.value); setIsDirty(true); }}
                  placeholder="Чутлива шкіра, хронічні проблеми..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                />
              </div>

              <p className="text-[11px] text-muted-foreground/60 px-1">
                Майстер побачить це перед вашим записом
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <SectionLabel>Вигляд</SectionLabel>
        <div className="flex gap-2">
          {THEMES.map(theme => {
            const isSelected = themeKey === theme.key;
            return (
              <button
                key={theme.key}
                type="button"
                onClick={() => handleThemeChange(theme.key)}
                className={cn(
                  'flex-1 p-3 rounded-2xl border transition-all text-left',
                  theme.wip
                    ? 'opacity-35 cursor-not-allowed border-border bg-secondary/40'
                    : isSelected
                      ? 'border-accent bg-surface shadow-sm cursor-pointer active:scale-[0.97]'
                      : 'border-border bg-secondary/40 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 cursor-pointer active:scale-[0.97]',
                )}
              >
                <div className="w-full h-10 rounded-xl mb-2.5" style={{ backgroundColor: theme.color }} />
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-foreground leading-none">{theme.label}</span>
                  {theme.wip ? (
                    <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full leading-none">
                      Скоро
                    </span>
                  ) : isSelected ? (
                    <Check size={12} className="text-accent flex-shrink-0" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>Сповіщення</SectionLabel>
        <div className="flex flex-col gap-3">
          {botName && (
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <p className="text-sm font-semibold text-foreground mb-3">Сповіщення в Telegram</p>
              {profile.telegramChatId ? (
                <div className="flex items-center gap-3">
                  <span className="flex-1 inline-flex items-center gap-1.5 text-xs text-success font-medium bg-success/10 border border-success/20 px-3 py-2 rounded-full">
                    <span className="size-1.5 rounded-full bg-success inline-block" />
                    Підключено
                  </span>
                  <button
                    type="button"
                    onClick={handleDisconnectTelegram}
                    disabled={disconnecting}
                    className="text-xs text-destructive hover:underline disabled:opacity-50 transition-opacity min-h-[44px] px-2 cursor-pointer"
                  >
                    {disconnecting ? 'Відключення...' : 'Відключити'}
                  </button>
                </div>
              ) : (
                <a
                  href={`https://t.me/${botName}?start=${profile.userId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-full bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all"
                >
                  <Send size={14} />
                  Підключити Telegram
                </a>
              )}
              <p className="text-[11px] text-muted-foreground/60 mt-2.5">
                Сповіщення про записи приходять у Telegram
              </p>
            </div>
          )}
          <PushSubscribeCard userRole="client" />
        </div>
      </div>

      <div>
        <SectionLabel>Акаунт</SectionLabel>
        <div className="flex flex-col gap-2">
          <div className="rounded-2xl border border-border bg-secondary/20 p-4">
            <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">
              Юридична інформація
            </p>
            <LegalFooterLinks variant="list" />
          </div>

          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              document.cookie = 'user_role=; path=/; max-age=0';
              window.location.href = '/login';
            }}
            className="w-full h-12 rounded-full text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/15 border border-destructive/20 active:scale-[0.97] cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={15} />
            Вийти з акаунту
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={SPRING}
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4rem)] left-0 right-0 z-50 px-4"
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !fullName.trim()}
              className={cn(
                'w-full h-14 rounded-full font-semibold text-sm flex items-center justify-center gap-2',
                'shadow-lg transition-all active:scale-[0.97] cursor-pointer',
                saved
                  ? 'bg-success text-white'
                  : 'bg-accent text-accent-foreground hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
              ) : saved ? (
                <><Check size={16} /> Збережено</>
              ) : (
                'Зберегти зміни'
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
