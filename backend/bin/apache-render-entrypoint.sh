#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-80}"
APACHE_SERVER_NAME="${APACHE_SERVER_NAME:-localhost}"
cd /var/www/html

# Ensure we have an APP_KEY in the environment and in .env so Laravel boots.
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

# Populate APP_KEY if missing or placeholder.
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

# Ajusta Apache para escuchar en el puerto que Render inyecta.
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/:80>/:${PORT}>/" /etc/apache2/sites-available/000-default.conf
# Ensure ServerName is set to avoid Apache warnings
printf "ServerName %s\n" "${APACHE_SERVER_NAME}" > /etc/apache2/conf-available/servername.conf
a2enconf servername >/dev/null 2>&1 || true

exec apache2-foreground
