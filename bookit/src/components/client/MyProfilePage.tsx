'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Loader2, CalendarDays, Mail, ArrowLeft, LogOut, Send, AlertTriangle, Palette, Sun, Moon, Sparkles } from 'lucide-react';
import { updateClientProfile, disconnectClientTelegram } from '@/app/my/profile/actions';
import { createClient } from '@/lib/supabase/client';
import { PushSubscribeCard } from '@/components/shared/PushSubscribeCard';
import { LegalFooterLinks } from '@/components/shared/LegalFooterLinks';
import { useToast } from '@/lib/toast/context';
import { e164ToInputPhone, formatPhoneDisplay, normalizePhoneInput, toFullPhone } from '@/lib/utils/phone';
import { parseError } from '@/lib/utils/errors';
import Cookies from 'js-cookie';

interface Props {
  profile: {
    fullName: string;
    phone: string;
    email: string;
    memberSince: string;
    telegramChatId: string | null;
    userId: string;
    lastMasterId: string | null;
    medicalNotes: string;
    healthNotes: string;
  };
}

const inputCls = 'w-full px-4 py-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder-muted-foreground outline-none focus:bg-secondary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all';

const THEMES = [
  { key: 'default', label: 'Blossom', color: '#DDD5C6', icon: Sun, iconColor: '#28201A' },
  { key: 'studio',  label: 'Studio',  color: '#0E1D21', icon: Moon, iconColor: '#D3A376' },
  { key: 'frost',   label: 'Frost',   color: '#EFF2FF', icon: Sparkles, iconColor: '#0F172A' },
];

