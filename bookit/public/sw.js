// Bookit Service Worker
// Стратегії: Static → Cache First | API/Navigation/Supabase → Network Only (bypass)
// BUMP версію при кожному деплої щоб примусово очистити старий кеш

const CACHE_VERSION = 'v4';
const CACHE_NAME = `bookit-${CACHE_VERSION}`;
const STATIC_CACHE = `bookit-static-${CACHE_VERSION}`;

// Ресурси для попереднього кешування
const PRECACHE_URLS = [
  '/manifest.json',
  '/icons/192',
  '/icons/512',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {})
    ).then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ігноруємо не-GET запити та chrome-extension
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Крос-оріджин (Supabase REST/Auth, CDN) — browser handles directly.
  // url.pathname.includes('supabase') НЕ працює для external URL!
  // https://xxx.supabase.co/rest/v1/... → pathname=/rest/v1/... (без 'supabase')
  if (url.origin !== self.location.origin) {
    return;
  }

  // Page navigations — browser handles directly (NO respondWith).
  // SW's networkFirst causes permanent hangs if SW is killed in background tab:
  // SW frozen → setTimeout never fires → fetch inside SW hangs → page hangs forever.
  // Bypassing SW for navigation lets the browser use its own robust retry logic.
  if (request.mode === 'navigate') {
    return;
  }

  // Внутрішні API роути — мережа (Network Only)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // RSC / Next.js data fetching — мережа (Network Only)
  if (url.searchParams.has('_rsc') || url.pathname.startsWith('/_next/data/')) {
    return;
  }

  // Статичні ресурси Next.js — Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Зображення та іконки — Cache First
  if (
    request.destination === 'image' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/')
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Всі інші запити — мережа (Network Only, без SW interception)
  // Раніше тут був networkFirst для /dashboard і публічних сторінок,
  // але це викликало вічні зависання якщо SW вбивався у фоні.
});

// ── Стратегії ─────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// ── Web Push ───────────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Bookit', body: event.data.text() };
  }

  const { title = 'Bookit', body = '', bookingId, url: notifUrl } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/192',
      badge: '/icons/192',
      data: { bookingId, url: notifUrl || '/dashboard' },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { bookingId, url } = event.notification.data ?? {};

  const target = bookingId
    ? `/dashboard?bookingId=${bookingId}`
    : (url || '/dashboard');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});
