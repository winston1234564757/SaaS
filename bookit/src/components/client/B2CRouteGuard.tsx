'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface Props {
  children: React.ReactNode;
  phone: string | null;
}

export function B2CRouteGuard({ children, phone }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If the user doesn't have a phone and they aren't already on the setup page
    if (!phone && pathname !== '/my/setup/phone') {
      router.replace('/my/setup/phone');
    } else {
      setIsReady(true);
    }
  }, [phone, pathname, router]);

  // ── Bulletproof Phone Guard ──────────────────────────────────────────────
  // Even before the useEffect triggers the router.replace, we MUST NOT render
  // children if the phone is missing and we aren't on the phone setup page.
  // This prevents layout/data "flickers" or leaks.
  if (!phone && pathname !== '/my/setup/phone') {
    return null; 
  }

  if (!isReady) return null;

  return <>{children}</>;
}
