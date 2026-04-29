'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Loader2, CalendarDays, Mail, ArrowLeft, LogOut, Send } from 'lucide-react';
import { updateClientProfile, disconnectClientTelegram } from '@/app/my/profile/actions';
import { createClient } from '@/lib/supabase/client';
import { PushSubscribeCard } from '@/components/shared/PushSubscribeCard';
import { LegalFooterLinks } from '@/components/shared/LegalFooterLinks';
import { useToast } from '@/lib/toast/context';
import { e164ToInputPhone, formatPhoneDisplay, normalizePhoneInput, toFullPhone } from '@/lib/utils/phone';
import { parseError } from '@/lib/utils/errors';

interface Props {
  profile: {
    fullName: string;
    phone: string;
    email: string;
    memberSince: string;
    telegramChatId: string | null;
    userId: string;
    lastMasterId: string | null;
  };
}

const inputCls = 'w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-foreground placeholder-[#A8928D] outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-[#789A99]/20 transition-all';

export function MyProfilePage({ profile }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [fullName, setFullName] = useState(profile.fullName);
  // Зберігаємо як 9 цифр (без коду країни і ведучого 0) для input з +38 prefix
  const [phone, setPhone] = useState(() => e164ToInputPhone(profile.phone));

  const memberSinceFormatted = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  function handleSave() {
    startTransition(async () => {
      // toFullPhone конвертує 9 цифр → 380XXXXXXXXX (action додатково нормалізує)
      const { error } = await updateClientProfile(fullName, toFullPhone(phone));
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
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/my/bookings"
          className="w-9 h-9 rounded-2xl bg-white/70 border border-white/80 flex items-center justify-center text-muted-foreground hover:bg-white transition-colors flex-shrink-0"
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
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="bento-card p-5 flex items-center gap-4"
      >
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: 'rgba(255, 210, 194, 0.55)' }}
        >
          {fullName ? fullName.charAt(0).toUpperCase() : '👤'}
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
        transition={{ delay: 0.08, type: 'spring', stiffness: 300, damping: 24 }}
        className="bento-card p-5"
      >
        <p className="text-sm font-semibold text-foreground mb-4">Особисті дані</p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{"Ім'я та прізвище"}</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ваше повне ім'я"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Телефон</label>
            <div className="flex items-center gap-0 rounded-2xl border border-white/80 bg-white/70 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
              <span className="pl-4 pr-2 text-muted-foreground font-medium text-sm select-none shrink-0">+38</span>
              <input
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
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <input
                value={profile.email}
                disabled
                className={`${inputCls} opacity-50 cursor-not-allowed`}
              />
              <p className="text-[11px] text-muted-foreground/60 mt-1">Email змінити неможливо</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Telegram */}
      {botName && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 24 }}
          className="bento-card p-5"
        >
          <p className="text-sm font-semibold text-foreground mb-4">Сповіщення в Telegram</p>
          {profile.telegramChatId ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-success/8 border border-success/20">
              <span className="text-xs text-success font-medium flex-1">Підключено</span>
              <button
                onClick={handleDisconnectTelegram}
                disabled={disconnecting}
                className="text-[11px] text-destructive hover:underline disabled:opacity-50 active:scale-95 transition-all"
              >
                {disconnecting ? 'Відключення...' : 'Відключити'}
              </button>
            </div>
          ) : (
            <a
              href={`https://t.me/${botName}?start=${profile.userId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-[#229ED9] text-white text-sm font-semibold hover:bg-[#1a85c4] transition-colors"
            >
              <Send size={14} /> Підключити бота
            </a>
          )}
          <p className="text-[11px] text-muted-foreground/60 mt-2">
            Отримуйте сповіщення про ваші записи прямо в Telegram
          </p>
        </motion.div>
      )}

      {/* C2C referral now lives in /my/loyalty — see "Для подруг" tab */}

      {/* Push notifications */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <PushSubscribeCard role="client" />
      </motion.div>

      {/* Save */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, type: 'spring', stiffness: 300, damping: 24 }}
        onClick={handleSave}
        disabled={isPending || !fullName.trim()}
        className={`w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          saved
            ? 'bg-success text-white'
            : 'bg-primary text-white hover:bg-[#6B8C8B] active:scale-[0.98]'
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
        transition={{ delay: 0.2 }}
        className="bento-card p-4"
      >
        <p className="text-xs font-semibold text-muted-foreground mb-2.5">Мої записи</p>
        <Link
          href="/my/bookings"
          className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/60 transition-colors"
        >
          <span className="text-sm text-foreground">Переглянути всі записи</span>
          <span className="text-primary text-sm">→</span>
        </Link>
      </motion.div>

      {/* Legal links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bento-card p-4"
      >
        <p className="text-xs font-semibold text-muted-foreground/60 mb-2">Юридична інформація</p>
        <LegalFooterLinks variant="list" />
      </motion.div>

      {/* Вийти */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        onClick={async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          document.cookie = 'user_role=; path=/; max-age=0';
          window.location.href = '/login';
        }}
        className="w-full py-3.5 rounded-2xl text-sm font-medium text-destructive bg-destructive/8 hover:bg-destructive/15 border border-destructive/20 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={15} />
        Вийти з акаунту
      </motion.button>
    </div>
  );
}
