#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-80}"

# Ajusta Apache para escuchar en el puerto que Render inyecta.
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/:80>/:${PORT}>/" /etc/apache2/sites-available/000-default.conf

exec apache2-foreground
