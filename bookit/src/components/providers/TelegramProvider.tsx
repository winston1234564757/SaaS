'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BeautyLoader } from '@/components/shared/BeautyLoader';
import { AnimatePresence, motion } from 'framer-motion';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

interface TelegramContextType {
  isReady: boolean;
  isAuthenticated: boolean;
  isTMA: boolean;
  tgUser: TelegramUser | null;
}

const TelegramContext = createContext<TelegramContextType>({
  isReady: false,
  isAuthenticated: false,
  isTMA: false,
  tgUser: null,
});

export const useTelegram = () => useContext(TelegramContext);

const GUEST_PATHS = new Set<string>(['/', '/login', '/register']);
const SAFETY_TIMEOUT_MS = 8_000;
const MIN_LOADER_MS = 1_500;
const SDK_RETRY_MAX = 15;
const SDK_RETRY_DELAY = 200;

function targetPathForRole(role: string | null | undefined): string {
  return role === 'master' ? '/dashboard' : '/my/bookings';
}

function urlHasTgParams(): boolean {
  if (typeof window === 'undefined') return false;
  const url = window.location.href;
  return url.includes('tgWebAppData') || url.includes('TGWEBAPPDATA');
}

function readTgInitDataFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('tgWebAppData');
  if (fromHash) return fromHash;
  const fromSearch = new URLSearchParams(window.location.search).get('tgWebAppData');
  return fromSearch ?? null;
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTMA, setIsTMA] = useState(false);
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Ініціалізація...');
  const [minTimePassed, setMinTimePassed] = useState(false);

  const initAttemptedRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // ── Hard navigation helper ──────────────────────────────────────────────────
  // У TMA WebView soft-nav (router.replace) часто застрягає в iframe race.
  // Hard nav гарантує SSR-redraw зі свіжими cookies (proxy.ts читає sb-*-auth-token
  // і одразу робить server-side редирект до /dashboard або /my/bookings).
  const navigateAfterAuth = (role: string | null | undefined, inTma: boolean) => {
    setIsRedirecting(true);
    setLoadingStep('Вхід до кабінету...');
    const target = targetPathForRole(role);
    if (inTma) {
      window.location.replace(target);
    } else {
      router.replace(target);
    }
  };

  // ── Auto-login flow (TMA, profile linked with phone) ────────────────────────
  const handleAutoLogin = async (initData: string, inTma: boolean) => {
    try {
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

        // CRITICAL: trigger nav synchronously — no setIsAuthenticated/setIsReady race window.
        // Page is unloading; further state mutations are wasted.
        navigateAfterAuth(data.user?.role, inTma);
        return;
      }

      // NEED_PHONE / WAITING_FOR_PHONE → show TelegramWelcome
      console.log('[TelegramProvider] Auto-login pending:', data.status);
      setIsReady(true);
    } catch (err) {
      console.error('[TelegramProvider] Auto-login error:', err);
      setIsReady(true);
    }
  };

  // ── Min-loader timer (premium feel, 2.5s minimum on TMA cold start) ─────────
  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_LOADER_MS);
    return () => clearTimeout(timer);
  }, []);

  // ── Auth subscription ───────────────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log('[TelegramProvider] Auth event:', event, 'hasSession:', !!session);
        setIsAuthenticated(!!session);
      }
    );
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // ── One-shot init: detect TMA, check session, kick auto-login ───────────────
  useEffect(() => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const safetyTimer = setTimeout(() => {
      console.warn('[TelegramProvider] Safety timeout fired — forcing ready');
      setIsReady(true);
    }, SAFETY_TIMEOUT_MS);

    const initWithRetry = async (attempts = 0): Promise<void> => {
      const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

      // SDK script may load slightly after first paint — retry briefly if URL has TG params.
      if (!tg && urlHasTgParams() && attempts < SDK_RETRY_MAX) {
        setTimeout(() => { void initWithRetry(attempts + 1); }, SDK_RETRY_DELAY);
        return;
      }

      try {
        const inTma = !!tg || urlHasTgParams();
        if (inTma) {
          setIsTMA(true);
          if (tg) {
            tg.ready();
            tg.expand();
            setTgUser((tg.initDataUnsafe?.user as TelegramUser) ?? null);
          }
        }

        // 1. Existing session? Verify profile, redirect if on guest page.
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('session-timeout')), 5000))
        ]) as any;

        if (session) {
          const { data: profile } = await Promise.race([
            supabase
              .from('profiles')
              .select('id, role')
              .eq('id', session.user.id)
              .maybeSingle(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('db-timeout')), 5000))
          ]) as any;

          if (profile) {
            setIsAuthenticated(true);
            const onGuest = GUEST_PATHS.has(pathname);
            if (inTma && onGuest) {
              clearTimeout(safetyTimer);
              navigateAfterAuth(profile.role, true);
              return;
            }
            setIsReady(true);
            clearTimeout(safetyTimer);
            return;
          }

          console.warn('[TelegramProvider] Session without profile — signing out');
          await supabase.auth.signOut();
          setIsAuthenticated(false);
        }

        // 2. No session but in TMA → try auto-login from initData.
        if (inTma) {
          const rawData = tg?.initDataRaw || readTgInitDataFromUrl();
          if (rawData) {
            await handleAutoLogin(rawData, true);
            clearTimeout(safetyTimer);
            return;
          }
        }

        // 3. Not in TMA, or no initData → ready (welcome / landing).
        setIsReady(true);
        clearTimeout(safetyTimer);
      } catch (e) {
        console.error('[TelegramProvider] Init error:', e);
        setIsReady(true);
        clearTimeout(safetyTimer);
      }
    };

    void initWithRetry();
    return () => clearTimeout(safetyTimer);
  }, [handleAutoLogin, navigateAfterAuth, pathname, supabase]);

  // ── Catch-all redirect: e.g. RootPageClient verifyOtp fires SIGNED_IN ───────
  // — TelegramProvider doesn't know the role here, so fall back to '/' (proxy
  //   server-redirects based on user_role cookie set by middleware).
  useEffect(() => {
    if (!isReady || !isAuthenticated || isRedirecting) return;
    if (!GUEST_PATHS.has(pathname)) return;

    setIsRedirecting(true);
    setLoadingStep('Вхід до кабінету...');
    if (isTMA) {
      window.location.replace('/');
    } else {
      router.replace('/');
    }
  }, [isReady, isAuthenticated, isRedirecting, pathname, isTMA, router]);

  // ── Dynamic Status Bar & TMA color sync ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateColors = () => {
      const htmlEl = document.documentElement;
      const theme = htmlEl.getAttribute('data-theme') || '';
      
      const themeColors = {
        studio: '#0E1D21',
        frost: '#EFF2FF',
        '': '#DDD5C6', // Blossom (default)
      };
      
      const targetColor = themeColors[theme as 'studio' | 'frost' | ''] || '#DDD5C6';

      // 1. Update standard meta tag
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', targetColor);
      }

      // 2. Update Telegram WebApp colors
      const tg = window.Telegram?.WebApp;
      if (tg) {
        try {
          tg.setHeaderColor?.(targetColor);
          tg.setBackgroundColor?.(targetColor);
        } catch (err) {
          console.warn('[TelegramProvider] Failed to update TG colors:', err);
        }
      }
    };

    // Run once initially
    updateColors();

    // Observe changes to 'data-theme' attribute on <html>
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateColors();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  // ── Loader visibility ───────────────────────────────────────────────────────
  // Show loader when: still initializing, premium-min hold (TMA cold + not auth yet),
  // or during nav transition. NEVER false during the brief "auth done, nav started"
  // window — navigateAfterAuth flips isRedirecting before the redirect itself.
  const showLoader =
    !isReady ||
    (isTMA && !minTimePassed && !isAuthenticated) ||
    isRedirecting;

  return (
    <TelegramContext.Provider value={{ isReady, isAuthenticated, isTMA, tgUser }}>
      <AnimatePresence mode="popLayout">
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