export function MyProfilePage({ profile }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [themeKey, setThemeKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return Cookies.get('client_theme') || 'default';
    }
    return 'default';
  });

  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(() => e164ToInputPhone(profile.phone));
  const [medicalNotes, setMedicalNotes] = useState(profile.medicalNotes);
  const [healthNotes, setHealthNotes] = useState(profile.healthNotes);

  const handleThemeChange = (key: string) => {
    setThemeKey(key);
    if (key === 'default') {
      Cookies.remove('client_theme', { path: '/' });
      document.documentElement.removeAttribute('data-theme');
    } else {
      Cookies.set('client_theme', key, { expires: 365, path: '/' });
      document.documentElement.setAttribute('data-theme', key);
    }
    const colors = { studio: '#0E1D21', frost: '#EFF2FF', default: '#DDD5C6' };
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', colors[key as 'studio' | 'frost' | 'default'] || '#DDD5C6');
    }
    router.refresh();
  };

  const memberSinceFormatted = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  function handleSave() {
    startTransition(async () => {
      const { error } = await updateClientProfile(
        fullName,
        toFullPhone(phone),
        medicalNotes,
        healthNotes
      );
      if (error) {
        showToast({ type: 'error', title: 'Помилка збереження', message: parseError(error) });
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    });
  }

  async function handleDisconnectTelegram() {
    setDisconnecting(true);
    try {
      await disconnectClientTelegram();
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  }

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;

  return (
    <div className="flex flex-col gap-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/my/bookings"
          aria-label="Назад до записів"
          className="size-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary active:scale-[0.88] cursor-pointer transition-all flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="bento-card p-4 flex-1">
          <h1 className="heading-serif text-xl text-foreground leading-none">Мій профіль</h1>
        </div>
      </div>

      {/* Avatar + meta */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bento-card p-5 flex items-center gap-4"
      >
        <div className="size-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 bg-accent/15 text-accent font-bold">
          {fullName ? fullName.charAt(0).toUpperCase() : ''}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground truncate">
            {fullName || 'Ваше ім\'я'}
          </p>
          {!profile.email.endsWith('@bookit.app') && (
            <div className="flex items-center gap-1 mt-1">
              <Mail size={11} className="text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground/60 truncate">{profile.email}</span>
            </div>
          )}
          {memberSinceFormatted && (
            <div className="flex items-center gap-1 mt-0.5">
              <CalendarDays size={11} className="text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground/60">З {memberSinceFormatted}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Особисті дані */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bento-card p-5"
      >
        <p className="text-sm font-semibold text-foreground mb-4">Особисті дані</p>

        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="profile-fullname" className="text-xs font-medium text-muted-foreground mb-1.5 block">{"Ім'я та прізвище"}</label>
            <input
              id="profile-fullname"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ваше повне ім'я"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className="text-xs font-medium text-muted-foreground mb-1.5 block">Телефон</label>
            <div className="flex items-center gap-0 rounded-lg border border-border bg-secondary overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
              <span className="pl-4 pr-2 text-muted-foreground font-medium text-sm select-none shrink-0">+38</span>
              <input
                id="profile-phone"
                type="tel"
                inputMode="numeric"
                placeholder="0XX XXX XX XX"
                value={formatPhoneDisplay(phone)}
                onChange={e => setPhone(normalizePhoneInput(e.target.value))}
                className="flex-1 py-3 pr-4 text-foreground text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {!profile.email.endsWith('@bookit.app') && (
            <div>
              <label htmlFor="profile-email" className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <input
                id="profile-email"
                value={profile.email}
                disabled
                className={`${inputCls} opacity-50 cursor-not-allowed`}
              />
              <p className="text-[11px] text-muted-foreground/60 mt-1">Email змінити неможливо</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Block: Safety & Health */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bento-card p-5 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundColor: medicalNotes ? 'var(--destructive)' : 'transparent' }}
        />
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded-xl flex items-center justify-center ${medicalNotes ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
            <AlertTriangle size={16} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${medicalNotes ? 'text-destructive' : 'text-foreground'}`}>Safety & Health</p>
            <p className="text-[11px] text-muted-foreground/60">Важлива інформація для вашої безпеки</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="profile-medical" className="text-xs font-medium text-muted-foreground mb-1.5 block px-1">
              Алергії та критичні застереження
            </label>
            <textarea
              id="profile-medical"
              value={medicalNotes}
              onChange={e => setMedicalNotes(e.target.value)}
              placeholder="Наприклад: алергія на певні компоненти фарби, діабет..."
              rows={2}
              className={`w-full px-4 py-3 rounded-lg bg-secondary border text-sm text-foreground placeholder-muted-foreground outline-none transition-all resize-none ${
                medicalNotes ? 'border-destructive/30 focus:border-destructive focus:ring-2 focus:ring-destructive/10' : 'border-border focus:border-accent focus:ring-2 focus:ring-accent/20'
              }`}
            />
          </div>

          <div>
            <label htmlFor="profile-health" className="text-xs font-medium text-muted-foreground mb-1.5 block px-1">
              Загальні нотатки про стан здоров'я
            </label>
            <textarea
              id="profile-health"
              value={healthNotes}
              onChange={e => setHealthNotes(e.target.value)}
              placeholder="Чутливість, особливості постави тощо..."
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder-muted-foreground outline-none focus:bg-secondary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
            />
          </div>

          <p className="text-[11px] text-muted-foreground/50 italic px-1 leading-relaxed">
            Ці дані будуть доступні майстрам, до яких ви записуєтесь, щоб вони могли забезпечити найкращий та безпечний сервіс.
          </p>
        </div>
      </motion.div>

      {/* Оформлення (Вибір теми) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bento-card p-5"
      >
        <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Palette size={16} className="text-accent" /> Оформлення
        </p>
        <div className="flex gap-3">
          {THEMES.map((theme) => {
            const Icon = theme.icon;
            const isSelected = themeKey === theme.key;
            return (
              <button
                type="button"
                key={theme.key}
                onClick={() => handleThemeChange(theme.key)}
                className={`flex-1 p-3 rounded-xl border transition-all text-left group cursor-pointer active:scale-[0.95] ${
                  isSelected
                    ? 'bg-surface border-accent shadow-sm'
                    : 'bg-secondary/40 border-border grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:bg-secondary/60'
                }`}
              >
                <div
                  className="w-full h-12 rounded-xl mb-3 shadow-inner flex items-center justify-center"
                  style={{ backgroundColor: theme.color }}
                >
                  <span style={{ color: theme.iconColor }}><Icon size={18} /></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{theme.label}</span>
                  {isSelected && <Check size={14} className="text-accent" />}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Telegram */}
      {botName && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bento-card p-5"
        >
          <p className="text-sm font-semibold text-foreground mb-4">Сповіщення в Telegram</p>
          {profile.telegramChatId ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-success/10 border border-success/20">
              <span className="text-xs text-success font-medium flex-1">Підключено</span>
              <button
                type="button"
                onClick={handleDisconnectTelegram}
                disabled={disconnecting}
                className="text-[11px] text-destructive hover:underline disabled:opacity-50 active:scale-[0.88] cursor-pointer transition-all"
              >
                {disconnecting ? 'Відключення...' : 'Відключити'}
              </button>
            </div>
          ) : (
            <a
              href={`https://t.me/${botName}?start=${profile.userId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-accent text-accent-on text-sm font-semibold hover:opacity-90 active:scale-[0.95] cursor-pointer transition-all shadow-md"
            >
              <Send size={14} /> Підключити бота
            </a>
          )}
          <p className="text-[11px] text-muted-foreground/60 mt-2">
            Отримуйте сповіщення про ваші записи прямо в Telegram
          </p>
        </motion.div>
      )}

      {/* Push notifications */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <PushSubscribeCard userRole="client" />
      </motion.div>

      {/* Save */}
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={handleSave}
        disabled={isPending || !fullName.trim()}
        className={`w-full py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          saved
            ? 'bg-success text-white animate-none'
            : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.95] cursor-pointer shadow-sm'
        } disabled:opacity-60`}
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Збереження...</>
        ) : saved ? (
          <><Check size={16} /> Збережено</>
        ) : (
          'Зберегти зміни'
        )}
      </motion.button>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bento-card p-4"
      >
        <p className="text-xs font-semibold text-muted-foreground mb-2.5">Мої записи</p>
        <Link
          href="/my/bookings"
          className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-secondary active:scale-[0.95] cursor-pointer transition-all"
        >
          <span className="text-sm text-foreground">Переглянути всі записи</span>
          <span className="text-accent text-sm">→</span>
        </Link>
      </motion.div>

      {/* Legal links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bento-card p-4"
      >
        <p className="text-xs font-semibold text-muted-foreground/60 mb-2">Юридична інформація</p>
        <LegalFooterLinks variant="list" />
      </motion.div>

      {/* Вийти */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          document.cookie = 'user_role=; path=/; max-age=0';
          window.location.href = '/login';
        }}
        className="w-full py-3.5 rounded-lg text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/15 border border-destructive/20 active:scale-[0.95] cursor-pointer transition-all flex items-center justify-center gap-2"
      >
        <LogOut size={15} />
        Вийти з акаунту
      </motion.button>
    </div>
  );
}
