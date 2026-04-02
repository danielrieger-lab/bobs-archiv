const CACHE_NAME = 'bobs-fallometer-v2';
const CORE_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/logo.jpeg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(keys.map((key) => (key === CACHE_NAME ? Promise.resolve() : caches.delete(key))));
    }),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (!isSameOrigin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          const cache = await caches.open(CACHE_NAME);
          cache.put('/index.html', response.clone());
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match('/index.html');
          return cachedPage || new Response('Offline', { status: 503, statusText: 'Offline' });
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) return cached;

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch {
        if (event.request.destination === 'image') {
          const fallbackImage = await caches.match('/logo.jpeg');
          if (fallbackImage) return fallbackImage;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    }),
  );
});
