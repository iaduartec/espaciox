#!/usr/bin/env sh
set -euo pipefail

PORT="${PORT:-80}"
SERVER_NAME="${SERVER_NAME:-localhost}"
cd /var/www/html

# Ensure .env exists
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

# Populate APP_KEY if missing
if [ -z "${APP_KEY:-}" ]; then
  EXISTING_KEY=$(grep '^APP_KEY=' .env 2>/dev/null | cut -d= -f2- || true)
  case "${EXISTING_KEY}" in
    ""|"base64:GENERATE_KEY")
      NEW_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")
      export APP_KEY="${NEW_KEY}"
      if grep -q '^APP_KEY=' .env 2>/dev/null; then
        sed -i "s/^APP_KEY=.*/APP_KEY=${NEW_KEY}/" .env
      else
        echo "APP_KEY=${NEW_KEY}" >> .env
      fi
      ;;
    *)
      export APP_KEY="${EXISTING_KEY}"
      ;;
  esac
fi

# Prepare SQLite if used
DB_CONNECTION_ENV="${DB_CONNECTION:-}"
if [ -z "${DB_CONNECTION_ENV}" ] && [ -f .env ]; then
  DB_CONNECTION_ENV=$(grep '^DB_CONNECTION=' .env | cut -d= -f2-)
fi

if [ "${DB_CONNECTION_ENV}" = "sqlite" ]; then
  DB_DATABASE_ENV="${DB_DATABASE:-}"
  if [ -z "${DB_DATABASE_ENV}" ] && [ -f .env ]; then
    DB_DATABASE_ENV=$(grep '^DB_DATABASE=' .env | cut -d= -f2-)
  fi

  DB_DATABASE_ENV="${DB_DATABASE_ENV:-database/database.sqlite}"
  DB_DIR=$(dirname "${DB_DATABASE_ENV}")
  mkdir -p "${DB_DIR}"
  touch "${DB_DATABASE_ENV}"
  chown -R www-data:www-data storage bootstrap/cache "${DB_DIR}"
fi

# Configure nginx port and server_name in http.d config
if [ -f /etc/nginx/http.d/default.conf ]; then
  sed -i "s/listen 80;/listen ${PORT};/" /etc/nginx/http.d/default.conf || true
  sed -i "s/server_name _;/server_name ${SERVER_NAME};/" /etc/nginx/http.d/default.conf || true
fi

# Ensure nginx runtime dirs
mkdir -p /run/nginx

# Start php-fpm in background, then run nginx in foreground
php-fpm -D
exec nginx -g 'daemon off;'