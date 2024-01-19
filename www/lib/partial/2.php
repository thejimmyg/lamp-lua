    </article>
    <footer>Footer</footer>
    <script>
    // Without this, error pages don't appear to the user to get loaded
    document.body.addEventListener('htmx:beforeOnLoad', function (evt) {
        if (evt.detail.xhr.status === 404 || evt.detail.xhr.status === 500) {
            evt.detail.shouldSwap = true;
            evt.detail.isError = false;
        }
    });
    </script>
  </body>
</html>
