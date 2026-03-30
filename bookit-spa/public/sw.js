// Bookit Service Worker (Vite SPA)
// Стратегії: Static → Cache First | Dashboard → Network First | API → Network Only
// BUMP версію при кожному деплої щоб примусово очистити старий кеш

const CACHE_VERSION = 'v1';
const CACHE_NAME = `bookit-${CACHE_VERSION}`;
const STATIC_CACHE = `bookit-static-${CACHE_VERSION}`;

// Ресурси для попереднього кешування
const PRECACHE_URLS = [
  '/',
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

  // API запити та Supabase — завжди мережа (Network Only)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    return;
  }

  // Статичні ресурси Vite — Cache First
  if (url.pathname.startsWith('/assets/')) {
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

  // Dashboard та клієнтський портал — Network First (свіжі дані)
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/my/')) {
    event.respondWith(networkFirst(request, CACHE_NAME));
    return;
  }

  // Публічні сторінки — Network First з fallback
  event.respondWith(networkFirst(request, CACHE_NAME));
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

async function networkFirst(request, cacheName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timeoutId);
    const cached = await caches.match(request);
    if (cached) return cached;
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
