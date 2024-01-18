# README

The approach in this project is to use domain specific languages for domain specific tasks:

* HTTP - [Apache 2.4](https://httpd.apache.org/docs/2.4/) config format and [`.htaccess`](https://httpd.apache.org/docs/2.4/howto/htaccess.html) files
* HTML - [PHP 8.2](https://www.php.net/) deployed via [PHP-FPM](https://www.php.net/manual/en/install.fpm.php)
* JSON - SQL in [MariaDB 10.8.3](https://mariadb.com/kb/en/documentation/) via a small [PHP adapter](code/db.php) with a [phpMyAdmin](https://www.phpmyadmin.net/) admin interface
* Ops - [Docker](https://www.docker.com/products/docker-desktop/)

Next:

* Features - Gherkin with Behave in Python 3.11 driving Selenium with Chromedriver
* iOS/Android - React Native Webview powered by htmx

The idea is that the resulting application can be deployed on commodity shared hosting as well as production cloud infrastructure, but that there isn't anything needed for development except Docker. This should lower the barrier to contribution, and lower the barrier to deployment.

## Getting Started Locally

macOS - Make sure you have [installed git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Docker Desktop](https://www.docker.com/products/docker-desktop/) then start a bash shell like this (the default is `zsh` now but behaves very slightly differently):

```sh
bash
```

Linux - Install git, docker and docker compose, e.g. with `sudo apt install git docker.io docker-compose`

Windows - Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [Git for Windows](https://github.com/git-for-windows/git) (which also installs Git Bash and make which you'll need) then load a Git Bash shell.

Now you can just run this command (Linux uses may need to add their user to the `docker` group or use `sudo` before the command will run):

```sh
docker-compose --profile serve --profile debug up --remove-orphans --build
```

This creates a persistent volume for the MariaDB data (in the main docker volumes part of the filesystem, not the local directory) and starts all the services in the *serve* profile (`httpd`, `mariadb`, `php-fpm`) and the *debug* profile (`phpmyadmin`).

You can skip the `--build` flag after the first run unless you make changes in the `docker` folder.

Press Ctrl+C to stop the compose stack. Or run `docker-compose down` in a different terminal but in the same directory as the `compose.yml` file.

You can see memory usage like this:

```sh
docker stats $(docker-compose ps | awk 'NR>1 {print $1}')
```


## Curl

```sh
$ curl http://localhost:81/db.php
["information_schema","my_database"]
$ curl -d 'my_database' http://localhost:81/db.php
["my_database"]
```

## MariaDB

Access via phpMyAdmin on http://localhost:82 to set up a database. Use the username and password from `env/mariadb.env`. On clone of the repo, the user is `user` and the password is `password`.

Or use docker for CLI access. The settings you choose must match those in `env/mariadb.env` that MariaDB was started with:

```sh
docker-compose run -it mariadb  mariadb -h mariadb -u user -p
```
