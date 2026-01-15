// Service Worker for Robo Top Up PWA
// Version with timestamp for cache busting
const CACHE_VERSION = Date.now();
const CACHE_NAME = `robo-topup-v${CACHE_VERSION}`;
const STATIC_CACHE = 'robo-topup-static-v1';
const DYNAMIC_CACHE = 'robo-topup-dynamic-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/logo-robo.jpg',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  // Force activate new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all old caches
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately to activate new service worker
      return self.clients.claim();
    })
  );
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

// Fetch event - Network First strategy for HTML/JS, Cache First for static assets
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
  
  const url = new URL(event.request.url);
  const isHTML = event.request.destination === 'document' || url.pathname.endsWith('.html');
  const isJS = url.pathname.endsWith('.js') || url.pathname.includes('/assets/');
  const isCSS = url.pathname.endsWith('.css');
  
  // Network First strategy for HTML and JS (always get fresh content)
  if (isHTML || isJS) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          // If network succeeds, update cache and return response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (error) {
                  console.warn('Service Worker: Failed to cache', event.request.url);
                }
              });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If it's HTML and no cache, return index.html
            if (isHTML) {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }
  
  // Cache First strategy for CSS and other static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Return cached version immediately, but also update in background
          fetch(event.request, { cache: 'reload' })
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    try {
                      cache.put(event.request, networkResponse.clone());
                    } catch (error) {
                      console.warn('Service Worker: Failed to update cache', event.request.url);
                    }
                  });
              }
            })
            .catch(() => {
              // Network failed, but we have cache, so it's fine
            });
          return response;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(STATIC_CACHE)
                .then((cache) => {
                  try {
                    cache.put(event.request, responseToCache);
                  } catch (error) {
                    console.warn('Service Worker: Failed to cache', event.request.url);
                  }
                });
            }
            return response;
          })
          .catch(() => {
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Listen for messages from client to force update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    // Force update cache for specific resources
    event.waitUntil(
      Promise.all([
        caches.open(STATIC_CACHE).then((cache) => {
          return Promise.all(
            urlsToCache.map((url) => {
              return fetch(new Request(url, { cache: 'reload' }))
                .then((response) => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                })
                .catch((error) => {
                  console.warn('Failed to update cache for', url, error);
                });
            })
          );
        }),
        // Clear dynamic cache to force fresh fetch
        caches.delete(DYNAMIC_CACHE).then(() => {
          return caches.open(DYNAMIC_CACHE);
        })
      ])
    );
  }
});

