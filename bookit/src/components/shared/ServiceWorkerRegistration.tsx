'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

export function ServiceWorkerRegistration() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Auto-renew push token silently if user has already granted permission
        if (Notification.permission === 'granted' && 'pushManager' in reg) {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidKey) return;

          reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          }).then((sub) => {
            const subStr = JSON.stringify(sub);
            const cached = localStorage.getItem('bookit_push_sub');
            if (cached !== subStr) {
              fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub })
              }).then(res => {
                if (res.ok) localStorage.setItem('bookit_push_sub', subStr);
              }).catch(() => {});
            }
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // iOS PWA: client.navigate() is not supported — SW sends postMessage instead.
  // This listener handles SW_NAVIGATE for all routes (master + client).
  useEffect(() => {
    if (!navigator.serviceWorker) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SW_NAVIGATE' && typeof e.data.url === 'string') {
        router.push(e.data.url);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [router]);

  return null;
}
