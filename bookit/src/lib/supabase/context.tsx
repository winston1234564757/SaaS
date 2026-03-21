'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  isLoading: true,
  refresh: async () => {},
});

export function useMasterContext() {
  return useContext(MasterContext);
}

export function MasterProvider({ children }: { children: React.ReactNode }) {
  // Single stable client instance — created once per component mount, no leaks on re-renders
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Guard against setState after unmount
  const mountedRef = useRef(true);

  async function fetchProfile(userId: string) {
    const [{ data: p }, { data: mp }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('master_profiles').select('*').eq('id', userId).single(),
    ]);

    if (!mountedRef.current) return;
    setProfile(p ?? null);
    setMasterProfile(mp ?? null);
  }

  async function refresh() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    mountedRef.current = true;

    // onAuthStateChange fires INITIAL_SESSION synchronously on subscribe,
    // so we get the session in the first event without a separate getUser() call.
    // Using only this handler avoids the double-fetch race between getUser() and
    // INITIAL_SESSION that caused isLoading to toggle and hooks to re-enable.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
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

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <MasterContext.Provider value={{ user, profile, masterProfile, isLoading, refresh }}>
      {children}
    </MasterContext.Provider>
  );
}
