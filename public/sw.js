// Bump this value to force clients to install a fresh service worker
const CACHE_NAME = 'bobs-fallometer-v9';
const APP_BASE_PATH = self.location.pathname.replace(/[^/]+$/, '');
const toAppPath = (path) => `${APP_BASE_PATH}${path}`;
const INDEX_URL = toAppPath('index.html');
const LOGO_URL = toAppPath('logo.jpeg');
const RATING_ICON_FILES = ['b', 'b2', 'c', 'c2', 'g', 'g2', 'p', 'p2', 'q', 'q2', 's', 's2', 'u', 'u2', 'v', 'v_2'];
const RATING_ICON_ASSETS = RATING_ICON_FILES.map((fileName) => toAppPath(`rating-icons/${fileName}.svg`));
const CORE_ASSETS = [
  toAppPath(''),
  INDEX_URL,
  toAppPath('manifest.webmanifest'),
  toAppPath('header.jpeg'),
  LOGO_URL,
  ...RATING_ICON_ASSETS,
];

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
          cache.put(INDEX_URL, response.clone());
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(INDEX_URL);
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
          const fallbackImage = await caches.match(LOGO_URL);
          if (fallbackImage) return fallbackImage;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    }),
  );
});
