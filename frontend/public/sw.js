/*
 * Контур Связи — service worker.
 * Стратегия:
 *   - /api/*, /socket.io/*, /uploads/* — всегда сеть, без кэша;
 *   - навигационные запросы — network-first с фоллбэком на кэш index.html;
 *   - остальные GET — stale-while-revalidate.
 */

const VERSION = 'kontur-v1';
const APP_SHELL_CACHE = `kontur-shell-${VERSION}`;
const RUNTIME_CACHE   = `kontur-runtime-${VERSION}`;
const APP_SHELL_URLS  = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k !== APP_SHELL_CACHE && k !== RUNTIME_CACHE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isNetworkOnly(url) {
  return url.pathname.startsWith('/api/')
      || url.pathname.startsWith('/socket.io/')
      || url.pathname.startsWith('/uploads/');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (isNetworkOnly(url)) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put('/index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || Response.error()))
    );
    return;
  }

  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        }).catch(() => cached || Response.error());
        return cached || network;
      })
    )
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data ? event.data.text() : '' }; }
  const title = payload.title || 'Контур Связи';
  const options = {
    body:  payload.body  || '',
    icon:  payload.icon  || '/icon.svg',
    badge: payload.badge || '/icon.svg',
    data:  payload.data  || {},
    tag:   payload.tag   || undefined,
    renotify: Boolean(payload.renotify)
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate?.(url).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
