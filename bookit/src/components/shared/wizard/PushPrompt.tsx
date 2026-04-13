'use client';
// src/components/shared/wizard/PushPrompt.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

const PUSH_KEY = 'bookit_push_dismissed';

export function PushPrompt() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
    if (Notification.permission !== 'default') return false;
    return localStorage.getItem(PUSH_KEY) !== '1';
  });
  if (!visible) return null;
  async function handleAllow() {
    setVisible(false);
    try {
      if (await Notification.requestPermission() !== 'granted') return;
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) return;
      const pad = '='.repeat((4 - key.length % 4) % 4);
      const b64 = (key + pad).replace(/-/g, '+').replace(/_/g, '/');
      const raw = atob(b64);
      const buf = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: buf });
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
    } catch { /* push is optional */ }
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl bg-[#789A99]/8 border border-[#789A99]/20">
      <span className="text-xl flex-shrink-0">🔔</span>
      <div className="flex-1">
        <p className="text-xs font-semibold text-[#2C1A14]">Сповіщення про статус запису</p>
        <p className="text-[11px] text-[#A8928D] mt-0.5">Дізнайся першою, коли майстер підтвердить запис</p>
        <div className="flex gap-2 mt-2">
          <button onClick={handleAllow}
            className="px-3 py-1 rounded-lg bg-[#789A99] text-white text-[11px] font-semibold">
            Увімкнути
          </button>
          <button onClick={() => { setVisible(false); localStorage.setItem(PUSH_KEY, '1'); }}
            className="px-3 py-1 text-[#A8928D] text-[11px]">
            Ні, дякую
          </button>
        </div>
      </div>
    </motion.div>
  );
}
