const CACHE_NAME = 'pokemon-api-v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// URLs to cache
const STATIC_CACHE_URLS = [
  '/',
  '/browse',
  '/pokedeck',
  '/offline',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/pokeapi\.co\/api\/v2\/pokemon\//,
  /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites/,
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Handle API requests (Cache First for Pokemon data)
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Check if cache is still fresh (for API data, we want shorter cache)
          const cachedTime = cachedResponse.headers.get('cached-time');
          const isExpired = cachedTime && (Date.now() - parseInt(cachedTime)) > CACHE_DURATION;
          
          if (!isExpired) {
            return cachedResponse;
          }
        }

        // Fetch from network and update cache
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('cached-time', Date.now().toString());

            const newResponse = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: headers
            });

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, newResponse.clone());
            });

            return response;
          })
          .catch(() => {
            // Return cached version if available, even if expired
            return cachedResponse || new Response('Offline', { status: 503 });
          });
      })
    );
    return;
  }

  // Handle page requests (Network First for HTML pages)
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful page responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Serve from cache if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page if no cache available
            return caches.match('/offline').then((offlinePage) => {
              return offlinePage || new Response('You are offline', {
                status: 503,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
          });
        })
    );
    return;
  }

  // Default: try network first, fallback to cache
  event.respondWith(
    fetch(request).then((response) => {
      // Cache successful responses
      if (response.status === 200) {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
      }
      return response;
    }).catch(() => {
      return caches.match(request);
    })
  );
});