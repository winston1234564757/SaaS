'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { TelegramWelcome } from '@/components/telegram/TelegramWelcome';
import { LandingPageContent } from '@/components/landing/LandingPageContent';
import { BeautyLoader } from '@/components/shared/BeautyLoader';
import { createClient } from '@/lib/supabase/client';

export function RootPageClient() {
  const { isAuthenticated, isTMA, isReady } = useTelegram();
  const supabase = createClient();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);

  // If we are not ready yet, we let TelegramProvider show its own loader
  if (!isReady) return null;

  // In Telegram environment, we have a specialized flow
  if (isTMA) {
    if (!isAuthenticated || isVerifying) {
      return (
        <div className="bg-[#FFE8DC] min-h-screen">
          {isVerifying ? (
            <BeautyLoader message="Синхронізація сесії..." />
          ) : (
            <TelegramWelcome onSuccess={async (payload) => {
              if (payload.token && payload.email) {
                setIsVerifying(true);
                try {
                  const { error } = await supabase.auth.verifyOtp({
                    email: payload.email,
                    token: payload.token,
                    type: 'email',
                  });
                  if (error) throw error;
                  
                  // BRUTE FORCE: Immediate hard redirect.
                  // We ignore all other state management and just force the browser to /dashboard.
                  window.location.href = '/dashboard';
                } catch (e) {
                  console.error('Verify error:', e);
                  setIsVerifying(false);
                }
              }
            }} />
          )}
        </div>
      );
    }
    
    // Fallback loader while waiting for hard redirect to kick in
    return (
      <div className="bg-[#FFE8DC] min-h-screen">
        <BeautyLoader message="Вхід до кабінету..." />
      </div>
    );
  }

  // Standard web browser flow
  return <LandingPageContent />;
}
