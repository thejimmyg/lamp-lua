const updateUrl = true;


// This function fetches content and updates the page body
function fetchAndUpdateContent(url) {
    return fetch(url)
        .then(response => response.text())
        .then(html => {
            if (!html) {
                document.body.innerHTML = '<p>No content available to display.</p>';
                console.log('Setting title to "No Content"');
                document.title = 'No Content'; // Update the title
                return;
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const title = doc.querySelector('title') ? doc.querySelector('title').innerText : 'Default Title';
            console.log('Setting title based on actual page content to:', title);
            document.title = title; // Update the title
            document.body.innerHTML = doc.body.innerHTML;

            attachListeners();
        })
        .catch(error => {
            console.error('Fetch error:', error);
            document.body.innerHTML = '<p>Error loading content.</p>';
            document.title = 'Error'; // Update the title
        });
}


// Attach event handlers to links
function attachListeners() {
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const href = this.href;
            console.log('Current page title is:', document.title, ', about to navigate');
            fetchAndUpdateContent(href).then(() => {
                if (updateUrl) {
                    console.log('Pushing a history entry for "'+href+'", with title', document.title);
                    history.pushState({ title: document.title }, document.title, href);
                }
            });
        });
    });
}

// Handle popstate event
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.title) {
        console.log('Setting title based on popstate to:', event.state.title);
        document.title = event.state.title;
    }
    fetchAndUpdateContent(window.location.href);
});

// Call this function on initial load
attachListeners();

// Optionally, you might want to fetch and update content on initial load as well
// fetchAndUpdateContent(window.location.href);


if (navigator.serviceWorker) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            // Registration failed
            console.log('ServiceWorker registration failed: ', err);
        });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // The new service worker has taken control
      console.log("A new service worker is controlling the page!");
      // You might want to refresh the page, display a notification to the user, etc.
    });

    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', event => {
        console.log('Page got message:', event);
        // Handle incoming CHECK_VERSION message but make sure we post back to the waiting service worker, not the currently active one.
        if (event.data && event.data.type === 'CHECK_VERSION') {
          const isReadyToUpdate = true;
          console.log('Page getting the waiting service worker from registration ...')
          navigator.serviceWorker.getRegistration().then(registration => {
              console.log('Page got registration.')
              if (registration && registration.waiting) {
                  // Send a message to the waiting service worker to activate
                  console.log('Service worker registration is viewed as waiting from the page')
                  registration.waiting.postMessage({
                    type: 'VERSION_CHECK',
                    isReadyToUpdate: isReadyToUpdate
                  });
                  console.log('Page posted back to waiting service worker', isReadyToUpdate);
              } else if (registration.active) {
                  console.log('Service worker registration is viewed as active from the page, but perhaps it is not claimed?')
                  // Send a message to the waiting service worker to activate
                  registration.active.postMessage({
                    type: 'VERSION_CHECK',
                    isReadyToUpdate: isReadyToUpdate,
                    checkCache: true,
                  });
                  console.log('Page posted back to waiting service worker', isReadyToUpdate);
              }
          });
        }
    });
    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker has taken control');
        // Optionally, perform actions such as refreshing the page
    });
}
