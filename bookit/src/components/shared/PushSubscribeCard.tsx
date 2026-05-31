'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Loader2, BellOff, Smartphone, RefreshCw } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

type State =
  | 'checking'
  | 'prompt'
  | 'subscribing'
  | 'subscribed'
  | 'blocked'
  | 'pwa-hint'
  | 'unsupported';

function detectInitialState(): State {
  if (typeof window === 'undefined') return 'checking';

  const hasPush =
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);

  if (!hasPush) {
    if (isIOS && !isStandalone) return 'pwa-hint';
    return 'unsupported';
  }

  if (Notification.permission === 'granted') return 'subscribed';
  if (Notification.permission === 'denied') return 'blocked';

  return 'prompt';
}

interface Props {
  userRole?: 'master' | 'client';
}

export function PushSubscribeCard({ userRole = 'master' }: Props) {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    const initialState = detectInitialState();
    setState(initialState);
    if (initialState === 'subscribed') {
      syncSubscriptionSilently();
    }
  }, [userRole]);

  async function syncSubscriptionSilently() {
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sub.toJSON(), role: userRole }),
      });
    } catch (err) {
      console.error('[Push] Silent sync failed:', err);
    }
  }

  async function subscribe() {
    setState('subscribing');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('blocked');
        return;
      }

      await navigator.serviceWorker.register('/sw.js');

      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SW_TIMEOUT')), 8000)
        ),
      ]);

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY missing');
        setState('prompt');
        return;
      }

      const sub = await Promise.race([
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PUSH_TIMEOUT')), 8000)
        ),
      ]);

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sub.toJSON(), role: userRole }),
      });

      if (!res.ok) {
        console.error('[Push] API error:', res.status);
        setState('prompt');
        return;
      }

      const json = await res.json() as { ok: boolean; push_sent?: boolean };
      console.log('[Push] Subscribe API response:', json);
      if (!json.push_sent) {
        console.warn('[Push] Subscription saved but welcome push was NOT sent — check Vercel logs (VAPID keys?)');
      }

      setState('subscribed');
    } catch (err) {
      console.error('[Push] Subscribe failed:', err);
      setState('prompt');
    }
  }

  const isMaster = userRole === 'master';

  return (
    <AnimatePresence mode="popLayout">

      {state === 'checking' && null}

      {state === 'subscribed' && (
        <motion.div key="subscribed"
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="bento-card p-4 flex items-center gap-3"
        >
          <div className="size-9 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} className="text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold text-success">Сповіщення підключені</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {isMaster
                ? 'Нові записи та нагадування — миттєво'
                : 'Нагадування про записи та акції від майстрів'}
            </p>
          </div>
        </motion.div>
      )}

      {(state === 'prompt' || state === 'subscribing') && (
        <motion.button key="prompt"
          type="button"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={subscribe}
          disabled={state === 'subscribing'}
          className="bento-card p-4 flex items-center gap-3 w-full text-left active:scale-[0.98] transition-transform disabled:opacity-70"
        >
          <div className="size-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            {state === 'subscribing'
              ? <Loader2 size={18} className="text-primary animate-spin" />
              : <Bell size={18} className="text-primary" />
            }
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Увімкнути сповіщення</p>
            <p className="text-xs text-muted-foreground/60">
              {state === 'subscribing'
                ? 'Підключаємо...'
                : isMaster
                  ? 'Нові записи, нагадування, флеш-акції'
                  : 'Нагадування про записи та пропозиції майстрів'}
            </p>
          </div>
          <div className="w-8 h-5 rounded-full bg-secondary/80 relative shrink-0">
            <div className="absolute top-0 left-0 size-5 rounded-full bg-accent-on" />
          </div>
        </motion.button>
      )}

      {state === 'blocked' && (
        <motion.div key="blocked"
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="bento-card p-4 flex items-start gap-3"
        >
          <div className="size-9 rounded-lg bg-warning/12 flex items-center justify-center shrink-0">
            <BellOff size={18} className="text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Сповіщення заблоковані</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed">
              Відкрий <span className="font-medium text-foreground">Налаштування браузера → Сайти → Сповіщення</span> і дозволь для bookit.com.ua
            </p>
            <button
              type="button"
              onClick={() => { setState('prompt'); }}
              className="mt-2 flex items-center gap-1 text-[11px] text-primary font-medium"
            >
              <RefreshCw size={11} /> Спробувати знову
            </button>
          </div>
        </motion.div>
      )}

      {state === 'pwa-hint' && (
        <motion.div key="pwa-hint"
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="bento-card p-4 flex items-start gap-3"
        >
          <div className="size-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Smartphone size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Додай BookIT на головний екран</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed">
              Натисни <span className="font-medium text-foreground">⎋ → «На початковий екран»</span> — після цього Push-сповіщення запрацюють
            </p>
          </div>
        </motion.div>
      )}

      {state === 'unsupported' && (
        <motion.div key="unsupported"
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="bento-card p-4 flex items-start gap-3"
        >
          <div className="size-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Bell size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Оновіть браузер для сповіщень</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Використай Chrome або Firefox — вони підтримують Push-сповіщення
            </p>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
