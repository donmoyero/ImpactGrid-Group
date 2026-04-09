/* ═══════════════════════════════════════════════
   IMPACTGRID — SERVICE WORKER (sw.js)
   Drop this file in your root folder alongside index.html
═══════════════════════════════════════════════ */

const CACHE_NAME = 'impactgrid-v1';

/* All the core files to cache for offline use */
const CORE_FILES = [
  '/',
  '/index.html',
  '/creator-studio.html',
  '/shared.css',
  '/creator-studio.css',
  '/creator-studio.js',
  '/creator-ai.js',
  '/nav.js',
  '/manifest.json',
  '/logo.png',
  '/dijo-mascot.png',
  '/Earth.png',
  '/login.html',
  '/join.html',
  '/settings.html',
  '/jobs.html',
  '/dijo.html',
  '/about.html',
  '/privacy.html',
  '/terms.html'
];

/* ── Install: cache all core files ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_FILES);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── Activate: clear old caches ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: serve from cache, fall back to network ── */
self.addEventListener('fetch', function(event) {

  /* Skip non-GET and cross-origin API calls (Supabase, Anthropic, etc.) */
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('anthropic.com')) return;
  if (event.request.url.includes('onrender.com')) return;
  if (event.request.url.includes('graph.facebook.com')) return;
  if (event.request.url.includes('api.tiktok.com')) return;
  if (event.request.url.includes('googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;

      /* Not in cache — fetch from network and cache it */
      return fetch(event.request).then(function(response) {
        /* Only cache valid responses */
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(function() {
        /* Offline fallback — serve creator-studio if page can't load */
        if (event.request.destination === 'document') {
          return caches.match('/creator-studio.html');
        }
      });
    })
  );
});

/* ── Background sync: retry failed actions when back online ── */
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-content') {
    event.waitUntil(syncContent());
  }
});

function syncContent() {
  return Promise.resolve();
}

/* ── Push notifications (ready for future use) ── */
self.addEventListener('push', function(event) {
  var data = event.data ? event.data.json() : {};
  var title = data.title || 'ImpactGrid';
  var options = {
    body: data.body || 'You have a new update',
    icon: '/logo.png',
    badge: '/dijo-mascot.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/creator-studio.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Notification click: open the app ── */
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/creator-studio.html')
  );
});
