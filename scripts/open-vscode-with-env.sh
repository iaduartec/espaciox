#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$repo_root/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$repo_root/.env"
  set +a
else
  echo "[espaciox] Aviso: no se encontró $repo_root/.env; se usará el entorno actual." >&2
fi

exec code "$repo_root" "$@"
