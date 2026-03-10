// ReddyFit Ultimate Service Worker
// Provides offline functionality, background sync, and push notifications

const CACHE_NAME = 'reddyfit-ultimate-v1.0.0';
const STATIC_CACHE = 'reddyfit-static-v1.0.0';
const DYNAMIC_CACHE = 'reddyfit-dynamic-v1.0.0';
const IMAGE_CACHE = 'reddyfit-images-v1.0.0';

// Files to cache immediately (App Shell)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/offline.html',
  // Add critical fonts and icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache with Network First strategy
const API_ENDPOINTS = [
  '/api/user',
  '/api/workouts',
  '/api/meals',
  '/api/progress',
  '/api/community'
];

// Install event - Cache static files
self.addEventListener('install', (event) => {
  console.log('🚀 ReddyFit Service Worker: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error caching static files:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 ReddyFit Service Worker: Activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes('reddyfit') ||
                (cacheName.includes('reddyfit') &&
                 !cacheName.includes('v1.0.0'))) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - Handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle image requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static resources
  event.respondWith(handleStaticRequest(request));
});

// API Request Handler - Network First with Background Sync
async function handleApiRequest(request) {
  const cacheName = DYNAMIC_CACHE;

  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    console.log('🔄 Network failed, checking cache for:', request.url);

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's a POST/PUT/DELETE request, queue for background sync
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      await queueBackgroundSync(request);
    }

    // Return offline fallback
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This request will be synced when you\'re back online',
      cached: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Image Request Handler - Cache First
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder image for offline
    return new Response(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280">Image unavailable offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Navigation Request Handler - Cache First for Shell
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    // Return cached shell
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match('/');

    if (cachedResponse) {
      return cachedResponse;
    }

    // Ultimate fallback
    return cache.match('/offline.html');
  }
}

// Static Request Handler - Cache First
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('❌ Failed to fetch:', request.url);
    throw error;
  }
}

// Background Sync for offline actions
async function queueBackgroundSync(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now()
    };

    // Store in IndexedDB for background sync
    const db = await openDB();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    await store.add(requestData);

    console.log('📤 Queued for background sync:', request.url);
  } catch (error) {
    console.error('❌ Error queuing background sync:', error);
  }
}

// Background Sync event
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'reddyfit-sync') {
    event.waitUntil(processBackgroundSync());
  }
});

// Process queued background sync requests
async function processBackgroundSync() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    const requests = await store.getAll();

    console.log(`📤 Processing ${requests.length} queued requests...`);

    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });

        if (response.ok) {
          // Remove from queue on success
          await store.delete(requestData.id);
          console.log('✅ Synced:', requestData.url);

          // Notify client of successful sync
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_SUCCESS',
                url: requestData.url,
                method: requestData.method
              });
            });
          });
        }
      } catch (error) {
        console.error('❌ Failed to sync:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('❌ Error processing background sync:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');

  let notificationData = {
    title: 'ReddyFit',
    body: 'You have a new notification!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'reddyfit-notification',
    data: {}
  };

  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (error) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/icons/open-action.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss-action.png'
        }
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200]
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // If app is already open, focus it
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }

          // Otherwise open new window
          if (clients.openWindow) {
            const targetUrl = event.notification.data?.url || '/';
            return clients.openWindow(targetUrl);
          }
        })
    );
  }
});

// IndexedDB helper for background sync
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ReddyFitDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

// Periodic background sync for premium features
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic sync triggered:', event.tag);

  if (event.tag === 'reddyfit-daily-sync') {
    event.waitUntil(performDailySync());
  }
});

async function performDailySync() {
  try {
    // Sync user data, check for updates, etc.
    console.log('📅 Performing daily background sync...');

    // Example: Fetch latest community posts, workout suggestions, etc.
    const response = await fetch('/api/daily-sync');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Daily sync completed:', data);
    }
  } catch (error) {
    console.error('❌ Daily sync failed:', error);
  }
}

console.log('🚀 ReddyFit Ultimate Service Worker loaded successfully!');