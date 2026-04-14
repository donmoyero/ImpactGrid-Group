/* ═══════════════════════════════════════════════
   IMPACTGRID — SERVICE WORKER (sw.js)
   v2 — Network-first strategy (always fresh content)
   IMPORTANT: Bump CACHE_NAME on every deploy!
═══════════════════════════════════════════════ */
const CACHE_NAME = 'impactgrid-v2';

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

/* ── Install: pre-cache core files ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      /* Use individual requests so one failure doesn't block the rest */
      return Promise.allSettled(
        CORE_FILES.map(function(url) {
          return cache.add(url).catch(function(e) {
            console.warn('[SW] Could not cache:', url, e.message);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── Activate: wipe all old caches ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: NETWORK FIRST, cache fallback for offline ──
   This is the key fix. Previous version was cache-first
   which caused stale content. Now we always try the
   network first so users always get fresh files.
   Cache is only used when offline.
── */
self.addEventListener('fetch', function(event) {
  /* Only handle GET requests */
  if (event.request.method !== 'GET') return;

  /* Skip external API calls — never cache these */
  var url = event.request.url;
  if (url.includes('supabase.co')) return;
  if (url.includes('anthropic.com')) return;
  if (url.includes('onrender.com')) return;
  if (url.includes('graph.facebook.com')) return;
  if (url.includes('api.tiktok.com')) return;
  if (url.includes('googleapis.com')) return;
  if (url.includes('fonts.gstatic.com')) return;
  if (url.includes('cdn.jsdelivr.net')) return;

  event.respondWith(
    /* Always try network first */
    fetch(event.request)
      .then(function(response) {
        /* Cache valid same-origin responses */
        if (
          response &&
          response.status === 200 &&
          response.type !== 'opaque'
        ) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        /* Network failed — serve from cache (offline mode) */
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          /* Last resort: serve the main app shell */
          if (event.request.destination === 'document') {
            return caches.match('/creator-studio.html');
          }
        });
      })
  );
});

/* ── Background sync ── */
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-content') {
    event.waitUntil(Promise.resolve());
  }
});

/* ── Push notifications ── */
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

/* ── Notification click ── */
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/creator-studio.html')
  );
});
