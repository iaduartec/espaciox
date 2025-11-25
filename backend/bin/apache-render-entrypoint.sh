#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-80}"
cd /var/www/html

# Ensure we have an APP_KEY in the environment and in .env so Laravel boots.
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

if [ -z "${APP_KEY:-}" ]; then
  # Try to read existing key from .env; otherwise, generate one.
  EXISTING_KEY=$(grep '^APP_KEY=' .env 2>/dev/null | cut -d= -f2- || true)
  if [ -n "${EXISTING_KEY}" ]; then
    export APP_KEY="${EXISTING_KEY}"
  else
    NEW_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")
    export APP_KEY="${NEW_KEY}"
    if grep -q '^APP_KEY=' .env 2>/dev/null; then
      sed -i "s/^APP_KEY=.*/APP_KEY=${NEW_KEY}/" .env
    else
      echo "APP_KEY=${NEW_KEY}" >> .env
    fi
  fi
fi

# Ajusta Apache para escuchar en el puerto que Render inyecta.
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/:80>/:${PORT}>/" /etc/apache2/sites-available/000-default.conf

exec apache2-foreground
