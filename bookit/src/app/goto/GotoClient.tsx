'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Smartphone } from 'lucide-react';

type DeviceHint = 'ios' | 'android';

export default function GotoClient() {
  const searchParams = useSearchParams();
  const rawUrl = searchParams.get('url') ?? '/';
  // Only allow relative internal paths to prevent open redirect
  const targetUrl = rawUrl.startsWith('/') ? rawUrl : '/';
  const [hint, setHint] = useState<DeviceHint | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (!/Telegram/i.test(ua)) {
      window.location.replace(targetUrl);
      return;
    }
    setHint(/iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'android');
  }, [targetUrl]);

  if (!hint) {
    return <div className="min-h-screen bg-[var(--bg)]" />;
  }

  const isIOS = hint === 'ios';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
      <div className="flex flex-col items-center gap-6 max-w-xs w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center">
          <Smartphone size={26} className="text-accent" />
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-[var(--text)]">
            {isIOS ? 'Відкрити в Safari' : 'Відкрити в Chrome'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {isIOS ? (
              <>
                Натисніть <span className="font-medium text-[var(--text)]">···</span> вгорі →{' '}
                <span className="font-medium text-[var(--text)]">Відкрити в Safari</span>, щоб
                увійти в PWA-додаток
              </>
            ) : (
              <>
                Натисніть <span className="font-medium text-[var(--text)]">⋮</span> вгорі →{' '}
                <span className="font-medium text-[var(--text)]">Відкрити у Chrome</span>, щоб
                увійти в PWA-додаток
              </>
            )}
          </p>
        </div>

        <a
          href={targetUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 rounded-2xl bg-accent text-white text-sm font-medium block"
        >
          Відкрити у браузері
        </a>
      </div>
    </div>
  );
}
