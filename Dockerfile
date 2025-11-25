# Stage 1 - Build frontend (static/Vite-ready)
FROM node:20-slim AS frontend
WORKDIR /app

# Si existiera un proyecto Vite, instala dependencias; para el front estático actual basta con copiar los assets.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; elif [ -f package.json ]; then npm install; fi

# Copia el front estático actual (HTML + assets). Si añades Vite, ajusta el comando de build.
COPY assets ./assets
COPY *.html ./
RUN mkdir -p dist && cp -r assets dist/ && cp ./*.html dist/

# Stage 2 - Backend Laravel (PHP-FPM + Composer)
FROM php:8.2-fpm AS backend

# Dependencias de sistema y extensiones PHP
RUN apt-get update && apt-get install -y \
    git curl unzip libzip-dev libonig-dev libxml2-dev libpq-dev \
    && docker-php-ext-install pdo pdo_mysql pdo_sqlite mbstring zip \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Instala dependencias PHP aprovechando la cache
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copia el código de la app
COPY backend ./

# Copia el front compilado al public de Laravel
COPY --from=frontend /app/dist ./public/dist

# Opcional: limpia caches de artisan (no requiere APP_KEY)
RUN php artisan config:clear && \
    php artisan route:clear && \
    php artisan view:clear

# Permisos para logs y cachés
RUN chown -R www-data:www-data storage bootstrap/cache

USER www-data
CMD ["php-fpm"]
