'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const supabase = createClient();

    const [{ data: p }, { data: mp }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('master_profiles').select('*').eq('id', userId).single(),
    ]);

    setProfile(p ?? null);
    setMasterProfile(mp ?? null);
  }

  async function refresh() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) await fetchProfile(user.id);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchProfile(u.id);
      } else {
        setProfile(null);
        setMasterProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <MasterContext.Provider value={{ user, profile, masterProfile, isLoading, refresh }}>
      {children}
    </MasterContext.Provider>
  );
}
