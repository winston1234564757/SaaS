'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { TelegramWelcome } from '@/components/telegram/TelegramWelcome';
import { LandingPageContent } from '@/components/landing/LandingPageContent';
import { BeautyLoader } from '@/components/shared/BeautyLoader';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2 } from 'lucide-react';

export function RootPageClient() {
  const { isAuthenticated, isTMA, isReady } = useTelegram();
  const supabase = createClient();
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-redirect effect when authenticated in TMA
  useEffect(() => {
    if (isTMA && isAuthenticated && !isVerifying) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        console.log('[RootPageClient] Triggering hard redirect to /dashboard');
        // Add cache-buster to ensure the server doesn't return a cached guest page
        window.location.href = '/dashboard?auth=' + Date.now();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isTMA, isAuthenticated, isVerifying]);

  if (!isReady) return null;

  if (isTMA) {
    if (showSuccess) {
      return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FFE8DC] p-6 text-center">
          <div className="mb-6 animate-bounce">
            <CheckCircle2 className="w-20 h-20 text-[#5C9E7A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C1A14] mb-2 font-display">Вітаємо!</h1>
          <p className="text-[#6B5750] mb-8">Авторизація успішна. Зараз ви будете перенаправлені...</p>
          
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="px-8 py-4 bg-[#789A99] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            Увійти в кабінет
          </button>
          
          <p className="mt-8 text-xs text-[#A8928D]">
            Якщо перехід не відбувся автоматично, натисніть кнопку вище
          </p>
        </div>
      );
    }

    if (!isAuthenticated || isVerifying) {
      return (
        <div className="bg-[#FFE8DC] min-h-screen">
          {isVerifying ? (
            <BeautyLoader message="Синхронізація..." />
          ) : (
            <TelegramWelcome onSuccess={async (payload) => {
              if (payload.token && payload.email) {
                setIsVerifying(true);
                try {
                  const { error } = await supabase.auth.verifyOtp({
                    email: payload.email,
                    token: payload.token,
                    type: 'email',
                  });
                  if (error) throw error;
                  // The useEffect above will catch the isAuthenticated change
                } catch (e) {
                  console.error('Verify error:', e);
                  setIsVerifying(false);
                }
              }
            }} />
          )}
        </div>
      );
    }
    
    return null;
  }

  return <LandingPageContent />;
}
