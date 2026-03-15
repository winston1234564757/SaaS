'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Hash, AlertCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

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

type PhoneState = 'input' | 'otp';
type LoginTab = 'phone' | 'email';

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<LoginTab>('phone');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [phoneState, setPhoneState] = useState<PhoneState>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fullPhone = `+380${phone.replace(/\D/g, '')}`;

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // Redirect happens automatically
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 9) {
      setError('Введіть 9 цифр номера');
      return;
    }
    setIsLoading(true);
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setIsLoading(false);
    if (otpError) {
      setError('Не вдалося надіслати код. Перевірте номер.');
      return;
    }
    setPhoneState('otp');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Введіть коректний email'); return; }
    setIsLoading(true);
    setError(null);
    const { data, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (loginErr || !data.user) { setError('Невірний email або пароль.'); return; }
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    router.push(profile?.role === 'master' ? '/dashboard' : '/my/bookings');
  };

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
    if (verifyError || !data.user) {
      setError('Невірний код. Спробуйте ще раз.');
      setIsLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    router.push(profile?.role === 'master' ? '/dashboard' : '/my/bookings');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <Card>
        <div className="mb-6">
          <h1 className="heading-serif text-2xl text-[#2C1A14] mb-1">Вхід</h1>
          <p className="text-sm text-[#6B5750]">Раді бачити тебе знову</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-[#C05B5B]/10 border border-[#C05B5B]/20">
            <AlertCircle size={15} className="text-[#C05B5B] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#C05B5B]">{error}</p>
          </div>
        )}

        {/* Google */}
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={handleGoogleLogin}
          isLoading={isGoogleLoading}
          className="mb-4 flex items-center justify-center gap-2.5"
        >
          {!isGoogleLoading && <GoogleIcon />}
          Увійти через Google
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#E8D8D2]" />
          <span className="text-xs text-[#A8928D]">або</span>
          <div className="flex-1 h-px bg-[#E8D8D2]" />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-[#F5EDE8] rounded-xl mb-4">
          {([['phone', <Phone key="p" size={13} />, 'Телефон'], ['email', <Mail key="e" size={13} />, 'Email']] as const).map(([t, icon, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t
                  ? 'bg-white text-[#2C1A14] shadow-sm'
                  : 'text-[#A8928D] hover:text-[#6B5750]'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Phone OTP / Email */}
        <AnimatePresence mode="wait">
          {tab === 'email' ? (
            <motion.form
              key="email"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.16 }}
              onSubmit={handleEmailLogin}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-[#2C1A14] mb-1.5">Email</label>
                <div className="flex items-center rounded-xl border border-white/80 bg-white/75 overflow-hidden focus-within:border-[#789A99] focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
                  <span className="pl-3.5 pr-1 text-[#A8928D]"><Mail size={14} /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="flex-1 h-12 pr-4 text-sm text-[#2C1A14] bg-transparent focus:outline-none"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C1A14] mb-1.5">Пароль</label>
                <div className="flex items-center rounded-xl border border-white/80 bg-white/75 overflow-hidden focus-within:border-[#789A99] focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="flex-1 h-12 px-4 text-sm text-[#2C1A14] bg-transparent focus:outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                Увійти →
              </Button>
            </motion.form>
          ) : phoneState === 'input' ? (
            <motion.form
              key="phone"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.16 }}
              onSubmit={handleSendOtp}
              className="flex flex-col gap-4"
            >
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
              <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                Отримати код →
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="otp"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.16 }}
              onSubmit={handleVerifyOtp}
              className="flex flex-col gap-4"
            >
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
                Увійти
              </Button>
              <button
                type="button"
                onClick={() => { setPhoneState('input'); setOtp(''); setError(null); }}
                className="text-sm text-[#789A99] hover:underline text-center"
              >
                ← Змінити номер
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-[#6B5750] mt-5">
          Ще не зареєстровані?{' '}
          <Link href="/register" className="text-[#789A99] font-medium hover:underline">
            Створити акаунт
          </Link>
        </p>
      </Card>
    </motion.div>
  );
}
