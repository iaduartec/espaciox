# syntax=docker/dockerfile:1.7

# Stage 1 - Build frontend (static)
FROM node:20-alpine AS frontend
# Use Alpine to reduce surface area. Install runtime certs and keep build deps only during npm install.
RUN apk add --no-cache ca-certificates curl openssl
WORKDIR /app

# Install npm deps (use virtual build deps for native modules)
COPY package*.json ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ && \
    if [ -f package-lock.json ]; then npm ci; elif [ -f package.json ]; then npm install; fi && \
    apk del .build-deps

# Copy static assets and build (noop if no build script)
COPY assets ./assets
COPY *.html ./public/
RUN mkdir -p public/dist && \
    npm run build --if-present || true && \
    if [ -z "$(ls -A public/dist 2>/dev/null)" ]; then \
      cp -r assets public/dist/assets && cp public/*.html public/dist/; \
    fi

# Stage 2 - Backend Laravel (PHP-FPM + Nginx on Alpine)
FROM php:8.2-fpm-alpine AS backend

# Install runtime deps, build deps for PHP extensions, nginx, and cleanup
RUN apk add --no-cache --virtual .build-deps \
        gcc g++ make autoconf nasm libtool pkgconfig python3 linux-headers \
    && apk add --no-cache \
        ca-certificates git curl unzip libzip-dev oniguruma-dev libxml2-dev \
        postgresql-dev sqlite-dev zlib-dev nginx \
    && docker-php-ext-install pdo pdo_mysql pdo_sqlite mbstring zip \
    && apk del .build-deps \
    && rm -rf /var/cache/apk/*

# Composer settings
ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_MEMORY_LIMIT=-1 \
    COMPOSER_HTTP_TIMEOUT=600 \
    COMPOSER_PROCESS_TIMEOUT=600
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP deps using composer (supports BuildKit secret for GitHub token)
COPY backend/composer.json backend/composer.lock ./
RUN --mount=type=secret,id=GITHUB_TOKEN \
    GITHUB_TOKEN_FILE=/run/secrets/GITHUB_TOKEN && \
    if [ -f "${GITHUB_TOKEN_FILE}" ]; then \
      GITHUB_TOKEN=$(cat "${GITHUB_TOKEN_FILE}"); \
      composer config --global github-oauth.github.com "${GITHUB_TOKEN}"; \
    fi && \
    composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist --no-progress --ansi

# Copy app code and run composer again to ensure vendor present
COPY backend ./
RUN --mount=type=secret,id=GITHUB_TOKEN \
    GITHUB_TOKEN_FILE=/run/secrets/GITHUB_TOKEN && \
    if [ -f "${GITHUB_TOKEN_FILE}" ]; then \
      GITHUB_TOKEN=$(cat "${GITHUB_TOKEN_FILE}"); \
      composer config --global github-oauth.github.com "${GITHUB_TOKEN}"; \
    fi && \
    composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist --no-progress --ansi

# Copy the built frontend into Laravel public
COPY --from=frontend /app/public/dist ./public/dist

# Ensure storage and cache dirs exist and are writable
RUN mkdir -p bootstrap/cache \
    storage/logs \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    database && \
    touch database/database.sqlite && \
    chmod -R 775 bootstrap/cache && \
    chown -R www-data:www-data storage bootstrap/cache database && \
    php artisan config:clear && \
    php artisan route:clear

# Nginx entrypoint + config
COPY backend/bin/nginx-render-entrypoint.sh /usr/local/bin/nginx-render-entrypoint.sh
COPY backend/nginx/default.conf /etc/nginx/http.d/default.conf
RUN chmod +x /usr/local/bin/nginx-render-entrypoint.sh

EXPOSE 80
CMD ["/usr/local/bin/nginx-render-entrypoint.sh"]

