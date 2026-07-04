'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, MessageSquare } from 'lucide-react';
import { confirmPhone } from '@/app/my/setup/phone/actions';
import { formatPhoneDisplay, normalizePhoneInput, toFullPhone } from '@/lib/utils/phone';
import { Button } from '@/components/ui/Button';

type Step = 'phone' | 'otp';

export function PhoneSetupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');        // 9 digits without leading 0
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false); // for SMS send only
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  function getCleanPhone() { return toFullPhone(phone); }
  function handlePhoneChange(val: string) { setPhone(normalizePhoneInput(val)); setError(''); }

  // ── Step 1: Send SMS ─────────────────────────────────────────────────────
  async function handleSendSms() {
    if (isSubmitting) return;
    if (phone.length < 9) { setError('Введіть повний номер телефону'); return; }
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

  // ── Step 2: Verify OTP via server action ─────────────────────────────────
  async function handleVerify(otpOverride?: string) {
    if (isSubmitting) return;
    const otp = otpOverride ?? digits.join('');
    if (otp.length < 6) { setError('Введіть 6-значний код'); return; }
    setError('');
    startTransition(async () => {
      const result = await confirmPhone(getCleanPhone(), otp);
      if ('error' in result) {
        setError(result.error);
        setDigits(['', '', '', '', '', '']);
        digitRefs.current[0]?.focus();
        return;
      }
      // Success — DB updated, revalidation triggered on server
      router.refresh();
      setTimeout(() => {
        router.push('/my/bookings');
      }, 100);
    });
  }

  // ── OTP digit handlers ────────────────────────────────────────────────────
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

  const isSubmitting = loading || isPending;

  return (
    <AnimatePresence mode="popLayout">

      {step === 'phone' && (
        <motion.div
          key="phone"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="flex flex-col gap-4"
        >
          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/12 ring-1 ring-primary/15 mb-4">
              <Phone size={24} className="text-primary" />
            </div>
            <h1 className="heading-serif text-2xl text-foreground mb-1.5">
              Підтвердіть номер
            </h1>
            <p className="text-sm text-text-sub leading-relaxed">
              Номер телефону — обов&apos;язкова умова.<br />
              Він потрібен для доступу до ваших записів.
            </p>
          </div>

          <div className="flex items-center rounded-xl border border-border bg-secondary overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <span className="pl-4 pr-2 text-text-sub font-medium text-base select-none shrink-0">+38</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="0XX XXX XX XX"
              value={formatPhoneDisplay(phone)}
              onChange={e => handlePhoneChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendSms()}
              autoFocus
              autoComplete="tel-national"
              aria-label="Номер телефону"
              className="flex-1 py-4 pr-4 text-foreground text-base bg-transparent outline-none placeholder:text-text-sub"
            />
          </div>

          {error && <p className="text-sm text-destructive pl-1">{error}</p>}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            onClick={handleSendSms}
            disabled={phone.length < 9}
          >
            {isSubmitting ? 'Відправляємо...' : 'Отримати код'}
          </Button>
        </motion.div>
      )}

      {step === 'otp' && (
        <motion.div
          key="otp"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4"
        >
          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/12 ring-1 ring-primary/15 mb-4">
              <MessageSquare size={24} className="text-primary" />
            </div>
            <h1 className="heading-serif text-2xl text-foreground mb-1.5">
              Введіть код
            </h1>
            <p className="text-sm text-text-sub">
              Код надіслано на +38 {formatPhoneDisplay(phone)}
            </p>
          </div>

          <div className="flex justify-center gap-2.5">
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
                onPaste={handlePaste}
                autoFocus={i === 0}
                aria-label={`Цифра ${i + 1} коду`}
                className="w-11 h-14 text-center metric-value text-xl text-foreground rounded-xl border-2 border-border bg-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            ))}
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isPending}
            onClick={() => handleVerify()}
            disabled={digits.some(d => !d)}
          >
            {isPending ? 'Перевіряємо...' : 'Підтвердити'}
          </Button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setStep('phone'); setDigits(['', '', '', '', '', '']); setError(''); }}
              className="flex items-center gap-1.5 text-sm text-text-sub hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} /> Змінити номер
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm text-primary font-medium disabled:text-text-sub disabled:cursor-default hover:underline cursor-pointer"
            >
              {resendCooldown > 0 ? `Через ${resendCooldown}с` : 'Надіслати знову'}
            </button>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
