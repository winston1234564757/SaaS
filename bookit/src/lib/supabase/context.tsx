'use client';

import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from './client';
import type { Profile, MasterProfile } from '@/types/database';

interface MasterContextValue {
  user: User | null;
  profile: Profile | null;
  masterProfile: MasterProfile | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const MasterContext = createContext<MasterContextValue>({
  user: null,
  profile: null,
  masterProfile: null,
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
}

export function MasterProvider({ children, initialUser, initialProfile, initialMasterProfile }: MasterProviderProps) {
  // Single stable client instance — created once per component mount, no leaks on re-renders
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(initialMasterProfile ?? null);
  // isLoading=false одразу якщо сервер передав дані — хуки запускаються без затримки
  const [isLoading, setIsLoading] = useState(!initialUser);

  // Guard against setState after unmount
  const mountedRef = useRef(true);
  // Якщо сервер надав initial data — пропускаємо зайвий fetchProfile на INITIAL_SESSION
  const hasInitialData = useRef(!!initialUser);

  async function fetchProfile(userId: string) {
    const [{ data: p, error: pErr }, { data: mp, error: mpErr }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('master_profiles').select('*').eq('id', userId).single(),
    ]);

    if (!mountedRef.current) return;

    // При будь-якій мережевій помилці (AbortError, timeout, offline) — НЕ обнуляємо стан.
    // Юзер залишається залогіненим, профіль не змінився. Без цього: abort → data:null →
    // setMasterProfile(null) → masterId=undefined → enabled:false на всіх TQ-запитах.
    if (pErr || mpErr) {
      console.warn('[MasterContext] fetchProfile error (keeping existing state):',
        pErr?.message ?? mpErr?.message);
      return;
    }

    setProfile(p ?? null);
    setMasterProfile(mp ?? null);
  }

  const refresh = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user]);

  // Відстежуємо час переходу в фон для visibility recovery
  const lastHiddenAt = useRef(Date.now());
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
        await fetchProfile(u.id);
      } else {
        setProfile(null);
        setMasterProfile(null);
      }
      if (mountedRef.current) setIsLoading(false);
    });

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
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  const contextValue = useMemo(
    () => ({ user, profile, masterProfile, isLoading, refresh }),
    [user, profile, masterProfile, isLoading, refresh]
  );

  return (
    <MasterContext.Provider value={contextValue}>
      {children}
    </MasterContext.Provider>
  );
}
