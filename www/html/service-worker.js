console.log("In the service-worker.js file");

// Code cache bust: 1

const CACHE_NAME = 'app-cache-v1';
let latestRequestTimestamps = {};
const urlsToCache = [
  '/',
  '/style.css',
  '/app.js',
  '/offline.html',
  '/offline.js',
];
const excludeFromCache = new Set([...urlsToCache]);

async function cacheWithTimestampCheck(request, responseClone, requestTimestamp) {
  if (excludeFromCache.has(new URL(request.url).pathname)) {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  const cachedTimestamp = cachedResponse && cachedResponse.headers.has('x-timestamp') 
                          ? parseInt(cachedResponse.headers.get('x-timestamp')) 
                          : 0;

  if (requestTimestamp >= (latestRequestTimestamps[request.url] || 0) && requestTimestamp >= cachedTimestamp) {
    const responseHeaders = new Headers(responseClone.headers);
    responseHeaders.append('x-timestamp', requestTimestamp.toString());
    const responseToCache = new Response(responseClone.body, {
      status: responseClone.status,
      statusText: responseClone.statusText,
      headers: responseHeaders
    });
    await cache.put(request, responseToCache);
  }
}

function stripTimestampHeader(response) {
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('x-timestamp');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  const requestTimestamp = Date.now();
  latestRequestTimestamps[event.request.url] = requestTimestamp;

  event.respondWith(
    new Promise((resolve, reject) => {
      let isResolved = false;
      let timeoutId = setTimeout(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          isResolved = true;
          resolve(stripTimestampHeader(cachedResponse));
        }
      }, 2000);

      fetch(event.request).then(async networkResponse => {
        clearTimeout(timeoutId);
        if (!isResolved) {
          const responseClone = networkResponse.clone();
          await cacheWithTimestampCheck(event.request, responseClone, requestTimestamp);
          resolve(stripTimestampHeader(networkResponse));
        }
      }).catch(async () => {
        clearTimeout(timeoutId);
        if (!isResolved) {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            resolve(stripTimestampHeader(cachedResponse));
          } else {
            resolve(fetch('/offline.html'));
          }
        }
      });
    })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

console.log("At the end of the service-worker.js file");

