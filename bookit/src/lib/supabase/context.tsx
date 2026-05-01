'use client';

import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from './client';
import type { Profile, MasterProfile, MasterSubscription } from '@/types/database';

interface MasterContextValue {
  user: User | null;
  profile: Profile | null;
  masterProfile: MasterProfile | null;
  subscription: MasterSubscription | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const MasterContext = createContext<MasterContextValue>({
  user: null,
  profile: null,
  masterProfile: null,
  subscription: null,
  isLoading: false, // false — компоненти поза MasterProvider не блокуються вічним спінером
  refresh: async () => {},
});

export function useMasterContext() {
  return useContext(MasterContext);
}

interface MasterProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
  initialProfile?: Profile | null;
  initialMasterProfile?: MasterProfile | null;
  initialSubscription?: MasterSubscription | null;
}

export function MasterProvider({ children, initialUser, initialProfile, initialMasterProfile }: MasterProviderProps) {
  // Single stable client instance — created once per component mount, no leaks on re-renders
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(initialMasterProfile ?? null);
  const [subscription, setSubscription] = useState<MasterSubscription | null>(null);
  // isLoading=false одразу якщо сервер передав дані — хуки запускаються без затримки
  const [isLoading, setIsLoading] = useState(!initialUser);

  // Guard against setState after unmount
  const mountedRef = useRef(true);
  // Якщо сервер надав initial data — пропускаємо зайвий fetchProfile на INITIAL_SESSION
  const hasInitialData = useRef(!!initialUser);

  const fetchProfile = useCallback(async (userId: string) => {
    const [{ data: p, error: pErr }, { data: mp, error: mpErr }, { data: sub, error: subErr }] = await Promise.all([
      supabase.from('profiles').select('id, role, full_name, phone, email, avatar_url, telegram_chat_id, created_at, updated_at').eq('id', userId).single(),
      supabase.from('master_profiles').select('id, slug, business_name, bio, categories, mood_theme, accent_color, subscription_tier, subscription_expires_at, commission_rate, rating, rating_count, is_published, address, city, latitude, longitude, floor, cabinet, instagram_url, telegram_url, telegram_chat_id, avatar_emoji, has_seen_tour, seen_tours, pricing_rules, working_hours, timezone, referral_code, referred_by, retention_cycle_days, dynamic_pricing_extra_earned, c2c_enabled, c2c_discount_pct, created_at, updated_at').eq('id', userId).single(),
      supabase.rpc('get_my_subscription').maybeSingle(),
    ]);

    if (!mountedRef.current) return;

    if (pErr || mpErr) {
      console.warn('[MasterContext] fetchProfile error (keeping existing state):',
        pErr?.message ?? mpErr?.message);
      return;
    }

    setProfile(p ?? null);
    setMasterProfile(mp ?? null);
    setSubscription(sub as MasterSubscription ?? null);
  }, [supabase]);

  const refresh = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // Відстежуємо час переходу в фон для visibility recovery
  const lastHiddenAt = useRef(0);
  // Safety timeout: якщо isLoading залишився true > 8с — знімаємо примусово
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    // --- Safety timeout: запобігає вічному спінеру у найгіршому випадку ---
    if (isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && isLoading) {
          console.warn('[MasterContext] isLoading застряг > 8с — примусове зняття');
          setIsLoading(false);
        }
      }, 8_000);
    }

    // onAuthStateChange fires INITIAL_SESSION synchronously on subscribe,
    // so we get the session in the first event without a separate getUser() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!mountedRef.current) return;

      // Якщо сервер вже надав свіжі дані — INITIAL_SESSION є дублем, пропускаємо fetchProfile
      if (event === 'INITIAL_SESSION' && hasInitialData.current) {
        hasInitialData.current = false;
        const u = session?.user ?? null;
        setUser(u); // оновлюємо user на випадок refresh токена між SSR і гідратацією
        if (mountedRef.current) setIsLoading(false);
        return;
      }

      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // КРИТИЧНО: fetchProfile → supabase.from().select() → getSession() → _acquireLock.
        // Цей callback викликається з _notifyAllSubscribers всередині _recoverAndRefresh()
        // під активним auth lock (lockAcquired = true).
        // await fetchProfile тут = циклічний deadlock назавжди:
        //   lock чекає на наш callback → callback чекає на lock.
        // setTimeout(0) переносить fetchProfile в наступний macrotask —
        // ПІСЛЯ того як lock звільниться (після _recoverAndRefresh → finally lockAcquired=false).
        if (mountedRef.current) setIsLoading(false);
        setTimeout(() => { if (mountedRef.current) fetchProfile(u.id); }, 0);
        return;
      } else {
        setProfile(null);
        setMasterProfile(null);
      }
      if (mountedRef.current) setIsLoading(false);
    });

    lastHiddenAt.current = Date.now();

    // --- Visibility recovery: оновлюємо профіль після тривалого фону ---
    function handleVisibilityChange() {
      if (document.hidden) {
        lastHiddenAt.current = Date.now();
        return;
      }
      const gap = Date.now() - lastHiddenAt.current;
      // Після 2+ хв у фоні — оновлюємо профіль (дані могли застаріти)
      if (gap > 120_000 && user) {
        fetchProfile(user.id);
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [supabase, fetchProfile]);

  const contextValue = useMemo(
    () => ({ user, profile, masterProfile, subscription, isLoading, refresh }),
    [user, profile, masterProfile, subscription, isLoading, refresh]
  );

  return (
    <MasterContext.Provider value={contextValue}>
      {children}
    </MasterContext.Provider>
  );
}
