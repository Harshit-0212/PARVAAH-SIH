const CACHE_NAME = 'parvaah-app-shell-v1';
const OFFLINE_URL = '/offline.html';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or non-http requests (e.g. chrome-extension)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Never cache API keys, private tokens, or administrative endpoints
  if (url.pathname.includes('/auth') || url.pathname.includes('/admin') || url.search.includes('key=')) {
    return;
  }

  // Strategy A: HTML navigation - Network first, fallback to cached shell / offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match(OFFLINE_URL);
          return offlinePage || new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // Strategy B: API GET endpoints - Network-first with Cache Fallback for safe public endpoints
  if (url.pathname.startsWith('/api/v1/')) {
    // Only cache safe GET endpoints
    const isSafeEndpoint = 
      url.pathname.includes('/incidents') ||
      url.pathname.includes('/scenarios') ||
      url.pathname.includes('/telemetry') ||
      url.pathname.includes('/risk-zones') ||
      url.pathname.includes('/health');

    if (isSafeEndpoint) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(async () => {
            const cached = await caches.match(request);
            if (cached) return cached;
            return new Response(JSON.stringify({ error: 'Offline', isOfflineCached: true }), {
              headers: { 'Content-Type': 'application/json' },
              status: 200
            });
          })
      );
      return;
    }
  }

  // Strategy C: Static Assets (JS, CSS, Images, Fonts) - Cache-first with Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {/* ignore background fetch errors */});
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (response.ok && (url.origin === location.origin || url.hostname.includes('tile.openstreetmap.org'))) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
