const excludeFromOffline = new Set([
    '/app.js',
    '/init.js',
    '/manifest.json',
    '/offline.html',
    '/offline.js',
    '/service-worker.js',
    '/style.css',
    "/icons/apple-touch-icon-180x180.png",
    "/icons/icon-32x32.png",
    "/icons/icon-16x16.png",
    "/icons/icon-192x192.png",
    "/icons/safari-pinned-tab.svg",
    "favicon.ico",
    // ... other URLs to exclude
]);

async function populateOfflineLinks() {
  const offlineDiv = document.getElementById('offline-accessible');
  if (!offlineDiv) {
    console.error('Div with id "offline-accessible" not found.');
    return;
  }

  try {
    // Identify and sort relevant caches
    const cacheNames = (await caches.keys()).filter(name => name.startsWith('app-cache-'));
    cacheNames.sort().reverse(); // Assuming higher version numbers are 'greater'

    let cacheItems = new Map();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const cachedResponses = await cache.keys();

      for (const request of cachedResponses) {
        if (!cacheItems.has(request.url) && !excludeFromOffline.has(new URL(request.url).pathname)) {
          const response = await cache.match(request);
          const contentType = response.headers.get('Content-Type');
          cacheItems.set(request.url, { contentType, response });
        }
      }
    }

    // Sort and format links
    const sortedItems = Array.from(cacheItems).sort((a, b) => {
      const typeA = a[1].contentType.includes('text/html') ? '0' : '1';
      const typeB = b[1].contentType.includes('text/html') ? '0' : '1';
      return typeA.localeCompare(typeB) || a[0].localeCompare(b[0]);
    });

    if (sortedItems.length === 0) {
      offlineDiv.textContent = "You are offline, but have no content synced for offline access.";
      return;
    }

    let links = await Promise.all(sortedItems.map(async ([url, { contentType, response }]) => {
      if (contentType.includes('text/html')) {
        const text = await response.text();
        const titleMatch = text.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : 'Untitled';
        return `<li><a href="${url}">Page: ${title} (${new URL(url).pathname})</a></li>`;
      } else {
        return `<li><a href="${url}">${contentType.split('/')[1].toUpperCase()} File (${new URL(url).pathname})</a></li>`;
      }
    }));

    offlineDiv.innerHTML = `<ul>${links.join('')}</ul>`;
  } catch (error) {
    console.error('Error populating offline links:', error);
  }
}

// Call this function when you want to populate the links
populateOfflineLinks();

