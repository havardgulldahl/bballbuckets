// sw.js
const APP_VERSION = 'v1.0.0'; // bump on each deploy to invalidate caches
const APP_CACHE = `app-shell-${APP_VERSION}`;
const RUNTIME_CACHE = `runtime-${APP_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './db.js',
  './manifest.webmanifest',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => {
        if (k !== APP_CACHE && k !== RUNTIME_CACHE) return caches.delete(k);
      }));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Navigation requests: App Shell fallback
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Handle same-origin requests
  if (url.origin === self.location.origin) {
    // HTML navigations -> App shell (Network falling back to cache, then offline fallback)
    if (req.mode === 'navigate') {
      event.respondWith(
        (async () => {
          try {
            const net = await fetch(req);
            return net;
          } catch {
            const cached = await caches.match('./index.html');
            return cached || new Response('Offline', { status: 503 });
          }
        })()
      );
      return;
    }

    // Static assets: Stale-while-revalidate
    const isStatic = /\.(?:js|css|woff2?|png|jpg|svg|webp|json)$/.test(url.pathname);
    if (isStatic) {
      event.respondWith(staleWhileRevalidate(req));
      return;
    }
  }

  // Cross-origin: try network, fall back to cache if previously stored
  event.respondWith(networkFirst(req));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => undefined);
  return cached || fetchPromise || new Response('Offline', { status: 503 });
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}
