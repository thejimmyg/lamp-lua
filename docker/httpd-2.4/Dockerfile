FROM httpd:2.4
# Copy apache vhost file to proxy php requests to php-fpm container
COPY php-fpm.conf /usr/local/apache2/conf/php-fpm.conf
RUN echo "Include /usr/local/apache2/conf/php-fpm.conf" \
    >> /usr/local/apache2/conf/httpd.conf
