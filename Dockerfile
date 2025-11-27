# syntax=docker/dockerfile:1.7

# Stage 1 - Build frontend (Vite/static)
FROM node:20-bookworm-slim AS frontend
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Si existiera un proyecto Vite, instala dependencias; para el front estático actual basta con copiar los assets.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; elif [ -f package.json ]; then npm install; fi

# Copia el front estático actual (HTML + assets). Si añades Vite, ajusta el comando de build.
COPY assets ./assets
COPY *.html ./public/
RUN mkdir -p public/dist && \
    npm run build --if-present || true && \
    if [ -z "$(ls -A public/dist 2>/dev/null)" ]; then \
      cp -r assets public/dist/assets && cp public/*.html public/dist/; \
    fi

# Stage 2 - Backend Laravel (Apache + Composer)
FROM php:8.2-apache-bookworm AS backend

# Dependencias de sistema y extensiones PHP
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl unzip pkg-config \
    libzip-dev libonig-dev libxml2-dev libpq-dev libsqlite3-dev \
    && docker-php-ext-install pdo pdo_mysql pdo_sqlite mbstring zip \
    && rm -rf /var/lib/apt/lists/*

# Configuración de Apache para servir Laravel desde /public y permitir .htaccess
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
    APACHE_SERVER_NAME=localhost
RUN a2enmod rewrite && \
    sed -ri "s#/var/www/html#${APACHE_DOCUMENT_ROOT}#g" /etc/apache2/sites-available/000-default.conf && \
    printf "<Directory ${APACHE_DOCUMENT_ROOT}>\n\tAllowOverride All\n</Directory>\n" > /etc/apache2/conf-available/laravel.conf && \
    printf "ServerName ${APACHE_SERVER_NAME}\n" > /etc/apache2/conf-available/servername.conf && \
    a2enconf laravel servername

# Composer y opciones para descargas más estables
ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_MEMORY_LIMIT=-1 \
    COMPOSER_HTTP_TIMEOUT=600 \
    COMPOSER_PROCESS_TIMEOUT=600
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Instala dependencias PHP aprovechando la cache.
# Usa un secreto opcional GITHUB_TOKEN durante el build (BuildKit: --secret id=GITHUB_TOKEN).
COPY backend/composer.json backend/composer.lock ./
RUN --mount=type=secret,id=GITHUB_TOKEN \
    GITHUB_TOKEN_FILE=/run/secrets/GITHUB_TOKEN && \
    if [ -f "${GITHUB_TOKEN_FILE}" ]; then \
      GITHUB_TOKEN=$(cat "${GITHUB_TOKEN_FILE}"); \
    fi && \
    if [ -n "${GITHUB_TOKEN:-}" ]; then \
      composer config --global github-oauth.github.com "${GITHUB_TOKEN}"; \
    fi && \
    composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist --no-progress --ansi

# Copia el código de la app
COPY backend ./
RUN --mount=type=secret,id=GITHUB_TOKEN \
    GITHUB_TOKEN_FILE=/run/secrets/GITHUB_TOKEN && \
    if [ -f "${GITHUB_TOKEN_FILE}" ]; then \
      GITHUB_TOKEN=$(cat "${GITHUB_TOKEN_FILE}"); \
      composer config --global github-oauth.github.com "${GITHUB_TOKEN}"; \
    fi && \
    composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist --no-progress --ansi

# Copia el front compilado al public de Laravel
COPY --from=frontend /app/public/dist ./public/dist

# Prepara directorios requeridos y limpia caches de artisan (no requiere APP_KEY)
RUN mkdir -p storage/logs storage/framework/views storage/framework/cache bootstrap/cache database && \
    touch database/database.sqlite && \
    chown -R www-data:www-data storage bootstrap/cache database && \
    php artisan config:clear && \
    php artisan route:clear && \
    if [ -d resources/views ]; then php artisan view:clear; else echo "Skipping view:clear (no resources/views directory)"; fi

COPY backend/bin/apache-render-entrypoint.sh /usr/local/bin/apache-render-entrypoint.sh
RUN chmod +x /usr/local/bin/apache-render-entrypoint.sh

CMD ["apache-render-entrypoint.sh"]
