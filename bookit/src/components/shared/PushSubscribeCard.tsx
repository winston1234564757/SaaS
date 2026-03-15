'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

type State = 'idle' | 'subscribing' | 'subscribed' | 'denied' | 'unsupported';

export function PushSubscribeCard() {
  const [state, setState] = useState<State>('idle');
  const supabase = createClient();

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
      if (permission !== 'granted') { setState('denied'); return; }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { setState('subscribed'); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: sub.endpoint,
          subscription: sub.toJSON(),
        }, { onConflict: 'endpoint' });
      }
      setState('subscribed');
    } catch {
      setState('denied');
    }
  }

  if (state === 'denied') {
    return (
      <div className="bento-card p-4 flex items-center gap-3">
        <BellOff size={18} className="text-[#A8928D] flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-[#2C1A14]">Сповіщення вимкнені</p>
          <p className="text-[10px] text-[#A8928D]">Увімкни в налаштуваннях браузера</p>
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
      <div className="w-9 h-9 rounded-2xl bg-[#789A99]/15 flex items-center justify-center flex-shrink-0">
        {state === 'subscribing'
          ? <div className="w-4 h-4 rounded-full border-2 border-[#789A99] border-t-transparent animate-spin" />
          : <Bell size={18} className="text-[#789A99]" />
        }
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#2C1A14]">Увімкнути сповіщення</p>
        <p className="text-xs text-[#A8928D]">Нові записи, нагадування, флеш-акції</p>
      </div>
      <div className="w-8 h-5 rounded-full bg-[#E8D5CF] flex-shrink-0">
        <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
      </div>
    </button>
  );
}
