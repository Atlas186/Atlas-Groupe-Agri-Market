// A unique name for your cache. Update this when your application assets change
// significantly or after a major deployment to ensure users get fresh content.
const CACHE_NAME = 'atlas-agri-market-cache-v2';

// List of static assets that should be pre-cached during installation.
// Adjust these paths to match your actual file structure in the 'public' directory.
const urlsToPrecache = [
  '/', // The root of your application, usually index.html
  '/index.html',
  '/home.html',
  '/connect.html',
  '/profil.html',
  '/registre.html',
  '/whitepaper.html',
  '/KYC.html',
  '/conditions.html',
  '/confidentialite.html',
  // Assuming your CSS is in 'public/css'
  '/css/style.css', // Example: adjust to your main CSS file
  // Assuming your JS is in 'public/js' or directly in 'src' and bundled by Vite
  '/js/main.js',    // Example: adjust to your main JS file
  // Add other assets like images, fonts, etc.
  // '/assets/logo.png', // Example if you have an assets folder
  // '/fonts/Montserrat-Regular.woff2', // Example for fonts
];

// --- Install Event: Pre-cache Assets ---
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching static assets:', urlsToPrecache);
        return cache.addAll(urlsToPrecache)
          .then(() => console.log('[Service Worker] Pre-caching complete.'))
          .catch((error) => console.error('[Service Worker] Pre-caching failed:', error));
      })
      .then(() => self.skipWaiting()) // Force the new service worker to activate immediately
      .catch((error) => console.error('[Service Worker] Cache open failed during install:', error))
  );
});

// --- Activate Event: Clean up old caches ---
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Old caches cleaned up. Claiming clients...');
      return self.clients.claim(); // Take control of any uncontrolled pages
    })
    .catch((error) => console.error('[Service Worker] Activation failed:', error))
  );
});

// --- Fetch Event: Serve from cache, then network, and dynamically cache new requests ---
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip extensions or external requests if needed
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // If a cached response is found, return it
        if (cachedResponse) {
          console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
          return cachedResponse;
        }

        // If not in cache, fetch from the network
        console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              console.warn(`[Service Worker] Not caching invalid response for: ${event.request.url}`);
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and can only be consumed once. We need to consume it once
            // to return it to the browser and once to cache it.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log(`[Service Worker] Caching new resource: ${event.request.url}`);
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error(`[Service Worker] Network fetch failed for ${event.request.url}:`, error);
            // Optionally, return a fallback page for offline users here if fetching failed
            // E.g., return caches.match('/offline.html');
          });
      })
  );
});
