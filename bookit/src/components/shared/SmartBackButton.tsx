'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface Props {
  /** Renders as fixed floating circle in top-left corner (for layouts without a header) */
  floating?: boolean;
  className?: string;
}

export function SmartBackButton({ floating, className }: Props) {
  const [canGoBack, setCanGoBack] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fromOurSite =
      document.referrer !== '' &&
      (() => {
        try {
          return new URL(document.referrer).hostname === window.location.hostname;
        } catch {
          return false;
        }
      })();
    setCanGoBack(window.history.length > 2 && fromOurSite);
  }, []);

  if (!canGoBack) return null;

  if (floating) {
    return (
      <button
        onClick={() => router.back()}
        aria-label="Назад"
        className="fixed z-40 flex items-center gap-1 pl-2 pr-3 h-8 rounded-full bg-white/60 backdrop-blur-md border border-white/70 shadow-sm text-[#2C1A14] text-xs font-medium active:scale-95 transition-all"
        style={{ top: 'calc(env(safe-area-inset-top) + 12px)', left: '16px' }}
      >
        <ChevronLeft size={15} strokeWidth={2.5} />
        Назад
      </button>
    );
  }

  return (
    <button
      onClick={() => router.back()}
      aria-label="Назад"
      className={`flex items-center justify-center w-9 h-9 rounded-xl text-[#2C1A14] hover:bg-black/5 active:scale-95 transition-all ${className ?? ''}`}
    >
      <ChevronLeft size={22} strokeWidth={2} />
    </button>
  );
}
