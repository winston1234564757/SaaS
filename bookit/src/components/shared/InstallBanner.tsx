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
    <div className="fixed bottom-[88px] left-2 right-2 z-30 lg:hidden">
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{
          background: 'rgba(120,154,153,0.95)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(44,26,20,0.18)',
        }}
      >
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-lg">
          💅
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white">Встанови Bookit</p>
          <p className="text-[10px] text-white/80 leading-tight">
            {isIOS
              ? 'Натисни Share → «На екран Домівки»'
              : 'Швидкий доступ прямо з екрану'
            }
          </p>
        </div>
        {!isIOS && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 bg-white text-[#5C7E7D] text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
          >
            <Download size={12} />
            Додати
          </button>
        )}
        <button onClick={dismiss} className="text-white/70 flex-shrink-0 ml-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
