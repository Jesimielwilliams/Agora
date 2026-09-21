/**
 * AGORA LENS - SERVICE WORKER
 * Caches the app shell for offline/repeat-visit loading. Only takes effect when the
 * app is served over http(s) — service workers can't register on file:// pages, so
 * this has no effect (and does no harm) if Index.html is opened directly as a file.
 */

const CACHE_NAME = 'agora-lens-v9';

const APP_SHELL = [
  './Index.html',
  './css/design-system.css',
  './css/layout.css',
  './css/map.css',
  './css/components.css',
  './css/responsive.css',
  './js/theme.js',
  './js/i18n.js',
  './js/config.js',
  './js/nigeria-states-geo.js',
  './js/nigeria-jurisdictions.js',
  './js/data.js',
  './js/data-loader.js',
  './js/map.js',
  './js/alerts.js',
  './js/incidents.js',
  './js/reporting.js',
  './js/notifications.js',
  './js/outcomes.js',
  './js/trends.js',
  './js/hotspots.js',
  './js/app.js',
  './Assets/icons/icon-192.png',
  './Assets/icons/icon-512.png',
  './Assets/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // Cached individually rather than via addAll(), which rejects atomically:
      // one bad URL there would abort the whole install and strand the old
      // worker in control indefinitely.
      .then((cache) => Promise.allSettled(
        APP_SHELL.map((url) => cache.add(url).catch((err) => {
          console.warn('[sw] could not precache', url, err);
        }))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Images and icons change rarely, so they're worth serving straight from cache.
const isStaticAsset = (url) => /\.(png|jpe?g|gif|svg|webp|avif|ico|woff2?)$/i.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first for static assets, with a background refresh.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }))
    );
    return;
  }

  // Network-first for markup, styles and scripts. The previous build served
  // these cache-first with no revalidation, so an edited file was never picked
  // up again until the cache version changed by hand. The cache is now only a
  // fallback for when the network is unavailable.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => {
        if (cached) return cached;
        // An offline navigation still gets the app shell.
        if (request.mode === 'navigate') return caches.match('./Index.html');
        return Response.error();
      }))
  );
});
