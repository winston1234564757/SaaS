import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, ClipboardList, X, Star, Bell,
  Sparkles, Gift, Handshake, CalendarDays, Rocket,
  Send, CheckCircle2, Phone, MessageSquare
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { formatPhoneDisplay, normalizePhoneInput, toFullPhone } from '@/lib/utils/phone';

interface MasterLoyaltyProgram {
  id: string;
  name: string;
  targetVisits: number;
  rewardValue: number;
}

interface Props {
  bookingId: string;
  /** Телефон клієнта у форматі 380XXXXXXXXX, вже введений під час бронювання */
  clientPhone?: string;
  onSkip: () => void;
  masterId?: string;
  masterC2cEnabled?: boolean;
  masterC2cDiscountPct?: number | null;
}

type Step = 'choose' | 'phone' | 'otp' | 'channels';

export function PostBookingAuth({ bookingId, clientPhone, onSkip, masterId, masterC2cEnabled, masterC2cDiscountPct }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('choose');
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<MasterLoyaltyProgram[]>([]);
  const [loyaltyLoaded, setLoyaltyLoaded] = useState(false);
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
  const [userId, setUserId] = useState<string | null>(null);
  const [pushState, setPushState] = useState<'idle' | 'loading' | 'done' | 'unsupported'>('idle');
  const [tgOpened, setTgOpened] = useState(false);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  useEffect(() => {
    if (!masterId) { setLoyaltyLoaded(true); return; }
    supabase
      .from('loyalty_programs')
      .select('id, name, target_visits, reward_value')
      .eq('master_id', masterId)
      .eq('is_active', true)
      .order('target_visits', { ascending: true })
      .limit(3)
      .then(({ data }: { data: { id: string; name: string; target_visits: number; reward_value: number }[] | null }) => {
        if (data) setLoyaltyPrograms(data.map(p => ({
          id: p.id,
          name: p.name,
          targetVisits: p.target_visits,
          rewardValue: Number(p.reward_value),
        })));
        setLoyaltyLoaded(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterId]);

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

    if (!verifyData.isExistingSession) {
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
    }

    // Fetch user ID for TG deep-link and go to channels step
    const { data: { user: u } } = await supabase.auth.getUser();
    setUserId(u?.id ?? null);
    setLoading(false);
    setStep('channels');
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  async function handleSubscribePush() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushState('unsupported');
      return;
    }
    setPushState('loading');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setPushState('idle'); return; }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) { setPushState('done'); return; }
      const pad = '='.repeat((4 - key.length % 4) % 4);
      const b64 = (key + pad).replace(/-/g, '+').replace(/_/g, '/');
      const raw = atob(b64);
      const buf = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: buf });
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      setPushState('done');
    } catch {
      setPushState('idle');
    }
  }

  const botName = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '').replace('@', '').trim();

  return (
    <div className="w-full">

      <AnimatePresence mode="popLayout">

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
              <div className="inline-flex items-center gap-1.5 bg-primary/12 rounded-full px-3 py-1 mb-3">
                <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">
                  Твій beauty-кабінет
                </span>
              </div>
              <h2 className="heading-serif text-xl text-foreground leading-snug mb-1">
                Збережи запис —<br />керуй красою легко
              </h2>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Безкоштовно. Без спаму. Тільки твої записи.
              </p>
            </div>

            {/* ── Bento переваг ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                {
                  icon: ClipboardList,
                  title: 'Всі записи',
                  desc: 'Історія та майбутні візити в одному місці',
                },
                {
                  icon: X,
                  title: 'Скасування',
                  desc: 'Скасуй або перенеси в один клік',
                },
                {
                  icon: Star,
                  title: 'Відгуки',
                  desc: 'Оцінюй майстрів після кожного візиту',
                },
                {
                  icon: Bell,
                  title: 'Сповіщення',
                  desc: 'Push про підтвердження та нагадування',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-xl p-3 flex flex-col gap-1.5"
                  style={{ background: 'var(--surface)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', boxShadow: '0 2px 12px var(--border)' }}
                >
                  <span className="text-primary">
                    <Icon size={18} />
                  </span>
                  <span className="text-xs font-semibold text-foreground">{title}</span>
                  <span className="text-[11px] text-muted-foreground/60 leading-tight">{desc}</span>
                </motion.div>
              ))}
            </div>

            {/* ── Лояльність / C2C / Fallback ───────────────────────────────── */}
            {loyaltyLoaded && (
              <>
                {loyaltyPrograms.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl overflow-hidden mb-3"
                    style={{ background: 'var(--accent)', boxShadow: '0 4px 20px var(--border)' }}
                  >
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[10px] font-semibold text-[var(--accent-on)]/60 uppercase tracking-widest mb-0.5">
                            Програма лояльності
                          </p>
                          <p className="heading-serif text-base text-[var(--accent-on)] leading-tight">
                            {loyaltyPrograms[0].name}
                          </p>
                        </div>
                        <div className="size-10 rounded-xl bg-[var(--accent-on)]/15 flex items-center justify-center shrink-0">
                          <Sparkles size={18} className="text-[var(--accent-on)]" />
                        </div>
                      </div>
                      <div className={`grid gap-1.5 ${loyaltyPrograms.length === 1 ? 'grid-cols-1' : loyaltyPrograms.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {loyaltyPrograms.map(({ id, targetVisits, rewardValue }) => (
                          <div key={id} className="rounded-xl bg-[var(--accent-on)]/10 px-2 py-2 text-center">
                            <p className="text-[10px] text-[var(--accent-on)]/50 mb-0.5">{targetVisits} візитів</p>
                            <p className="text-xs font-bold text-[var(--accent-on)]">−{rewardValue}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-4 py-2.5 bg-black/10 flex items-center gap-1.5">
                      <Gift size={12} className="text-[var(--accent-on)]/60" />
                      <p className="text-[10px] text-[var(--accent-on)]/70 leading-tight">
                        Знижки нараховуються автоматично після підтверджених візитів
                      </p>
                    </div>
                  </motion.div>
                )}

                {masterC2cEnabled && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: loyaltyPrograms.length > 0 ? 0.15 : 0.1 }}
                    className="rounded-xl mb-3 p-4 flex items-center gap-3"
                    style={{ background: 'var(--surface)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', boxShadow: '0 2px 12px var(--border)' }}
                  >
                    <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <Handshake size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Запроси подругу</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                        Вона отримає −{masterC2cDiscountPct ?? 10}% на перший візит, а ти накопиш бонус — після реєстрації нижче
                      </p>
                    </div>
                  </motion.div>
                )}

                {loyaltyPrograms.length === 0 && !masterC2cEnabled && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl overflow-hidden mb-3"
                    style={{ background: 'var(--accent)', boxShadow: '0 4px 20px var(--border)' }}
                  >
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[10px] font-semibold text-[var(--accent-on)]/60 uppercase tracking-widest mb-0.5">
                            Твій beauty-простір
                          </p>
                          <p className="heading-serif text-base text-[var(--accent-on)] leading-tight">
                            Один акаунт — всі майстри
                          </p>
                        </div>
                        <div className="size-10 rounded-xl bg-[var(--accent-on)]/15 flex items-center justify-center shrink-0">
                          <Sparkles size={18} className="text-[var(--accent-on)]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { icon: CalendarDays, text: 'Всі записи в одному місці' },
                          { icon: Star, text: 'Відгуки після кожного візиту' },
                          { icon: Bell, text: 'Push-нагадування за 24 год' },
                          { icon: Gift, text: 'Бонуси від улюблених майстрів' },
                        ].map(({ icon: Icon, text }) => (
                          <div key={text} className="rounded-xl bg-[var(--accent-on)]/10 px-2.5 py-2 flex items-center gap-1.5">
                            <Icon size={14} className="text-[var(--accent-on)] shrink-0" />
                            <p className="text-[10px] text-[var(--accent-on)]/80 leading-tight">{text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-4 py-2.5 bg-black/10 flex items-center gap-1.5">
                      <Rocket size={12} className="text-[var(--accent-on)]/60" />
                      <p className="text-[10px] text-[var(--accent-on)]/70 leading-tight">
                        Безкоштовно для клієнтів — завжди
                      </p>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* ── CTA ───────────────────────────────────────────────────────── */}
            <button
              type="button"
              onClick={handleGoogle}
              className="flex items-center justify-center gap-2.5 w-full py-4 px-4 rounded-lg bg-secondary text-foreground text-sm font-semibold border border-border hover:border-primary/40 hover:shadow-lg active:scale-[0.95] transition-all shadow-md shadow-black/6 mb-3 cursor-pointer"
            >
              <GoogleIcon />
              Продовжити з Google
            </button>

            <div className="relative flex items-center gap-3 mb-3">
              <span className="flex-1 border-t border-border" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">або</span>
              <span className="flex-1 border-t border-border" />
            </div>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.95] transition-all shadow-md shadow-primary/20 mb-3 cursor-pointer"
            >
              <Phone size={15} /> Підтвердити номер телефону
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-muted-foreground/60 text-center py-1 hover:text-muted-foreground transition-colors active:scale-95 transition-all cursor-pointer"
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
            <div className="flex items-center gap-0 rounded-md border border-border bg-secondary overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="pl-3.5 pr-2 text-muted-foreground text-sm font-medium shrink-0">+38</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="0XX XXX XX XX"
                value={formatPhoneDisplay(phone)}
                onChange={e => handlePhoneChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendSms()}
                autoFocus
                aria-label="Номер телефону"
                className="flex-1 py-3.5 pr-3.5 text-foreground text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>

            {error && <p className="text-xs text-destructive pl-1">{error}</p>}

            <button
              type="button"
              onClick={handleSendSms}
              disabled={loading || phone.length < 9}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.95] transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Відправляємо...' : 'Отримати код'}
            </button>

            <button type="button" onClick={() => { setStep('choose'); setError(''); }} className="flex items-center justify-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer">
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
            <p className="text-xs text-muted-foreground text-center">
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
                  aria-label={`Цифра ${i + 1} коду`}
                  className="w-11 h-12 text-center text-lg font-bold text-foreground rounded-md border-2 border-border bg-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              ))}
            </div>

            {error && <p className="text-xs text-destructive text-center">{error}</p>}

            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={loading || digits.some(d => !d)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.95] transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Перевіряємо...' : 'Підтвердити'}
            </button>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => { setStep('phone'); setDigits(['', '', '', '', '', '']); setError(''); }} className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer">
                <ArrowLeft size={13} /> Змінити номер
              </button>
              <button type="button" onClick={handleResend} disabled={resendCooldown > 0} className="text-xs text-primary disabled:text-muted-foreground/60 disabled:cursor-default hover:underline cursor-pointer">
                {resendCooldown > 0 ? `Через ${resendCooldown}с` : 'Надіслати знову'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Channels — TG + Push ────────────────────────────────────── */}
        {step === 'channels' && (
          <motion.div
            key="channels"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="flex flex-col"
          >
            <div className="text-center mb-5">
              <div className="size-14 rounded-xl bg-primary/12 flex items-center justify-center mx-auto mb-3 text-primary">
                <Bell size={28} />
              </div>
              <h2 className="heading-serif text-xl text-foreground leading-snug mb-1">
                Підключи сповіщення
              </h2>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Отримуй підтвердження записів та нагадування — де тобі зручно
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-5">
              {/* Telegram */}
              {botName ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: tgOpened ? 'var(--accent-light)' : 'var(--surface)', border: tgOpened ? '1px solid var(--accent)' : '1px solid var(--border)', boxShadow: '0 2px 12px var(--border)' }}
                >
                  <div className="size-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: '#229ED9' }}>
                    <Send size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Telegram-бот</p>
                    <p className="text-[11px] text-muted-foreground/60 leading-tight mt-0.5">
                      {tgOpened ? 'Відкрито — натисни START у боті' : 'Підтвердження та нагадування у Telegram'}
                    </p>
                  </div>
                  <a
                    href={userId ? `https://t.me/${botName}?start=${userId}` : `https://t.me/${botName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setTgOpened(true)}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                    style={{ background: tgOpened ? 'var(--surface)' : '#229ED9', color: tgOpened ? 'var(--accent)' : '#fff' }}
                  >
                    {tgOpened ? 'Відкрито ✓' : 'Відкрити'}
                  </a>
                </motion.div>
              ) : null}

              {/* Push */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: pushState === 'done' ? 'var(--accent-light)' : 'var(--surface)', border: pushState === 'done' ? '1px solid var(--accent)' : '1px solid var(--border)', boxShadow: '0 2px 12px var(--border)' }}
              >
                <div className="size-10 rounded-xl bg-primary/15 shrink-0 flex items-center justify-center text-primary">
                  {pushState === 'done' ? <CheckCircle2 size={20} /> : <Bell size={20} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Push-сповіщення</p>
                  <p className="text-[11px] text-muted-foreground/60 leading-tight mt-0.5">
                    {pushState === 'done' ? 'Підключено — все готово!' : 'Миттєві сповіщення прямо у браузері'}
                  </p>
                </div>
                {pushState !== 'done' && pushState !== 'unsupported' && (
                  <button
                    type="button"
                    onClick={handleSubscribePush}
                    disabled={pushState === 'loading'}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {pushState === 'loading' ? '...' : 'Увімкнути'}
                  </button>
                )}
                {(pushState === 'done' || pushState === 'unsupported') && (
                  <span className="shrink-0 text-xs text-primary font-semibold">{pushState === 'done' ? '✓' : '—'}</span>
                )}
              </motion.div>
            </div>

            <button
              type="button"
              onClick={() => { router.refresh(); router.push('/my/bookings'); }}
              className="flex items-center justify-center w-full py-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.95] transition-all shadow-lg shadow-primary/20 mb-2 cursor-pointer"
            >
              {tgOpened || pushState === 'done' ? 'Продовжити →' : 'Налаштую пізніше →'}
            </button>

            <button
              type="button"
              onClick={() => { router.refresh(); router.push('/my/bookings'); }}
              className="text-[11px] text-muted-foreground/60 text-center py-1 hover:text-muted-foreground/80 transition-colors cursor-pointer"
            >
              пропустити
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
