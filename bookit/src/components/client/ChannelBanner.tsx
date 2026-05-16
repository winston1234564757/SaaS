'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface Props {
  userId: string;
  hasTelegram: boolean;
  hasPush: boolean;
  botName: string;
}

export function ChannelBanner({ userId, hasTelegram, hasPush, botName }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [tgOpened, setTgOpened] = useState(false);
  const [pushState, setPushState] = useState<'idle' | 'loading' | 'done'>('idle');

  const allConnected = (hasTelegram || tgOpened) && (hasPush || pushState === 'done');

  if (dismissed || (hasTelegram && hasPush)) return null;

  async function handlePush() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    setPushState('loading');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setPushState('idle'); return; }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) { setPushState('done'); return; }
      const pad = '='.repeat((4 - key.length % 4) % 4);
      const b64 = (key + pad).replace(/-/g, '+').replace(/_/g, '/');
      const raw = atob(b64);
      const buf = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: buf });
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      setPushState('done');
    } catch {
      setPushState('idle');
    }
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="w-full"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(232,208,200,0.6)' }}
        >
          <div className="max-w-lg mx-auto px-4 py-3 flex items-start gap-3">
            <span className="text-lg shrink-0 mt-0.5">🔔</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground mb-1.5">
                {allConnected ? 'Сповіщення підключено!' : 'Підключи сповіщення'}
              </p>
              <div className="flex flex-wrap gap-2">
                {!hasTelegram && botName && (
                  <a
                    href={`https://t.me/${botName}?start=${userId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setTgOpened(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                    style={{ background: tgOpened ? 'rgba(120,154,153,0.15)' : '#229ED9', color: tgOpened ? '#789A99' : '#fff' }}
                  >
                    ✈️ {tgOpened ? 'TG відкрито ✓' : 'Telegram'}
                  </a>
                )}
                {!hasPush && pushState !== 'done' && (
                  <button
                    type="button"
                    onClick={handlePush}
                    disabled={pushState === 'loading'}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-semibold active:scale-95 transition-all disabled:opacity-60"
                  >
                    {pushState === 'loading' ? <Loader2 size={10} className="animate-spin" /> : '🔔'}
                    {pushState === 'loading' ? 'Підключаємо...' : 'Push'}
                  </button>
                )}
                {(hasPush || pushState === 'done') && !hasTelegram && (
                  <span className="text-[11px] text-primary font-medium self-center">Push ✓</span>
                )}
                {(hasTelegram || tgOpened) && !hasPush && pushState !== 'done' && (
                  <span className="text-[11px] text-primary font-medium self-center">TG ✓</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="shrink-0 p-1 rounded-lg text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
