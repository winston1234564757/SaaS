'use client';

import Cookies from 'js-cookie';
import { useMasterContext } from '@/lib/supabase/context';
import { LogOut, ShieldAlert } from 'lucide-react';

export function ImpersonationBanner() {
  const { isImpersonating, masterProfile } = useMasterContext();

  if (!isImpersonating) return null;

  const handleExit = () => {
    Cookies.remove('impersonate_master_id');
    Cookies.remove('view_mode');
    // Force complete reload to flush context memory and go back to admin panel
    window.location.href = '/admin/masters';
  };

  const displayName = masterProfile?.business_name || masterProfile?.slug || 'Майстер';

  return (
    <div className="relative z-[9999] flex w-full items-center justify-between bg-amber-500 px-4 py-2.5 text-xs sm:text-sm font-medium text-amber-950 shadow-md">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 shrink-0 animate-pulse text-amber-900" />
        <span>
          Режим імітації: <strong className="font-semibold">{displayName}</strong>. Дії виконуються від його імені.
        </span>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 rounded-full bg-amber-950/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-950 transition duration-150 hover:bg-amber-950/25 active:scale-[0.95] cursor-pointer"
      >
        <LogOut className="size-3" />
        Вийти
      </button>
    </div>
  );
}
