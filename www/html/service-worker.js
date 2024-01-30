console.log("In the service-worker.js file");

// Code cache bust: 5

const CACHE_NAME = 'app-cache-v1';
let latestRequestTimestamps = {};
const urlsToCache = [
  '/',
  '/style.css',
  '/app.js',
  '/offline.html',
  '/offline.js',
  // "/icons/apple-touch-icon-180x180.png",
  // "/icons/icon-32x32.png",
  // "/icons/icon-16x16.png",
  // "/icons/icon-192x192.png",
  // "/icons/safari-pinned-tab.svg",
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
        return cache.addAll(urlsToCache).then(res => {
          console.log('Sending the check version check ...');
          broadcastMessage({ type: 'CHECK_VERSION' });
          return res
        })
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
      ).then(e => {
          console.log('Activate finished');
      });
    })
  );
});



console.log("At the skipWaiting check code");

let clientsReadyToUpdate = new Map();

self.addEventListener('message', async event => {
  console.log('Got message back:', event)
  const clientId = event.source.id;
  const message = event.data;

  if (message.type === 'VERSION_CHECK') {
    clientsReadyToUpdate.set(clientId, message.isReadyToUpdate);
    
    const allClients = await clients.matchAll({ includeUncontrolled: true });
    const allAgreeToUpdate = allClients.every(client => clientsReadyToUpdate.get(client.id));

    if (allAgreeToUpdate) {
      console.log('Calling skipWaiting() because all clients agree to skip', self);
      self.skipWaiting().then(e => {
        console.log('Called skipWaiting() successfully', e);
        return self.clients.claim().then(e => {console.log('All clients claimed')});
      }).catch(e => {console.log(e)});
    } else {
      console.log('Cannot skipWaiting() because some clients do not agree');
    }
  }
});

function broadcastMessage(message) {
  console.log('Broadcasting message ...');
  clients.matchAll({ type: 'window', includeUncontrolled: true }).then(allClients => {
    console.log('Broadcasting message to', allClients);
    allClients.forEach(client => {
      console.log('Sending', message, 'to', client);
      client.postMessage(message);
    });
  });
}


console.log("At the end of the service-worker.js file");
