// PLAYBACK Profiles Service Worker
// Version: 1.0.0

const CACHE_NAME = 'playback-profiles-v1.0.0';
const STATIC_CACHE = 'playback-static-v1.0.0';
const DYNAMIC_CACHE = 'playback-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
];

// API routes to cache
const API_ROUTES = ['/api/posts/latest'];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default: network first, cache fallback
  event.respondWith(handleDefaultRequest(request));
});

// Handle API requests with cache-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error('Network request failed');
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API requests
    return new Response(
      JSON.stringify({ error: 'Offline - API unavailable' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a default response for missing assets
    return new Response('Asset not available offline', { status: 404 });
  }
}

// Handle navigation requests with network-first strategy
async function handleNavigation(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error('Navigation request failed');
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    return (
      caches.match('/offline.html') ||
      new Response(
        `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PLAYBACK Profiles - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #000;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .offline-container {
              text-align: center;
              max-width: 400px;
            }
            .offline-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              margin-bottom: 10px;
              color: #3B82F6;
            }
            p {
              margin-bottom: 20px;
              opacity: 0.8;
            }
            .retry-btn {
              background: #3B82F6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
            }
            .retry-btn:hover {
              background: #2563EB;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button class="retry-btn" onclick="window.location.reload()">
              Retry
            </button>
          </div>
        </body>
      </html>
      `,
        {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'text/html' },
        }
      )
    );
  }
}

// Handle default requests with network-first strategy
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return (
      cachedResponse || new Response('Not available offline', { status: 404 })
    );
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
  ];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync
async function doBackgroundSync() {
  try {
    // Sync any pending data
    console.log('Performing background sync...');

    // You can add specific sync logic here
    // For example, syncing offline form submissions
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  const options = {
    body: event.data
      ? event.data.text()
      : 'New notification from PLAYBACK Profiles',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/android-chrome-192x192.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/android-chrome-192x192.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('PLAYBACK Profiles', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
