'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

function TelegramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

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

export function LoginForm() {
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'bookit_auth_bot';
  const supabase = createClient();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <Card>
        <div className="mb-8 text-center">
          <h1 className="heading-serif text-2xl text-[#2C1A14] mb-2">Вхід у Bookit</h1>
          <p className="text-sm text-[#A8928D]">Без паролів та SMS. Швидкий та безпечний вхід.</p>
        </div>

        {/* Telegram — primary */}
        <a
          href={'https://t.me/' + botName + '?start=login'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-[#2AABEE] text-white text-base font-semibold hover:bg-[#1a95d6] active:scale-[0.98] transition-all shadow-lg shadow-[#2AABEE]/25"
        >
          <TelegramIcon />
          Увійти через Telegram
        </a>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#E8D8D2]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/80 px-3 text-[#A8928D] tracking-wide">Або</span>
          </div>
        </div>

        {/* Google — secondary */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="flex items-center justify-center gap-2.5 w-full py-4 px-6 rounded-2xl bg-white text-[#2C1A14] text-base font-semibold border border-[#E8D0C8] hover:border-[#D4B8AE] hover:shadow-md active:scale-[0.98] transition-all shadow-sm shadow-black/8 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
          Продовжити з Google
        </button>

        <p className="text-center text-sm text-[#6B5750] mt-6">
          Ще не зареєстровані?{' '}
          <Link href="/register" className="text-[#789A99] font-medium hover:underline">
            Створити акаунт
          </Link>
        </p>
      </Card>
    </motion.div>
  );
}
