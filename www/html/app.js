const updateUrl = true;


// This function fetches content and updates the page body
function fetchAndUpdateContent(url) {
    fetch(url)
        .then(response => response.text()) // Get the response text regardless of the status code
        .then(html => {
            if (!html) {
                // Handle the case where there's genuinely no content
                document.body.innerHTML = '<p>No content available to display.</p>';
                return;
            }
            // Update the page content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            document.body.innerHTML = doc.body.innerHTML;
            attachListeners();
        })
        .catch(error => {
            console.error('Fetch error:', error);
            document.body.innerHTML = '<p>Error loading content.</p>';
            // Optionally, handle the error more gracefully here
        });
}

// Attach event handlers to links
function attachListeners() {
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const href = event.target.href;
            if (updateUrl) {
                history.pushState({}, '', href);
            }
            fetchAndUpdateContent(href);
        });
    });
}

// Handle popstate event
window.addEventListener('popstate', function(event) {
    // Use the current URL
    fetchAndUpdateContent(window.location.href);
});

// Call this function on initial load
attachListeners();

// Optionally, you might want to fetch and update content on initial load as well
// fetchAndUpdateContent(window.location.href);


navigator.serviceWorker.addEventListener('message', event => {
  console.log('Page got event from service worker:', event);
});

if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The new service worker has taken control
    console.log("A new service worker is controlling the page!");
    // You might want to refresh the page, display a notification to the user, etc.
  });
}

if (navigator.serviceWorker) {
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
                  console.log('Page posted back to waiting service worker', isReadyToUpdate);
                  registration.waiting.postMessage({
                    type: 'VERSION_CHECK',
                    isReadyToUpdate: isReadyToUpdate
                  });
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
