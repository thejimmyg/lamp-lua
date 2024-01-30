// Problems
// There is no retry if activation fails the first time
// There is no way to see the offline content unless offline visiting a page that doesn't exist
// Sometimes skipWaiting() seems to get called more than once

console.log("In the service-worker.js file");

// Code cache bust: 1

const OFFLINE_PAGE_URL = '/offline/';
const APP_CACHE_NAME = 'app-cache-v1';
const URL_CACHE_NAME = 'url-cache-v1';

let latestRequestTimestamps = {};
const urlsToCache = [
  '/style.css',
  '/app.js',
  OFFLINE_PAGE_URL,
  // "/icons/apple-touch-icon-180x180.png",
  // "/icons/icon-32x32.png",
  // "/icons/icon-16x16.png",
  // "/icons/icon-192x192.png",
  // "/icons/safari-pinned-tab.svg",
];
const excludeFromCache = new Set([...urlsToCache]);

const excludeFromOffline = new Set([
    '/favicon.ico',
    '/icons/icon-192x192.png',
    '/login',
    '/logout',
    '/manifest.json',
    "/icons/apple-touch-icon-180x180.png",
    "/icons/icon-32x32.png",
    "/icons/icon-16x16.png",
    "/icons/icon-192x192.png",
    "/icons/safari-pinned-tab.svg",
    ...urlsToCache
]);


async function cacheWithTimestampCheck(request, responseClone, requestTimestamp) {
  if (excludeFromCache.has(new URL(request.url).pathname)) {
    console.log('Not caching "' +(new URL(request.url).pathname) + '" because it is an excluded path');
    return;
  }

  const cache = await caches.open(URL_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  const cachedTimestamp = cachedResponse && cachedResponse.headers.has('x-timestamp')
                          ? parseInt(cachedResponse.headers.get('x-timestamp'))
                          : 0;

  if (requestTimestamp >= (latestRequestTimestamps[request.url] || 0) && requestTimestamp >= cachedTimestamp) {
    console.log('Going to cache content for "' +(new URL(request.url).pathname) + '"');
    const responseHeaders = new Headers(responseClone.headers);
    responseHeaders.append('x-timestamp', requestTimestamp.toString());
    const responseToCache = new Response(responseClone.body, {
      status: responseClone.status,
      statusText: responseClone.statusText,
      headers: responseHeaders
    });
    await cache.put(request, responseToCache);
    console.log('Successfully cached content for "' +(new URL(request.url).pathname) + '"');
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
    caches.open(APP_CACHE_NAME)
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
  if (urlsToCache.includes(new URL(event.request.url).pathname)) {
    // Serve from app cache
    event.respondWith(caches.match(event.request, { cacheName: APP_CACHE_NAME }));
  } else {
    const requestTimestamp = Date.now();
    latestRequestTimestamps[event.request.url] = requestTimestamp;

    event.respondWith(
      new Promise((resolve, reject) => {
        let isResolved = false;
        let timeoutId = setTimeout(async () => {
          const cachedResponse = await caches.match(event.request, { cacheName: URL_CACHE_NAME });
          if (cachedResponse) {
            isResolved = true;
            resolve(stripTimestampHeader(cachedResponse));
          }
        }, 2000);

        fetch(event.request).then(async networkResponse => {
          clearTimeout(timeoutId);
          if (!isResolved) {
            const responseClone = networkResponse.clone();
            if (responseClone.status === 200) {
                await cacheWithTimestampCheck(event.request, responseClone, requestTimestamp);
            }
            resolve(stripTimestampHeader(networkResponse));
          }
        }).catch(async () => {
          clearTimeout(timeoutId);
          if (!isResolved) {
            const cachedResponse = await caches.match(event.request,  { cacheName: URL_CACHE_NAME });
            if (cachedResponse) {
              resolve(stripTimestampHeader(cachedResponse));
            } else {
              // Obviously we can't fetch this, we need to get it from the cache.
              // resolve(fetch('/offline/'));
              const cache = await caches.open(APP_CACHE_NAME);
              const offlinePageResponse = await cache.match(OFFLINE_PAGE_URL);
              const pageContent = await offlinePageResponse.text();
              const linksHtml =  await prepareOfflineLinks();
              console.log(linksHtml);
              const updatedContent = pageContent.replace(
                '<div id="offline-accessible">Loading content you can still access ...</div>',
                `<div id="offline-accessible"><p>You are offline. The page you requested could not be served.</p><p>All these resources are available offline though:</p>${linksHtml}</div>`
              );
              resolve(new Response(updatedContent, {
                headers: { 'Content-Type': 'text/html' }
              }));
            }
          }
        });
      })
    );
  }
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  var cacheWhitelist = [APP_CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== APP_CACHE_NAME && cacheName !== URL_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      ).then(e => {
          console.log('Activate finished');
      });
    })
  );
});

console.log("At the offline code");

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, match => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match];
  });
}

const prepareOfflineLinks = async () => {
    const cache = await caches.open('url-cache-v1');
    const cachedResponses = await cache.keys();

    let links = await Promise.all(cachedResponses.map(async request => {
        if (!excludeFromOffline.has(new URL(request.url).pathname)) {
            const response = await cache.match(request);
            if (response && response.status === 200) {
                const contentType = response.headers.get('Content-Type');
                if (contentType.includes('text/html')) {
                    const text = await response.text();
                    const titleMatch = text.match(/<title>(.*?)<\/title>/);
                    const title = titleMatch ? titleMatch[1] : 'Untitled';
                    // We'll assume that the title is valid HTML, otherwise there has already been an injection attack
                    return `<li><a href="${escapeHTML(request.url)}">Page: ${title} (${escapeHTML(new URL(request.url).pathname)})</a></li>`;
                } else {
                    return `<li><a href="${escapeHTML(request.url)}">${escapeHTML(contentType.split('/')[1].toUpperCase())} File (${escapeHTML(new URL(request.url).pathname)})</a></li>`;
                }
            }
        }
        return null; // Skip if the response is not 200 OK
    }));

    links = links.filter(link => link); // Filter out null values
    if (links.length === 0) {
      return escapeHTML("You are offline, but have no content synced for offline access.");
    } else {
      return `<ul>${links.join('')}</ul>`;
    }
}

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
    const checkCache = message.checkCache;

    if (allAgreeToUpdate) {
      console.log('Calling skipWaiting() because all clients agree to skip', self);
      self.skipWaiting().then(e => {
        console.log('Called skipWaiting() successfully', e);
        if (checkCache) {
            console.log('Checking and caching current page');
            clients.get(clientId).then(client => {
                if (client) {
                    const clientUrl = new URL(client.url);
                    console.log('Caching the URL that loaded the service worker:', clientUrl.href);
                    // Create a new request object based on the URL
                    const request = new Request(clientUrl.href);
                    fetch(request).then(response => {
                        if (response.status === 200) {
                            // Pass the original request object and the cloned response
                            cacheWithTimestampCheck(request, response.clone(), Date.now());
                        }
                    }).catch(e => console.error('Error caching current page:', e));
                }
            })
        }
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
