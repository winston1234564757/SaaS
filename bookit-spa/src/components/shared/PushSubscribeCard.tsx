import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

type State = 'idle' | 'subscribing' | 'subscribed' | 'denied' | 'unsupported' | 'error';

export function PushSubscribeCard() {
  const [state, setState] = useState<State>('idle');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'granted') setState('subscribed');
    if (Notification.permission === 'denied') setState('denied');
  }, []);

  if (state === 'unsupported' || state === 'subscribed') return null;

  async function subscribe() {
    setState('subscribing');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return;
      }

      let reg = await navigator.serviceWorker.register('/sw.js');

      // Таймаут для ServiceWorker (5 сек)
      const readyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('SW_TIMEOUT')), 5000));
      reg = await Promise.race([readyPromise, timeoutPromise]);

      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('MISSING_KEY');

      // Таймаут для PushManager (10 сек - блокує Opera/Brave)
      const subPromise = reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const pushTimeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('PUSH_TIMEOUT')), 5000));
      const sub = await Promise.race([subPromise, pushTimeout]);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('push_subscriptions').upsert({
          user_id: session.user.id,
          endpoint: sub.endpoint,
          subscription: sub.toJSON() as any,
        }, { onConflict: 'endpoint' });
      }

      setState('subscribed');
    } catch (error) {
      console.error('[Push] Subscribe flow failed:', error);
      setState('error');
    }
  }

  if (state === 'denied' || state === 'error') {
    return (
      <div className="bento-card p-4 flex items-start gap-3 bg-[#FFF5F5] border border-[#FFE5E5]">
        <BellOff size={18} className="text-[#D9534F] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#2C1A14]">Сповіщення заблоковано</p>
          <p className="text-xs text-[#A8928D] mt-1 leading-relaxed">
            Ваш браузер блокує цю функцію. Для найкращого досвіду та роботи сповіщень рекомендуємо{' '}
            <a
              href="https://www.google.com/chrome/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#789A99] font-medium underline underline-offset-2"
            >
              завантажити Google Chrome
            </a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={state === 'subscribing'}
      className="bento-card p-4 flex items-center gap-3 w-full text-left active:scale-[0.98] transition-transform"
    >
      <div className="w-9 h-9 rounded-2xl bg-[#789A99]/15 flex items-center justify-center shrink-0">
        {state === 'subscribing'
          ? <div className="w-4 h-4 rounded-full border-2 border-[#789A99] border-t-transparent animate-spin" />
          : <Bell size={18} className="text-[#789A99]" />
        }
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#2C1A14]">Увімкнути сповіщення</p>
        <p className="text-xs text-[#A8928D]">Нові записи, нагадування, флеш-акції</p>
      </div>
      <div className="w-8 h-5 rounded-full bg-[#E8D5CF] shrink-0">
        <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
      </div>
    </button>
  );
}
