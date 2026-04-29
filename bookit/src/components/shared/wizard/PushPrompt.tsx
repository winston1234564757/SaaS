'use client';
// src/components/shared/wizard/PushPrompt.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, CheckCircle2, Loader2 } from 'lucide-react';

const PUSH_KEY = 'bookit_push_dismissed';

type State = 'prompt' | 'loading' | 'subscribed' | 'hidden';

function getInitialState(): State {
  if (typeof window === 'undefined') return 'hidden';
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'hidden';
  if (Notification.permission === 'granted') return 'subscribed';
  if (Notification.permission === 'denied') return 'hidden';
  if (localStorage.getItem(PUSH_KEY) === '1') return 'hidden';
  return 'prompt';
}

export function PushPrompt() {
  const [state, setState] = useState<State>(getInitialState);

  if (state === 'hidden') return null;

  async function handleAllow() {
    setState('loading');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('hidden');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) { setState('subscribed'); return; }
      const pad = '='.repeat((4 - key.length % 4) % 4);
      const b64 = (key + pad).replace(/-/g, '+').replace(/_/g, '/');
      const raw = atob(b64);
      const buf = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: buf });
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      setState('subscribed');
    } catch {
      setState('hidden');
    }
  }

  function handleDismiss() {
    localStorage.setItem(PUSH_KEY, '1');
    setState('hidden');
  }

  return (
    <AnimatePresence mode="wait">
      {state === 'subscribed' ? (
        <motion.div
          key="subscribed"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-success/10 border border-success/25"
        >
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <div>
            <p className="text-xs font-semibold text-success">Сповіщення підключені</p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">Отримуватимеш Push про статус запису</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="prompt"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl bg-primary/8 border border-primary/20"
        >
          <span className="text-xl flex-shrink-0">🔔</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">Сповіщення про статус запису</p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">Дізнайся першою, коли майстер підтвердить запис</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAllow}
                disabled={state === 'loading'}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-white text-[11px] font-semibold disabled:opacity-70 active:scale-95 transition-all"
              >
                {state === 'loading'
                  ? <><Loader2 size={11} className="animate-spin" /> Підключаємо...</>
                  : <><Bell size={11} /> Увімкнути</>
                }
              </button>
              {state !== 'loading' && (
                <button
                  onClick={handleDismiss}
                  className="flex items-center gap-1 px-3 py-1 text-muted-foreground/60 text-[11px] active:scale-95 transition-all"
                >
                  <BellOff size={11} /> Ні, дякую
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
