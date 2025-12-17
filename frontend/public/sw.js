// Service Worker for Robo Top Up PWA
const CACHE_NAME = 'robo-topup-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/fav.webp',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Helper function to check if request should be cached
function shouldCache(request) {
  const url = new URL(request.url);
  
  // Don't cache chrome-extension, chrome, or other unsupported schemes
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'chrome:' || 
      url.protocol === 'moz-extension:' ||
      url.protocol === 'edge:' ||
      !url.protocol.startsWith('http')) {
    return false;
  }
  
  // Only cache GET requests
  if (request.method !== 'GET') {
    return false;
  }
  
  // Don't cache external API calls or WebSocket connections
  if (url.hostname !== self.location.hostname && 
      !url.hostname.includes('localhost') &&
      !url.hostname.includes('127.0.0.1')) {
    // Allow caching same-origin requests only
    return false;
  }
  
  return true;
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip caching for unsupported request schemes
  if (!shouldCache(event.request)) {
    // Just fetch without caching
    event.respondWith(fetch(event.request).catch(() => {
      // If fetch fails and it's a document request, return offline page
      if (event.request.destination === 'document') {
        return caches.match('/index.html');
      }
      return new Response('Offline', { status: 503 });
    }));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((response) => {
            // Don't cache non-GET requests or non-successful responses
            if (event.request.method !== 'GET' || !response || response.status !== 200) {
              return response;
            }
            
            // Check again if we should cache (double check)
            if (!shouldCache(event.request)) {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache with error handling
            caches.open(CACHE_NAME)
              .then((cache) => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (error) {
                  console.warn('Service Worker: Failed to cache request', event.request.url, error);
                }
              })
              .catch((error) => {
                console.warn('Service Worker: Cache error', error);
              });
            
            return response;
          })
          .catch(() => {
            // If fetch fails, return offline page if available
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

