'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Hash, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { serviceCategories } from '@/lib/constants/categories';
import { generateSlug } from '@/lib/utils/slug';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { createMasterProfileAfterSignup } from '@/app/(auth)/register/actions';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

// Step 1 has a sub-state for OTP verification
type Step = 1 | 2 | 3;
type OtpState = 'idle' | 'sent' | 'verified';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referredBy = searchParams.get('ref'); // referral code from URL
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [otpState, setOtpState] = useState<OtpState>('idle');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');

  // Step 2
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Step 3
  const [slug, setSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fullPhone = `+380${phone.replace(/\D/g, '')}`;

  const stepTitles: Record<Step, string> = {
    1: 'Створи акаунт',
    2: 'Твоя спеціалізація',
    3: 'Твоє посилання',
  };

  // ── Google OAuth ────────────────────────────────────────────────────────────
  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setError(null);
    const refParam = referredBy ? `&ref=${referredBy}` : '';
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=master${refParam}`,
      },
    });
  };

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError("Введіть ім'я"); return; }
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 9) { setError('Введіть 9 цифр номера'); return; }
    setIsLoading(true);
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setIsLoading(false);
    if (otpError) { setError('Не вдалося надіслати код. Перевірте номер.'); return; }
    setOtpState('sent');
  };

  // ── Step 1: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setIsLoading(true);
    setError(null);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: 'sms',
    });
    setIsLoading(false);
    if (verifyError || !data.user) { setError('Невірний код. Спробуйте ще раз.'); return; }

    // Check if user already has a profile (existing user)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile) {
      router.push(profile.role === 'master' ? '/dashboard' : '/my/bookings');
      return;
    }

    setVerifiedPhone(fullPhone);
    setOtpState('verified');
    setSlug(generateSlug(fullName));
    setStep(2);
  };

  // ── Step 2: Categories ──────────────────────────────────────────────────────
  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleStep2 = () => {
    if (selectedCategories.length === 0) return;
    setStep(3);
  };

  // ── Step 3: Slug + Finish ──────────────────────────────────────────────────
  const handleSlugChange = (value: string) => {
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, '')
        .replace(/\.+/g, '.')
        .replace(/^\.+|\.+$/g, '')
    );
  };

  const handleFinish = async () => {
    if (!slug) return;
    setIsSaving(true);
    setError(null);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Сесія не знайдена');

      const { error: profileErr } = await createMasterProfileAfterSignup({
        userId: user.id,
        fullName,
        phone: verifiedPhone,
        slug,
        categories: selectedCategories,
        referredBy,
      });
      if (profileErr) throw new Error(profileErr);

      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Щось пішло не так';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <Card>
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="heading-serif text-xl text-[#2C1A14]">{stepTitles[step]}</h1>
            <span className="text-sm text-[#A8928D] font-medium">{step} / 3</span>
          </div>
          <div className="h-1.5 bg-[#F5E8E3] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#789A99] rounded-full"
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-[#C05B5B]/10 border border-[#C05B5B]/20">
            <AlertCircle size={15} className="text-[#C05B5B] mt-0.5 shrink-0" />
            <p className="text-xs text-[#C05B5B]">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Step 1 ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              {/* Google button — only on initial state */}
              {otpState === 'idle' && (
                <>
                  <Button
                    variant="secondary"
                    fullWidth
                    size="lg"
                    onClick={handleGoogleSignup}
                    isLoading={isGoogleLoading}
                    className="flex items-center justify-center gap-2.5"
                  >
                    {!isGoogleLoading && <GoogleIcon />}
                    Зареєструватися через Google
                  </Button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#E8D8D2]" />
                    <span className="text-xs text-[#A8928D]">або</span>
                    <div className="flex-1 h-px bg-[#E8D8D2]" />
                  </div>
                </>
              )}

              {/* Phone input */}
              {otpState === 'idle' && (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                  <Input
                    label="Ім'я та прізвище"
                    type="text"
                    placeholder="Анна Коваленко"
                    prefix={<User size={16} />}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-[#2C1A14] mb-1.5">
                      Номер телефону
                    </label>
                    <div className="flex items-center rounded-xl border border-white/80 bg-white/75 overflow-hidden focus-within:border-[#789A99] focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
                      <span className="pl-3.5 pr-1 text-sm text-[#A8928D] whitespace-nowrap shrink-0 flex items-center gap-1.5">
                        <Phone size={14} />
                        +380
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        className="flex-1 h-12 pr-4 text-sm text-[#2C1A14] bg-transparent focus:outline-none tracking-wider"
                        placeholder="XX XXX XX XX"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="mt-1">
                    Отримати код →
                  </Button>
                </form>
              )}

              {/* OTP verification */}
              {otpState === 'sent' && (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <p className="text-sm text-[#6B5750]">
                    Код надіслано на <strong>+380{phone}</strong>
                  </p>
                  <Input
                    label="Код підтвердження"
                    type="text"
                    inputMode="numeric"
                    placeholder="• • • • • •"
                    prefix={<Hash size={16} />}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                  <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                    Підтвердити →
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setOtpState('idle'); setOtp(''); setError(null); }}
                    className="text-sm text-[#789A99] hover:underline text-center"
                  >
                    ← Змінити номер
                  </button>
                </form>
              )}

              <p className="text-center text-sm text-[#6B5750] mt-1">
                Вже є акаунт?{' '}
                <Link href="/login" className="text-[#789A99] font-medium hover:underline">
                  Увійти
                </Link>
              </p>
            </motion.div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-5"
            >
              <p className="text-sm text-[#6B5750]">Обери одну або кілька категорій:</p>
              <div className="grid grid-cols-2 gap-2">
                {serviceCategories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={cn(
                        'flex items-center gap-2.5 p-3.5 rounded-2xl border text-sm font-medium transition-all duration-150',
                        isSelected
                          ? 'bg-[#789A99]/12 border-[#789A99]/40 text-[#5C7E7D]'
                          : 'bg-white/60 border-white/80 text-[#2C1A14] hover:border-[#789A99]/30'
                      )}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span>{cat.label}</span>
                      {isSelected && <CheckCircle size={14} className="ml-auto text-[#789A99]" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-1">
                <Button variant="secondary" onClick={() => { setStep(1); setOtpState('idle'); setOtp(''); }} className="flex-1">
                  ← Назад
                </Button>
                <Button
                  onClick={handleStep2}
                  disabled={selectedCategories.length === 0}
                  className="flex-1"
                >
                  Далі →
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-5"
            >
              <p className="text-sm text-[#6B5750]">
                Це буде твоє публічне посилання. Можна змінити пізніше.
              </p>

              <div>
                <label className="block text-sm font-medium text-[#2C1A14] mb-1.5">
                  Твоє посилання
                </label>
                <div className="flex items-center rounded-xl border border-white/80 bg-white/75 overflow-hidden focus-within:border-[#789A99] focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
                  <span className="pl-3.5 pr-1 text-sm text-[#A8928D] whitespace-nowrap shrink-0">
                    bookit.com.ua/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="flex-1 h-12 pr-4 text-sm text-[#2C1A14] bg-transparent focus:outline-none"
                    placeholder="anna.kovalenko"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/40 border border-white/70">
                <p className="text-xs text-[#A8928D] mb-1">Прев'ю:</p>
                <p className="text-sm font-semibold text-[#789A99] break-all">
                  bookit.com.ua/{slug || 'твоє-посилання'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                  ← Назад
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={!slug}
                  isLoading={isSaving}
                  className="flex-1"
                >
                  Готово 🎉
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
