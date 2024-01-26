# README

The approach in this project is to use domain specific languages for domain specific tasks:

* HTTP - [Apache 2.4](https://httpd.apache.org/docs/2.4/) config format with [mod_lua](https://httpd.apache.org/docs/2.4/mod/mod_lua.html) and [`.htaccess`](https://httpd.apache.org/docs/2.4/howto/htaccess.html) files
* Ops - [Docker](https://www.docker.com/products/docker-desktop/)
* CSS - [CSS Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) and [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
* Tests - [Python 3.11](http://python.org) driving [Selenium WebDriver](https://selenium-python.readthedocs.io/) with Chrome, and also support to call an [Appium](http://appium.io/docs/en/2.4/) server for mobile testing
* JSON - [JSON Function in SQL](https://mariadb.com/kb/en/json-functions/) with [MariaDB 10.8.3](https://mariadb.com/kb/en/documentation/) via a small [PHP adapter](code/db.php) with a [phpMyAdmin](https://www.phpmyadmin.net/) admin interface
* Apps - React Native Webview and Electron calling the existing HTML site with a bridge to native functionality

The idea is that the resulting application can be deployed on commodity VPS hosting as well as production cloud infrastructure, but that there isn't anything needed for development except Docker. This should lower the barriers to contribution and to deployment.


## Getting Started Locally

macOS - Make sure you have [installed git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Docker Desktop](https://www.docker.com/products/docker-desktop/) then start a bash shell like this (the default is `zsh` now but behaves very slightly differently):

```sh
bash
```

Linux - Install git, docker and docker compose, e.g. with `sudo apt install git docker.io docker-compose`

Windows - Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [Git for Windows](https://github.com/git-for-windows/git) (which also installs Git Bash and make which you'll need) then load a Git Bash shell.

Now you can just run this command (Linux users may need to add their user to the `docker` group or use `sudo` before the command will run):

```sh
docker-compose stop && docker-compose --profile serve --profile debug up --remove-orphans --build
```

This creates a persistent volume for the MariaDB data (in the main docker volumes part of the filesystem, not the local directory) and starts all the services in the *serve* profile (`httpd`, `mariadb`, `php-fpm`) and the *debug* profile (`phpmyadmin`).

You can skip the `--build` flag after the first run unless you make changes in the `docker` folder.

Press Ctrl+C to stop the compose stack. Or run `docker-compose down` in a different terminal but in the same directory as the `compose.yml` file.

You can see memory usage like this:

```sh
docker stats $(docker-compose ps | awk 'NR>1 {print $1}')
```

## Functionality

You can visit [http://localhost:81/login](http://localhost:81/login) to login, then visit [http://localhost:81/private/asf](http://localhost:81/private/asf). It uses a cookie which I haven't set an expiry for yet. It seems to go when you close the browser.

You'll also see pages at `/`, `/db` and `/example` as well as a default 404 page.

Most of the pages are served by `www/lib/index.lua`. The `/example` page is served via `www/html/example/index.shtml` which uses server side includes. The paths to include actually resolve to `www/lib/index.lua` as well and used both for server-side includes and in the base template that the other pages use.

The blocks in the template are named **areas** to match the terminology of CSS Grid.


## Test

Run the headless browser tests (you might need `sudo` on Linux depending on your docker setup):

```sh
docker-compose build test && mkdir -p screenshots && docker-compose --profile test run --user $(id -u) -e 'URL=http://httpd:80' test
```
```
Creating lamp-lua_test_run ... done
Testing against: http://httpd:80
......
SUCCESS
See the screenshots directory.
```

You can change the value of `-e 'URL=http://httpd:80'` if you want to test a different URL instead, for example your staging environment.

At the moment the tests don't test login, private directory functionality or server side includes.


## Curl

This makes a real MariaDB query to render the JSON `{"hello": "world"}`.

```sh
$ curl http://localhost:81/db
```


## MariaDB

Access via phpMyAdmin on http://localhost:82 to set up a database. Use the username and password from `env/mariadb.env`. On clone of the repo, the user is `user` and the password is `password`.

Or use docker for CLI access. The settings you choose must match those in `env/mariadb.env` that MariaDB was started with:

```sh
docker-compose run mariadb mariadb -h mariadb -u user my_database -p
```

To delete all data used by the compose volumes you can run:

```sh
docker-compose down -v
```

To create new users:

```sh
docker-compose run httpd /usr/bin/user.sh james
```

## htmx

By default htmx is loaded from the CDN. If you want to load it yourself, you can get the latest version with:

```sh
curl https://unpkg.com/htmx.org/dist/htmx.min.js -L -o www/html/htmx.min.js
```

Then update the `top_shtml` variable in `var/lib/index.lua` to set the script tag.
