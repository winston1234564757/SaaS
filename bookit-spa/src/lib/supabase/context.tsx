import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from './client';
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
  isLoading: true,
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
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(initialMasterProfile ?? null);
  const [isLoading, setIsLoading] = useState(true);

  // Guard against setState after unmount
  const mountedRef = useRef(true);

  async function fetchProfile(userId: string) {
    try {
      const [{ data: p }, { data: mp }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('master_profiles').select('*').eq('id', userId).single(),
      ]);

      if (!mountedRef.current) return;
      setProfile(p ?? null);
      setMasterProfile(mp ?? null);
    } catch {
      if (!mountedRef.current) return;
      setProfile(null);
      setMasterProfile(null);
    }
  }

  const refresh = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;

    // Ініціалізація: getSession() читає з localStorage миттєво — не залежить від мережі.
    // Це гарантує, що isLoading знімається навіть якщо onAuthStateChange з якоїсь причини
    // не вистрілить INITIAL_SESSION (баг в Supabase JS v2.x з деякими конфігураціями).
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mountedRef.current) return;
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

    // onAuthStateChange — тільки для подій після початкової ініціалізації
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!mountedRef.current) return;
      // INITIAL_SESSION вже оброблений через getSession() вище — пропускаємо
      if (event === 'INITIAL_SESSION') return;

      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchProfile(u.id);
      } else {
        setProfile(null);
        setMasterProfile(null);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
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
