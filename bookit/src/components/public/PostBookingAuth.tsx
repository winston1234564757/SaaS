'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { formatPhoneDisplay, normalizePhoneInput, toFullPhone } from '@/lib/utils/phone';

interface Props {
  bookingId: string;
  /** Телефон клієнта у форматі 380XXXXXXXXX, вже введений під час бронювання */
  clientPhone?: string;
  onSkip: () => void;
}

type Step = 'choose' | 'phone' | 'otp';

export function PostBookingAuth({ bookingId, clientPhone, onSkip }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('choose');
  // phone зберігається як 9 цифр без ведучого 0 (напр. 967953488)
  const [phone, setPhone] = useState<string>(() => {
    if (!clientPhone) return '';
    // clientPhone = '380XXXXXXXXX' → відкидаємо '380' → '0XXXXXXXXX' → відкидаємо '0' → 9 цифр
    const stripped = clientPhone.replace(/\D/g, '');
    return stripped.startsWith('380') ? stripped.slice(3) : stripped.startsWith('0') ? stripped.slice(1) : stripped;
  });
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  function getCleanPhone() {
    return toFullPhone(phone);
  }

  function handlePhoneChange(val: string) {
    setPhone(normalizePhoneInput(val));
    setError('');
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────
  function handleGoogle() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/my/bookings&bid=${bookingId}`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
  }

  // ── SMS: крок 1 ──────────────────────────────────────────────────────────
  async function handleSendSms() {
    if (phone.length < 9) { setError('Введіть повний номер'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: getCleanPhone() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Помилка відправки SMS'); return; }
    setStep('otp');
    startCooldown();
  }

  // ── SMS: крок 2 ──────────────────────────────────────────────────────────
  // otpOverride — передається з auto-submit щоб уникнути stale state (як у PhoneOtpForm)
  async function handleVerify(otpOverride?: string) {
    const otp = otpOverride ?? digits.join('');
    if (otp.length < 6) { setError('Введіть 6-значний код'); return; }
    setLoading(true);
    setError('');

    const verifyRes = await fetch('/api/auth/verify-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: getCleanPhone(), otp }),
    });
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      setLoading(false);
      setError(verifyData.error || 'Невірний код');
      setDigits(['', '', '', '', '', '']);
      digitRefs.current[0]?.focus();
      return;
    }

    const { error: authError } = await supabase.auth.verifyOtp({
      email: verifyData.email,
      token: verifyData.token,
      type: 'email',
    });

    if (authError) {
      setLoading(false);
      setError('Помилка авторизації. Спробуйте знову.');
      return;
    }

    router.push('/my/bookings');
    router.refresh();
  }

  // ── OTP box handlers ─────────────────────────────────────────────────────
  function handleDigitChange(i: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    setError('');
    if (char && i < 5) digitRefs.current[i + 1]?.focus();
    if (next.every(d => d !== '') && char) setTimeout(() => handleVerify(next.join('')), 80);
  }

  function handleDigitKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) digitRefs.current[i - 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((c, i) => { if (i < 6) next[i] = c; });
    setDigits(next);
    digitRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) setTimeout(() => handleVerify(pasted), 80);
  }

  function startCooldown() {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(p => {
        if (p <= 1) { clearInterval(cooldownRef.current!); cooldownRef.current = null; return 0; }
        return p - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setDigits(['', '', '', '', '', '']);
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: getCleanPhone() }),
    });
    setLoading(false);
    if (res.ok) startCooldown();
    else { const d = await res.json(); setError(d.error || 'Помилка'); }
  }

  return (
    <div className="w-full">

      <AnimatePresence mode="wait">

        {/* ── Міні-лендінг + вибір методу ────────────────────────────────── */}
        {step === 'choose' && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col"
          >
            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 bg-[#789A99]/12 rounded-full px-3 py-1 mb-3">
                <span className="text-[10px] font-semibold text-[#789A99] uppercase tracking-widest">
                  Твій beauty-кабінет
                </span>
              </div>
              <h2 className="heading-serif text-xl text-[#2C1A14] leading-snug mb-1">
                Збережи запис —<br />керуй красою легко
              </h2>
              <p className="text-xs text-[#A8928D] leading-relaxed">
                Безкоштовно. Без спаму. Тільки твої записи.
              </p>
            </div>

            {/* ── Bento переваг ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                {
                  icon: '📋',
                  title: 'Всі записи',
                  desc: 'Історія та майбутні візити в одному місці',
                },
                {
                  icon: '✕',
                  title: 'Скасування',
                  desc: 'Скасуй або перенеси в один клік',
                },
                {
                  icon: '⭐',
                  title: 'Відгуки',
                  desc: 'Оцінюй майстрів після кожного візиту',
                },
                {
                  icon: '🔔',
                  title: 'Сповіщення',
                  desc: 'Push про підтвердження та нагадування',
                },
              ].map(({ icon, title, desc }) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-2xl p-3 flex flex-col gap-1"
                  style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 12px rgba(44,26,20,0.06)' }}
                >
                  <span className="text-xl leading-none mb-0.5">{icon}</span>
                  <span className="text-xs font-semibold text-[#2C1A14]">{title}</span>
                  <span className="text-[11px] text-[#A8928D] leading-tight">{desc}</span>
                </motion.div>
              ))}
            </div>

            {/* ── Лояльність ────────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden mb-5"
              style={{ background: 'linear-gradient(135deg, #789A99 0%, #5a7f7e 100%)', boxShadow: '0 4px 20px rgba(120,154,153,0.35)' }}
            >
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-semibold text-white/60 uppercase tracking-widest mb-0.5">
                      Програма лояльності
                    </p>
                    <p className="heading-serif text-base text-white leading-tight">
                      Краса, що винагороджує
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <span className="text-xl">💎</span>
                  </div>
                </div>

                {/* Прогрес до першої нагороди */}
                <div className="bg-white/10 rounded-xl p-3 mb-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] text-white/80 font-medium">До першої знижки</span>
                    <span className="text-[11px] text-white font-bold">1 / 5 візитів</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: '20%' }} />
                  </div>
                  <p className="text-[10px] text-white/60 mt-1.5">Ще 4 візити — і отримаєш знижку 10%</p>
                </div>

                {/* Мілстоуни */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { visits: 5, reward: '−10%' },
                    { visits: 10, reward: '−15%' },
                    { visits: 20, reward: 'VIP' },
                  ].map(({ visits, reward }) => (
                    <div
                      key={visits}
                      className="rounded-xl bg-white/10 px-2 py-2 text-center"
                    >
                      <p className="text-[10px] text-white/50 mb-0.5">{visits} візитів</p>
                      <p className="text-xs font-bold text-white">{reward}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 bg-black/10 flex items-center gap-1.5">
                <span className="text-[10px] text-white/60">🎁</span>
                <p className="text-[10px] text-white/70 leading-tight">
                  Бонуси нараховуються автоматично після кожного підтвердженого візиту
                </p>
              </div>
            </motion.div>

            {/* ── CTA ───────────────────────────────────────────────────────── */}
            <button
              type="button"
              onClick={handleGoogle}
              className="flex items-center justify-center gap-2.5 w-full py-4 px-4 rounded-2xl bg-white text-[#2C1A14] text-sm font-semibold border border-[#E8D0C8] hover:border-[#D4B8AE] hover:shadow-lg active:scale-[0.98] transition-all shadow-md shadow-black/6 mb-3"
            >
              <GoogleIcon />
              Продовжити з Google
            </button>

            <div className="relative flex items-center gap-3 mb-3">
              <span className="flex-1 border-t border-[#EFE4DF]" />
              <span className="text-[10px] text-[#A8928D] uppercase tracking-widest font-medium">або</span>
              <span className="flex-1 border-t border-[#EFE4DF]" />
            </div>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#6a8988] active:scale-[0.98] transition-all shadow-lg shadow-[#789A99]/25 mb-3"
            >
              📱 Підтвердити номер телефону
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-[#A8928D] text-center py-1 hover:text-[#6B5750] transition-colors"
            >
              Пропустити, без акаунту →
            </button>
          </motion.div>
        )}

        {/* ── Введення телефону ───────────────────────────────────────────── */}
        {step === 'phone' && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-0 rounded-2xl border border-[#E8D0C8] bg-white overflow-hidden focus-within:border-[#789A99] focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
              <span className="pl-3.5 pr-2 text-[#6B5750] text-sm font-medium shrink-0">+38</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="0XX XXX XX XX"
                value={formatPhoneDisplay(phone)}
                onChange={e => handlePhoneChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendSms()}
                autoFocus
                className="flex-1 py-3.5 pr-3.5 text-[#2C1A14] text-sm bg-transparent outline-none placeholder:text-[#C4A89E]"
              />
            </div>

            {error && <p className="text-xs text-[#C05B5B] pl-1">{error}</p>}

            <button
              type="button"
              onClick={handleSendSms}
              disabled={loading || phone.length < 9}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#6a8988] active:scale-[0.98] transition-all shadow-md shadow-[#789A99]/20 disabled:opacity-50"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Відправляємо...' : 'Отримати код'}
            </button>

            <button type="button" onClick={() => { setStep('choose'); setError(''); }} className="flex items-center justify-center gap-1 text-xs text-[#A8928D] hover:text-[#6B5750] transition-colors">
              <ArrowLeft size={13} /> Назад
            </button>
          </motion.div>
        )}

        {/* ── Введення OTP ────────────────────────────────────────────────── */}
        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="flex flex-col gap-3"
          >
            <p className="text-xs text-[#6B5750] text-center">
              Код надіслано на +38 {formatPhoneDisplay(phone)}
            </p>

            <div className="flex justify-center gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { digitRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  autoFocus={i === 0}
                  className="w-10 h-12 text-center text-lg font-bold text-[#2C1A14] rounded-xl border-2 border-[#E8D0C8] bg-white outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
                />
              ))}
            </div>

            {error && <p className="text-xs text-[#C05B5B] text-center">{error}</p>}

            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={loading || digits.some(d => !d)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#6a8988] active:scale-[0.98] transition-all shadow-md shadow-[#789A99]/20 disabled:opacity-50"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Перевіряємо...' : 'Підтвердити'}
            </button>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => { setStep('phone'); setDigits(['', '', '', '', '', '']); setError(''); }} className="flex items-center gap-1 text-xs text-[#A8928D] hover:text-[#6B5750] transition-colors">
                <ArrowLeft size={13} /> Змінити номер
              </button>
              <button type="button" onClick={handleResend} disabled={resendCooldown > 0} className="text-xs text-[#789A99] disabled:text-[#A8928D] disabled:cursor-default hover:underline">
                {resendCooldown > 0 ? `Через ${resendCooldown}с` : 'Надіслати знову'}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
