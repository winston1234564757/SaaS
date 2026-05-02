'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
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
  const [loadingStep, setLoadingStep] = useState('Ініціалізація...');
  const [minTimePassed, setMinTimePassed] = useState(false);
  
  const initAttemptedRef = useRef(false);
  const supabase = createClient();

  const hasTgInUrl = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const url = window.location.href;
    return url.includes('tgWebAppData') || url.includes('tgWebAppData') || url.includes('TGWEBAPPDATA');
  }, []);

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
        
        console.log('[TelegramProvider] Auto-login successful, hard redirecting');
        setIsAuthenticated(true);
        // Hard redirect for auto-login cases
        window.location.href = '/dashboard';
      } else {
        setIsReady(true);
      }
    } catch (err) {
      console.error('[TelegramProvider] Auto-login error:', err);
      setIsReady(true);
    }
  }, [supabase.auth]);

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

    const initTgWithRetry = async (attempts = 0) => {
      const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
      
      if (!tg && hasTgInUrl() && attempts < 15) {
        setTimeout(() => initTgWithRetry(attempts + 1), 200);
        return;
      }

      try {
        const isInTelegram = !!tg || hasTgInUrl();
        if (isInTelegram) {
          setIsTMA(true);
          if (tg) {
            tg.ready();
            tg.expand();
            if (tg.setHeaderColor) tg.setHeaderColor('#FFE8DC');
            if (tg.setBackgroundColor) tg.setBackgroundColor('#FFE8DC');
          }
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

        if (isInTelegram) {
          const rawData = tg?.initDataRaw || new URLSearchParams(window.location.hash.replace('#', '')).get('tgWebAppData') || new URLSearchParams(window.location.search).get('tgWebAppData');
          if (rawData) {
            setTgUser(tg?.initDataUnsafe?.user || null);
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

    initTgWithRetry();
  }, [handleAutoLogin, supabase.auth, hasTgInUrl]);

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
