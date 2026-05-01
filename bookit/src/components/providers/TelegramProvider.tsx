'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TelegramWelcome } from '@/components/telegram/TelegramWelcome';

interface TelegramContextType {
  isReady: boolean;
  user: TelegramWebApp['initDataUnsafe']['user'] | null;
  isAuthenticated: boolean;
  isLinking: boolean;
  error: string | null;
  handleLinkPhone: (phone: string) => Promise<void>;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tgUser, setTgUser] = useState<TelegramWebApp['initDataUnsafe']['user'] | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('Ініціалізація...');

  const supabase = createClient();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fullUrl = (window.location.hash + window.location.search);
    const hasTgParams = fullUrl.toLowerCase().includes('tgwebappdata=');

    // CRITICAL: If we are not in Telegram (no params), skip everything immediately
    if (!hasTgParams) {
      setIsReady(true);
      return;
    }

    let retryCount = 0;
    const maxRetries = 15;
    const safetyTimeout = setTimeout(() => {
      if (!isReady) {
        console.warn('[TelegramProvider] Safety timeout reached');
        setIsReady(true);
      }
    }, 8000);

    const initTg = () => {
      const tg = window.Telegram?.WebApp;

      setLoadingStep(`Завантаження профілю...`);

      if (tg) {
        try {
          clearTimeout(safetyTimeout);
          tg.ready();
          tg.expand();

          if (tg.initDataRaw) {
            setTgUser(tg.initDataUnsafe?.user || null);
            handleAutoLogin(tg.initDataRaw);
            return;
          }
        } catch (e: any) {
          console.error('[TelegramProvider] Init error:', e);
        }
      }

      // Fallback: if we have params in URL but no SDK object yet
      if (hasTgParams) {
        const params = new URLSearchParams(fullUrl.replace(/^#/, ''));
        const rawData = params.get('tgWebAppData') || params.get('TGWEBAPPDATA');
        
        if (rawData) {
          handleAutoLogin(rawData);
          return;
        }
      }

      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(initTg, 250);
        return;
      }

      clearTimeout(safetyTimeout);
      setIsReady(true);
    };

    initTg();
    return () => clearTimeout(safetyTimeout);
  }, [supabase]);

  async function handleAutoLogin(initData: string) {
    setLoadingStep('Автентифікація профілю...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setLoadingStep('Синхронізація сесії...');

      if (data.success && data.token) {
        const { error: authErr } = await supabase.auth.verifyOtp({
          email: data.email,
          token: data.token,
          type: 'magiclink'
        });
        if (authErr) throw authErr;
        setIsAuthenticated(true);
      } else if (data.status === 'NEED_PHONE') {
        setIsLinking(true);
      } else if (data.status === 'WAITING_FOR_PHONE') {
        // Profile exists but webhook hasn't set the phone yet - show linking screen
        setIsLinking(true);
      } else {
        throw new Error(data.error || 'Failed to authenticate');
      }
    } catch (err: any) {
      console.error('[TelegramProvider] Auth error:', err);
      setError(err.name === 'AbortError' ? 'Сервер не відповідає. Спробуйте пізніше.' : err.message);
    } finally {
      setIsReady(true);
    }
  }

  async function handleLinkPhone(linked: string) {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataRaw) return;

    // If it was linked via bot webhook, just try to login again
    setIsReady(false); // Show spinner while re-logging
    handleAutoLogin(tg.initDataRaw);
  }

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-peach gap-4">
        <div className="w-12 h-12 border-4 border-sage/30 border-t-sage rounded-full animate-spin" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-sage text-base font-medium animate-pulse">Завантаження профілю...</p>
          <p className="text-sage/60 text-[10px] font-mono uppercase tracking-widest">{loadingStep}</p>
        </div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-peach p-6 text-center">
        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 className="heading-serif text-2xl mb-2">Помилка входу</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bento-card bg-sage text-white py-3 px-8 rounded-xl active:scale-95 transition-all"
        >
          Спробувати ще раз
        </button>
      </div>
    );
  }

  if (isLinking && !isAuthenticated) {
    return (
      <div className="bg-peach min-h-screen">
        <TelegramWelcome onSuccess={handleLinkPhone} />
      </div>
    );
  }

  return (
    <TelegramContext.Provider value={{ 
      isReady, 
      user: tgUser, 
      isAuthenticated, 
      isLinking, 
      error,
      handleLinkPhone
    }}>
      {children}
    </TelegramContext.Provider>
  );
}

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};
