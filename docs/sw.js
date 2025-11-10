<!-- sw.js -->
const CACHE_VERSION = 'hooptrack-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(response => response || fetch(request).then(fetchRes => {
      const copy = fetchRes.clone();
      caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
      return fetchRes;
    }).catch(() => caches.match('./index.html')))
  );
});
