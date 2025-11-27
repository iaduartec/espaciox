# EspacioX API Backend

Propuesta API-first en Laravel para el sistema de reservas de El Santuario, con landing estática en `public/`.

## Arquitectura rápida
- `public/`: páginas estáticas (p.ej. `reservas.html`), estilos en `assets/css/styles.css` y lógica en `assets/js/main.js` (lee `window.ESPACIOX_API_BASE` o el meta `espaciox-api-base` para apuntar a la API).
- API Laravel: rutas en `routes/api.php`, controladores en `app/Http/Controllers`, requests en `app/Http/Requests`, resources en `app/Http/Resources` y modelos en `app/Models`.
- Datos: migraciones y seeders en `database/` (SQLite por defecto en `database/database.sqlite`); usa `.env.testing` para pruebas.
- Infra: helpers en `bin/` (PHP con extensiones, arranque Railway), caches en `bootstrap/cache/`, logs/archivos en `storage/`.

## Requisitos
- PHP 8.3 con `dom`, `pdo_sqlite` (dev) y `pdo_mysql` si usarás MySQL.
- Composer. Node.js solo si ejecutas Playwright u otros scripts opcionales.

## Puesta en marcha rápida (SQLite)
1. `cp .env.example .env`
2. `composer install --ignore-platform-req=ext-dom`
3. `php artisan key:generate`
4. `php artisan migrate:fresh --seed`
5. `php artisan serve --port 8001`

Frontend: abre `http://localhost:8001/reservas.html` (sirve `public/`). Si usas un servidor estático aparte (`cd public && python -m http.server 8000`), injerta antes de cargar `assets/js/main.js`:

```html
<script>window.ESPACIOX_API_BASE = 'http://localhost:8001/api';</script>
```

## Comandos útiles
- Migraciones/seeds: `php artisan migrate --seed`
- Tests backend: `php artisan test` (o `php artisan test --filter BookingControllerTest`)
- Optimización prod: `php artisan optimize`, `php artisan storage:link`
- Limpiar caches: `php artisan cache:clear && php artisan config:clear`

## Testing
- Backend: usa el suite de Laravel; para datos deterministas: `php artisan migrate --seed --env=testing`.
- E2E (Playwright, si se añade): specs en `tests/e2e/`; ejecuta `npx playwright test` tras `npm install` y borra `test-results/` antes de commitear.

## Seguridad y configuración
- Parte de `.env.example` y no subas `.env` ni claves; fija `APP_KEY`, `APP_URL`, `SANCTUM_STATEFUL_DOMAINS` y el DSN de base de datos.
- Define la base de la API sin tocar assets: `window.ESPACIOX_API_BASE` o meta `espaciox-api-base`.
- En producción fija `APP_DEBUG=false` y ejecuta `php artisan config:cache route:cache`.

## Endpoints principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | /api/register | Registro de cliente y token Sanctum |
| POST | /api/login | Login y token |
| POST | /api/logout | Revoca token |
| GET | /api/me | Datos del cliente autenticado |
| GET | /api/spaces | Lista de espacios activos |
| GET | /api/spaces/{space}/calendar | Calendario mensual con status |
| GET | /api/spaces/{space}/availability | Slots disponibles por hora |
| POST | /api/bookings | Crear reserva autenticada |
| GET | /api/bookings/my | Lista de reservas del cliente |
| PATCH | /api/bookings/{booking}/cancel | Cancela una reserva futura |
| GET | /api/admin/bookings | Filtrado admin |
| PATCH | /api/admin/bookings/{booking}/confirm | Confirmar reserva |
| PATCH | /api/admin/bookings/{booking}/cancel | Cancelar reserva |
| POST | /api/admin/blocks | Crear bloqueos de espacio |

## Contenedor Docker (Apache)

Se incluye un `Dockerfile` multi-stage en la raíz:

```bash
docker build -t espaciox .
docker run --rm -p 8080:8080 -e PORT=8080 -e APP_KEY=base64:... -e DB_HOST=... espaciox
```

El stage `frontend` copia `public` y assets; el final instala dependencias PHP, sirve `backend/public` con Apache y ejecuta limpiezas de cache (`config:cache`, `route:cache`).
