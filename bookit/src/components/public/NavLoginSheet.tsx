'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const inputCls =
  'w-full h-12 px-4 rounded-xl bg-white/75 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all';

export function NavLoginSheet({ open, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?role=client` },
    });
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (err) { setError('Невірний email або пароль'); return; }
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-[#FFE8DC] rounded-t-3xl shadow-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-[#D4B9B0] mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#2C1A14]">Увійти до Bookit</h2>
                <p className="text-sm text-[#6B5750] mt-0.5">Всі записи в одному місці</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#A8928D] hover:bg-black/5 transition-colors flex-shrink-0"
                aria-label="Закрити"
              >
                <X size={16} />
              </button>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-white/80 bg-white/80 hover:bg-white backdrop-blur-sm text-sm font-semibold text-[#2C1A14] disabled:opacity-50 transition-colors mb-4"
            >
              <GoogleIcon />
              Продовжити з Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#E8D5CF]" />
              <span className="text-xs text-[#A8928D]">або</span>
              <div className="flex-1 h-px bg-[#E8D5CF]" />
            </div>

            {/* Email + Password */}
            <form onSubmit={handleEmail} className="flex flex-col gap-3">
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8928D] pointer-events-none" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`${inputCls} pl-10`}
                  autoComplete="email"
                />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8928D] pointer-events-none" />
                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${inputCls} pl-10`}
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-xs text-[#C05B5B] px-1">{error}</p>}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full h-12 rounded-xl bg-[#789A99] hover:bg-[#6B8C8B] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Увійти'
                )}
              </button>
            </form>

            <p className="text-xs text-center text-[#A8928D] mt-4">
              Ще немає акаунту?{' '}
              <a href="/register" className="text-[#789A99] font-medium underline underline-offset-4">
                Зареєструватись
              </a>
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
