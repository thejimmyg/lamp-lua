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
            history.pushState({}, '', href);
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

