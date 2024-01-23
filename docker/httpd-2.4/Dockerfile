FROM httpd:2.4

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libaprutil1-dbd-mysql \
    luarocks \
    lua5.2 \
    liblua5.2-dev \
    build-essential \
    default-mysql-client && \
    rm -rf /var/lib/apt/lists/* && \
    luarocks-5.2 install bcrypt

# Copy apache vhost file to proxy php requests to php-fpm container
COPY lua.conf /usr/local/apache2/conf/lua.conf
RUN echo "Include /usr/local/apache2/conf/lua.conf" \
    >> /usr/local/apache2/conf/httpd.conf
