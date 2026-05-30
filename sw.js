/*
 * Honed.tea service worker.
 *
 * Two jobs:
 *   1. Offline-first shell cache (so the app loads with no network).
 *   2. Surface timer notifications through the OS, not the tab. The page
 *      triggers `registration.showNotification(...)` when an alarm fires.
 *      We also handle clicks to focus the existing PWA window.
 *
 * No scheduling is done here. The page stays alive during a brew (Wake Lock),
 * so the alarm always fires from page JS. The SW only RENDERS the notification.
 *
 * Cache name is versioned manually. Bump SHELL_CACHE when shipping changes to
 * any precached asset so old clients pick up the new build.
 */

const SHELL_CACHE  = 'honed-tea-shell-v1';
const FONTS_CACHE  = 'honed-tea-fonts-v1';

// Same-origin shell assets. Paths are relative to the SW's scope (the project root).
const SHELL_ASSETS = [
  './',
  'index.html',
  'favicon.png',
  'manifest.webmanifest',
];

// ---------- INSTALL: precache the shell ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_ASSETS))
  );
  // Activate immediately so the new SW takes over without waiting for old tabs to close.
  self.skipWaiting();
});

// ---------- ACTIVATE: drop old caches, claim clients ----------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, FONTS_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.map(n => keep.has(n) ? null : caches.delete(n)));
    await self.clients.claim();
  })());
});

// ---------- FETCH: cache strategies ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (sameOrigin) {
    // Cache-first for the shell. Falls back to network for anything not precached.
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        // Only cache successful basic responses to avoid poisoning the cache.
        if (res && res.ok && res.type === 'basic') {
          const cache = await caches.open(SHELL_CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        // Offline and not cached: nothing we can do.
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })());
    return;
  }

  if (isFont) {
    // Stale-while-revalidate for Google Fonts (opaque responses are fine to cache).
    event.respondWith((async () => {
      const cache = await caches.open(FONTS_CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }

  // Anything else (third-party): default browser behavior.
});

// ---------- NOTIFICATION CLICK: focus or open the app ----------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of all) {
      // Match by scope so we focus our own PWA window, not some random tab.
      if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
        return client.focus();
      }
    }
    if (self.clients.openWindow) {
      return self.clients.openWindow('./');
    }
  })());
});
