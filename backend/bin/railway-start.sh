#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${APP_KEY:-}" ]]; then
  echo "APP_KEY no está definido. Genera uno con 'php artisan key:generate --show' y súbelo a Railway." >&2
  exit 1
fi

# Asegura que la base de datos esté migrada; falla rápido si las credenciales son incorrectas.
php artisan migrate --force

if [[ "${SEED_DEMO:-false}" == "true" ]]; then
  php artisan db:seed --force
fi

# Servir la aplicación API.
php artisan serve --host 0.0.0.0 --port "${PORT:-8000}"
