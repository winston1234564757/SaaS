'use client';

import { MasterProvider } from '@/lib/supabase/context';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <MasterProvider>{children}</MasterProvider>;
}
