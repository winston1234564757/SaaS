'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Bell, Zap, Gift, Mail, Lock, User, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { linkBookingToClient } from '@/app/[slug]/actions';

interface Props {
  bookingId: string;
  onSkip: () => void;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const BENEFITS = [
  { icon: CalendarDays, text: 'Всі записи в одному місці' },
  { icon: Bell,         text: 'Нагадування за день до візиту' },
  { icon: Zap,          text: 'Повторний запис в 1 дотик' },
  { icon: Gift,         text: 'Бонуси та програми лояльності' },
];

const inputCls = 'w-full h-12 px-4 rounded-xl bg-white/75 border border-white/80 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-[#789A99]/20 transition-all';

type Mode = 'main' | 'email';

export function ClientAuthSheet({ bookingId, onSkip }: Props) {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>('main');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=client&bookingId=${bookingId}`,
      },
    });
    // browser navigates away
  }

  async function handleEmailSignup() {
    if (!name.trim() || !email.trim() || password.length < 6) return;
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { role: 'client', full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?role=client&bookingId=${bookingId}`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      // Email confirmation disabled — link booking via server action (service role)
      await linkBookingToClient(bookingId).catch(() => {});
      window.location.href = '/my/bookings';
      return;
    }

    // Email confirmation required
    setEmailSent(true);
    setLoading(false);
  }

  // ── Email sent screen ──────────────────────────────────────────────────────
  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 text-center py-4"
      >
        <div className="text-5xl">📬</div>
        <div>
          <p className="text-base font-semibold text-foreground">Перевір пошту</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xs">
            Надіслали листа на <strong>{email}</strong>.{' '}
            Натисни посилання — і всі записи з'являться у твоєму акаунті.
          </p>
        </div>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground/60 underline underline-offset-4 mt-1 active:scale-95 transition-all"
        >
          Зрозуміло, закрити
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">

      {/* ── Main view: benefits + google + email option ── */}
      {mode === 'main' && (
        <motion.div
          key="main"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-5"
        >
          {/* Header */}
          <div className="text-center">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-base font-bold text-foreground">Збережи запис у свій акаунт</p>
            <p className="text-sm text-muted-foreground mt-1">
              Реєстрація займе 10 секунд — і всі бонуси твої
            </p>
          </div>

          {/* Benefits */}
          <div className="flex flex-col gap-2">
            {BENEFITS.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/50 border border-white/70"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/12 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <span className="text-sm text-foreground font-medium">{text}</span>
              </motion.div>
            ))}
          </div>

          {/* Google CTA */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-white/80 bg-white/80 hover:bg-white backdrop-blur-sm transition-colors text-sm font-semibold text-foreground disabled:opacity-50 active:scale-95 transition-all"
          >
            <GoogleIcon />
            Продовжити з Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-secondary/80" />
            <span className="text-xs text-muted-foreground/60">або</span>
            <div className="flex-1 h-px bg-secondary/80" />
          </div>

          {/* Email option */}
          <button
            onClick={() => setMode('email')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-primary hover:bg-[#6B8C8B] text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Mail size={15} />
            Зареєструватись з Email
          </button>

          {/* Skip */}
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground/60 text-center py-1 hover:text-muted-foreground transition-colors active:scale-95 transition-all"
          >
            Пізніше
          </button>
        </motion.div>
      )}

      {/* ── Email form view ── */}
      {mode === 'email' && (
        <motion.div
          key="email"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-4"
        >
          {/* Back */}
          <button
            onClick={() => { setMode('main'); setError(''); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground w-fit"
          >
            <ChevronLeft size={15} />
            Назад
          </button>

          <div>
            <p className="text-base font-bold text-foreground">Реєстрація</p>
            <p className="text-sm text-muted-foreground/60 mt-0.5">Безкоштовно, без зайвого</p>
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Твоє ім'я"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`${inputCls} pl-10`}
              />
            </div>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`${inputCls} pl-10`}
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="password"
                placeholder="Пароль (мін. 6 символів)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive px-1">{error}</p>
          )}

          <button
            onClick={handleEmailSignup}
            disabled={loading || !name.trim() || !email.trim() || password.length < 6}
            className="w-full h-12 rounded-xl bg-primary hover:bg-[#6B8C8B] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Зареєструватись <span className="opacity-70">→</span></>
            )}
          </button>

          <button onClick={onSkip} className="text-sm text-muted-foreground/60 text-center active:scale-95 transition-all">
            Пізніше
          </button>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
