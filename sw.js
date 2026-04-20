/* ═══════════════════════════════════════════════
   IMPACTGRID — SERVICE WORKER (sw.js)
   v2 — Network-first strategy (always fresh content)
   IMPORTANT: Bump CACHE_NAME on every deploy!
═══════════════════════════════════════════════ */
const CACHE_NAME = 'impactgrid-v9'; // bumped — calendar posting reminders

const CORE_FILES = [
  '/',
  '/index.html',
  '/shared.css',
  '/nav.js',
  '/manifest.json',
  '/logo.png',
  '/dijo-mascot.png',
  '/auth.js',
  '/ig-supabase.js',
  '/supabase-config.js',
  '/plan-config.js',
  /* Creator Studio */
  '/creator-studio.html',
  '/creator-studio.css',
  '/creator-studio.js',
  '/creator-ai.js',
  '/calendar.js',
  /* Portfolio Studio */
  '/portfolio-studio.html',
  '/portfolio-studio.css',
  '/portfolio-studio.js',
  '/p.html',
  /* Carousel Studio */
  '/carousel-studio.html',
  '/carousel-studio.css',
  '/carousel-studio.js',
  '/carousel-studio-additions.css',
  /* Auth & account */
  '/login.html',
  '/join.html',
  '/settings.html',
  '/pricing.html',
  '/success.html',
  /* Info pages */
  '/jobs.html',
  '/dijo.html',
  '/about.html',
  '/privacy.html',
  '/terms.html',
  '/contact.html',
  '/network.html'
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

  /* Skip non http/https schemes — fixes chrome-extension:// cache error */
  if (!event.request.url.startsWith('http')) return;

  /* Skip all cross-origin requests — only cache same-origin */
  try {
    var reqUrl = new URL(event.request.url);
    if (reqUrl.origin !== self.location.origin) return;
  } catch(e) { return; }

  event.respondWith(
    /* Always try network first */
    fetch(event.request)
      .then(function(response) {
        /* Only cache basic (same-origin) 200 responses */
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic'
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

/* ── Message: SHOW_NOTIFICATION from calendar.js ── */
self.addEventListener('message', function(event) {
  if (!event.data || event.data.type !== 'SHOW_NOTIFICATION') return;
  var d = event.data;
  self.registration.showNotification(d.title || 'ImpactGrid', {
    body:     d.body    || "Time to post!",
    icon:     '/logo.png',
    badge:    '/logo.png',
    vibrate:  [100, 50, 100],
    tag:      d.tag     || 'ig-cal',
    renotify: true,
    data:     { url: d.url || '/creator-studio.html#calendar' },
    actions:  [
      { action: 'open',    title: '📅 Open Calendar' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  });
});

/* ── Push notifications ── */
self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {}
  var title   = data.title || 'ImpactGrid';
  var options = {
    body:     data.body || "New trends are in — open ImpactGrid to see what's hot today.",
    icon:     '/logo.png',
    badge:    '/logo.png',
    vibrate:  [100, 50, 100],
    tag:      'impactgrid-trend',
    renotify: true,
    data:     { url: data.url || '/creator-studio.html' },
    actions:  [
      { action: 'open',    title: '📈 See Trends' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Notification click ── */
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'dismiss') return;
  var url = (event.notification.data && event.notification.data.url) || '/creator-studio.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.includes('impactgridgroup.com') && 'focus' in list[i]) {
          return list[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
