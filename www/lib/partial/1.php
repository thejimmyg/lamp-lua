<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="stylesheet" href="/styles.css">
    <title><?php echo htmlspecialchars($PAGE_TITLE, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5); ?></title>
    <script src="https://unpkg.com/htmx.org@1.9.10" integrity="sha384-D1Kt99CQMDuVetoL1lrYwg5t+9QdHe7NLX/SoJYkXDFfX37iInKRy5xLSi8nO7UC" crossorigin="anonymous"></script>
  </head>
  <body hx-boost="true">
    <header>
      <?php echo htmlspecialchars($PAGE_TITLE, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5); ?>
    </header>
    <input type="checkbox" id="menu-toggle" class="menu-toggle" />
    <label for="menu-toggle" class="menu-icon">
      <span></span> <!-- This represents the middle line of the hamburger -->
    </label>
    <nav>
      <a href="/" id="nav-home-link">Home</a><br>
      <a href="/db" id="nav-db-link">DB</a><br>
      <a href="/404" id="nav-example-404-link">Not Found</a>
    </nav>
    <article>
