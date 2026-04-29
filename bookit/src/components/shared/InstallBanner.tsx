'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('pwa-banner-dismissed')) return;

    // iOS detection (no beforeinstallprompt, but can still guide)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (ios) { setIsIOS(true); setShow(true); return; }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem('pwa-banner-dismissed', '1');
    setShow(false);
    setDismissed(true);
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setShow(false);
  }

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-[88px] left-2 right-2 z-30 lg:hidden pointer-events-none">
      <div
        className="rounded-[24px] px-5 py-4 flex items-center gap-4 bg-primary/95 backdrop-blur-xl border border-white/20 shadow-lg pointer-events-auto"
      >
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-lg">
          💅
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white">Встанови Bookit</p>
          <p className="text-xs text-white/80 leading-tight">
            {isIOS
              ? 'Натисни Share → «На екран Домівки»'
              : 'Швидкий доступ прямо з екрану'
            }
          </p>
        </div>
        {!isIOS && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 bg-white text-primary/90 text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0 active:scale-95 transition-all"
          >
            <Download size={12} />
            Додати
          </button>
        )}
        <button onClick={dismiss} className="text-white/70 flex-shrink-0 ml-1 active:scale-95 transition-all">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
