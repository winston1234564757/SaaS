'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BeautyLoader } from '@/components/shared/BeautyLoader';
import { AnimatePresence, motion } from 'framer-motion';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface TelegramContextType {
  isReady: boolean;
  isAuthenticated: boolean;
  isTMA: boolean;
  tgUser: any | null;
}

const TelegramContext = createContext<TelegramContextType>({
  isReady: false,
  isAuthenticated: false,
  isTMA: false,
  tgUser: null,
});

export const useTelegram = () => useContext(TelegramContext);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTMA, setIsTMA] = useState(false);
  const [tgUser, setTgUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [loadingStep, setLoadingStep] = useState('Ініціалізація...');
  const [minTimePassed, setMinTimePassed] = useState(false);
  
  const initAttemptedRef = useRef(false);
  const supabase = createClient();

  const handleAutoLogin = useCallback(async (initData: string) => {
    try {
      console.log('[TelegramProvider] Auto-login starting...');
      setLoadingStep('Авторизація...');
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });

      if (!res.ok) throw new Error(`Auth failed: ${res.status}`);

      const data = await res.json();
      if (data.success && data.token && data.email) {
        setLoadingStep('Синхронізація...');
        const { error } = await supabase.auth.verifyOtp({
          email: data.email,
          token: data.token,
          type: 'email',
        });

        if (error) throw error;
        
        console.log('[TelegramProvider] Auto-login successful');
        setIsAuthenticated(true);
        setIsReady(true);
        
        // KROK 3: Use soft navigation
        router.replace('/dashboard');
      } else {
        setIsReady(true);
      }
    } catch (err) {
      console.error('[TelegramProvider] Auto-login error:', err);
      setIsReady(true);
    }
  }, [supabase.auth, router]);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const safetyTimeout = setTimeout(() => {
      if (!isReady) {
        console.warn('[TelegramProvider] Safety timeout, forcing ready');
        setIsReady(true);
      }
    }, 12000);

    const initTg = async () => {
      try {
        // KROK 2: Polling for WebApp readiness
        let attempts = 0;
        const checkWebApp = () => {
          const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
          if (tg) {
            console.log('[TelegramProvider] WebApp Ready');
            setIsTMA(true);
            tg.ready();
            tg.expand();
            if (tg.setHeaderColor) tg.setHeaderColor('#FFE8DC');
            if (tg.setBackgroundColor) tg.setBackgroundColor('#FFE8DC');
            return tg;
          }
          return null;
        };

        let tg = checkWebApp();
        while (!tg && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          tg = checkWebApp();
          attempts++;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();
          if (profile) {
            setIsAuthenticated(true);
            setIsReady(true);
            clearTimeout(safetyTimeout);
            return;
          } else {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }
        }

        if (tg) {
          const rawData = tg.initDataRaw || new URLSearchParams(window.location.hash.replace('#', '')).get('tgWebAppData');
          if (rawData) {
            setTgUser(tg.initDataUnsafe?.user || null);
            await handleAutoLogin(rawData);
          } else {
            setIsReady(true);
          }
        } else {
          setIsReady(true);
        }
      } catch (e) {
        console.error('[TelegramProvider] init error:', e);
        setIsReady(true);
      } finally {
        clearTimeout(safetyTimeout);
      }
    };

    initTg();
  }, [handleAutoLogin, supabase.auth]);

  // Loader visibility logic
  const showLoader = !isReady || (isTMA && !minTimePassed && !isAuthenticated);

  return (
    <TelegramContext.Provider value={{ isReady, isAuthenticated, isTMA, tgUser }}>
      <AnimatePresence mode="wait">
        {showLoader ? (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999]"
          >
            <BeautyLoader message={loadingStep} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </TelegramContext.Provider>
  );
}
