# Guía operativa · El Santuario

Creado por Sergio Gómez Barrio — Duartec Instalaciones Informáticas (Burgos, España)

## Puesta en marcha local

- Backend (SQLite): `cp .env.example .env && composer install --ignore-platform-req=ext-dom && php artisan key:generate && php artisan migrate --seed && php artisan serve --port 8001`.
- Front estático: `cd public && python -m http.server 8000` o sirve `http://localhost:8001/reservas.html` desde Laravel.
- Base de la API sin tocar JS: prioriza `data-api-base` en `<html>`, o bien `window.ESPACIOX_API_BASE`, `<meta name="espaciox-api-base">` o un JSON embebido:

  ```html
  <html lang="es" data-api-base="http://localhost:8001/api">
  <!-- o -->
  <script id="espaciox-config" type="application/json">{"apiBase":"https://api.elsantuario.com"}</script>
  ```

- Tests: `./vendor/bin/phpunit` (simple smoke). Para datos deterministas en pruebas: `php artisan migrate --seed --env=testing`.

## Entornos y despliegue

- Variables clave: `APP_KEY`, `APP_URL`, `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE=true` en prod, `SANCTUM_STATEFUL_DOMAINS` alineado al dominio, DSN de base de datos y `OPENAI_API_KEY` solo si usas scripts Node.
- CORS: configurado para `localhost`, `espaciox.vercel.app`, `elsantuario.com`; añade otros dominios en `config/cors.php` antes de desplegar.
- Cacheo HTTP: HTML y API van con `no-cache`; solo `public/assets/*` se sirven como estáticos cacheables (1 año). Si versionas assets, mantén el querystring `?v=` o hashes.
- Seguridad: cookies HttpOnly (`espaciox_token`), cabeceras HSTS/CSP desde `SecurityHeaders`, rutas sensibles con throttle (`auth`, `booking-submission`). Activa HTTPS y revisa CSP si añades orígenes externos.

## Estructura recomendada

- `public/`: páginas estáticas (reservas, landing, legales), assets en `assets/css|js|img`. Evita duplicar hojas de estilo; extiende `assets/js/main.js` sobre la clase `App` para nuevos comportamientos.
- `app/`, `routes/`, `database/`: API Laravel (rutas en `routes/api.php`, requests en `app/Http/Requests`, policies/middleware en `app/Http/Middleware`).
- Automatización y e2e: `scripts/` y `tests/e2e/` (crea la carpeta si añades Playwright). `test-results/` es desechable y está ignorado.
- Al añadir nuevas páginas: conserva `<html lang="es">`, `<title>` + meta description/OG/Twitter, `aria-label` en navegación, `h1` único, imágenes con `width/height` + `loading="lazy"`/`decoding="async"`, y usa `skip-link`/`aria-live` para avisos.

## Backend y API

- Endpoints clave: `/api/register|login|logout|me`, `/api/spaces`, `/api/spaces/{space}/calendar`, `/api/spaces/{space}/availability`, `/api/bookings` (cliente), `/api/admin/*` (admin) y `/api/health`.
- Disponibilidad y calendario se cachean 1 minuto y se invalidan al crear/cancelar reservas o bloqueos (`SpaceCache`), manteniendo frescos los calendarios.
- Rate limiting: 60 rpm global `api`, 10 rpm `auth`, 20 rpm `booking-submission` (por email/IP). Ajusta en `RouteServiceProvider`.
- Tokens: login/registro devuelven cookie `espaciox_token` HttpOnly; las peticiones con `credentials: include` (fetch) usan middleware `AttachTokenFromCookie`.

## Checklist de despliegue/mantenimiento

- [ ] Variables de entorno listas (`APP_KEY`, `APP_URL`, dominios de sesión/Sanctum, DSN DB, HTTPS activo).
- [ ] `composer install --no-dev`, `php artisan migrate --seed` (según entorno), `php artisan optimize && php artisan config:cache route:cache`, `php artisan storage:link`.
- [ ] Limpiar caches previas (`cache:clear config:clear`) tras cambios de config/CORS.
- [ ] Revisar Lighthouse (accesibilidad + SEO), tamaños de imagen y lazy-load; evita subir PNG duplicados si existe WebP.
- [ ] Verificar CORS y `window.ESPACIOX_API_BASE`/`data-api-base` apuntando al entorno correcto.
- [ ] Ejecutar `./vendor/bin/phpunit` y, si aplica, Playwright (`npx playwright test`) limpiando `test-results/`.
- [ ] No commitear `.env`, `storage/`, `public/storage`, `vendor/`, `node_modules/`, artefactos de pruebas o claves.
