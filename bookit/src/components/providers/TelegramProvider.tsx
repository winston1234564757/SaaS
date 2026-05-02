'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, resetFetchController } from '@/lib/supabase/client';
import { BeautyLoader } from '@/components/shared/BeautyLoader';
import { AnimatePresence, motion } from 'framer-motion';

interface TelegramContextType {
  isReady: boolean;
  isAuthenticated: boolean;
  tgUser: any | null;
}

const TelegramContext = createContext<TelegramContextType>({
  isReady: false,
  isAuthenticated: false,
  tgUser: null,
});

export const useTelegram = () => useContext(TelegramContext);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tgUser, setTgUser] = useState<any>(null);
  const [loadingStep, setLoadingStep] = useState('Ініціалізація...');
  const [minTimePassed, setMinTimePassed] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleAutoLogin = useCallback(async (initData: string) => {
    try {
      setLoadingStep('Авторизація...');
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });

      if (!res.ok) throw new Error(`Auth failed: ${res.status}`);

      const data = await res.json();
      if (data.success && data.token) {
        setLoadingStep('Синхронізація сесії...');
        const { error } = await supabase.auth.setSession({
          access_token: data.token,
          refresh_token: data.token, // Using token as dummy refresh for session init
        });

        if (error) throw error;
        setIsAuthenticated(true);
        // Force reload to update cookies for middleware
        window.location.reload();
      } else {
        setIsReady(true);
      }
    } catch (err) {
      console.error('[TelegramProvider] Auto-login error:', err);
      setIsReady(true);
    }
  }, [supabase.auth]);

  useEffect(() => {
    // Ensure loader stays for at least 2.5 seconds for a premium feel
    const timer = setTimeout(() => setMinTimePassed(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 8s safety timeout for TMA initialization
    const safetyTimeout = setTimeout(() => {
      setIsReady(true);
    }, 8000);

    const initTg = async () => {
      try {
        // 0. Preliminary session check with a strict timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
        
        const sessionResult = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const session = sessionResult?.data?.session;

        if (session) {
          setIsAuthenticated(true);
          setIsReady(true);
          clearTimeout(safetyTimeout);
          return;
        }
      } catch (e) {
        console.warn('[TelegramProvider] Session check timed out or failed, proceeding...');
      }

      const tg = window.Telegram?.WebApp;

      if (tg) {
        setLoadingStep('Завантаження профілю...');
        try {
          tg.ready();
          tg.expand();
          
          if (tg.setHeaderColor) tg.setHeaderColor('#FFE8DC');
          if (tg.setBackgroundColor) tg.setBackgroundColor('#FFE8DC');

          if (tg.initDataRaw) {
            setTgUser(tg.initDataUnsafe?.user || null);
            handleAutoLogin(tg.initDataRaw);
          } else {
            const params = new URLSearchParams(window.location.hash.replace('#', ''));
            const rawData = params.get('tgWebAppData');
            if (rawData) {
              handleAutoLogin(rawData);
            } else {
              setIsReady(true);
              clearTimeout(safetyTimeout);
            }
          }
        } catch (e) {
          console.error('[TelegramProvider] SDK Error:', e);
          setIsReady(true);
        }
      } else {
        setIsReady(true);
        clearTimeout(safetyTimeout);
      }
    };

    initTg();

    // Fast resume from background with a "curtain" loader
    const handleVisibilityChange = () => {
      const { visibilityState } = document;
      
      if (visibilityState === 'hidden') {
        // PRE-EMPTIVE: Add class before suspension
        document.body.classList.add('app-loading');
      } else if (visibilityState === 'visible') {
        resetFetchController(); // KILL hanging requests
        setLoadingStep('Повертаємось до роботи...');
        setIsReady(false);
        setMinTimePassed(false);
        // Force at least 1.5s of loading on resume
        setTimeout(() => setMinTimePassed(true), 1500);
        setTimeout(() => {
          initTg().finally(() => {
            document.body.classList.remove('app-loading');
          });
        }, 1200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(safetyTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleAutoLogin, supabase.auth]);

  // Combined logic for showing loader: either not ready OR minimum time hasn't passed
  const showLoader = !isReady || !minTimePassed;

  return (
    <TelegramContext.Provider value={{ isReady, isAuthenticated, tgUser }}>
      <AnimatePresence mode="wait">
        {showLoader ? (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[9999]"
          >
            <BeautyLoader message={loadingStep} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </TelegramContext.Provider>
  );
}
