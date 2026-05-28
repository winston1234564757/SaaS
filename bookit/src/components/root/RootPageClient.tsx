'use client';

import React, { useState } from 'react';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { TelegramWelcome, type TelegramLinkSuccessPayload } from '@/components/telegram/TelegramWelcome';
import { LandingPageContent } from '@/components/landing/LandingPageContent';
import { BeautyLoader } from '@/components/shared/BeautyLoader';
import { createClient } from '@/lib/supabase/client';

function targetForRole(role: string | null | undefined): string {
  return role === 'master' ? '/dashboard' : '/my/bookings';
}

export function RootPageClient() {
  const { isAuthenticated, isTMA, isReady } = useTelegram();
  const supabase = createClient();
  const [isVerifying, setIsVerifying] = useState(false);

  // Provider owns the loading UI before init completes.
  // min-h-dvh prevents CLS when provider resolves and landing page mounts.
  if (!isReady) return <div className="min-h-dvh" />;

  // ── Telegram Mini App flow ──────────────────────────────────────────────────
  if (isTMA) {
    // Already authenticated → provider's redirect effect is taking us to /dashboard
    // or /my/bookings. Render a loader as a hard fallback so we NEVER show a blank
    // pixel between "authenticated=true" and "isRedirecting=true".
    if (isAuthenticated || isVerifying) {
      return (
        <div className="bg-background min-h-dvh">
          <BeautyLoader message={isVerifying ? 'Синхронізація сесії...' : 'Вхід до кабінету...'} />
        </div>
      );
    }

    return (
      <div className="bg-background min-h-dvh">
        <TelegramWelcome
          onSuccess={async (payload: TelegramLinkSuccessPayload) => {
            if (!payload.token || !payload.email) return;
            setIsVerifying(true);
            try {
              const { error } = await supabase.auth.verifyOtp({
                email: payload.email,
                token: payload.token,
                type: 'email',
              });
              if (error) throw error;
              // Hard nav inside TMA WebView — full SSR with cookies, proxy.ts handles
              // role-based routing if our hint is missing. Page is unloading; no
              // need to flip isVerifying back.
              window.location.replace(targetForRole(payload.role));
            } catch (e) {
              console.error('[RootPageClient] verifyOtp error:', e);
              setIsVerifying(false);
            }
          }}
        />
      </div>
    );
  }

  // ── Standard web browser flow ───────────────────────────────────────────────
  return <LandingPageContent />;
}
