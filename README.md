# README


```
docker-compose up --remove-orphans --build
```

This creates a persistent volume for the MariaDB data (in the main docker volumes part of the filesystem, not the local directory) and starts all the services.

You can skip the `--build` flag after the first run unless you make changes in the `docker` folder.

Press Ctrl+C to stop the compose stack. Or run `docker-compose down` in a different terminal but in the same directory as the `compose.yml` file.


## Curl

```bash
$ curl http://localhost/db.php
["information_schema","my_database"]
$ curl -d 'my_database' http://localhost/db.php
["my_database"]
```

## MariaDB

Access via phpMyAdmin on http://localhost:8080 to set up a database. Use the username and password from `env/mariadb.env`.

Or use docker for CLI access. The password is `password`, and the other settings must match those in `env/mariadb.env`.

```
docker-compose run -it mariadb  mariadb -h mariadb -u user -p
```
