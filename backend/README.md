# EspacioX API Backend

Esta carpeta contiene la propuesta de backend Laravel API-first para el sistema de reservas.

## Requisitos

- PHP 8.3 con extensiones `dom`, `pdo_sqlite` (para desarrollo) y `pdo_mysql` si usarás MySQL.
- Composer.

## Puesta en marcha rápida (usando SQLite local)

1. Instalar dependencias: `cd backend && composer install --ignore-platform-req=ext-dom`
2. Clonar env: `cp .env.example .env`
3. Usar el wrapper que ya carga SQLite: `./bin/php artisan key:generate`
4. Migrar y seed de demo: `./bin/php artisan migrate:fresh --seed`
5. Levantar el servidor: `./bin/php -S localhost:8000 -t public`

El `.env` ya apunta a `DB_CONNECTION=sqlite` en `database/database.sqlite`.

### Usar MySQL en lugar de SQLite

1. Edita `.env` con tus credenciales MySQL (`DB_CONNECTION=mysql`, host, puerto, usuario, pass, base).
2. Asegúrate de tener instaladas las extensiones `pdo_mysql` y `mysqli`.
3. Ejecuta migraciones y seed: `php artisan migrate --seed` (o con `./bin/php` si necesitas cargar extensiones locales).

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

## Recursos JSON

- `SpaceResource`, `BookingResource`, `CalendarDayResource`, `AvailabilitySlotResource`
- Notificaciones por email al crear, confirmar o cancelar reservas

## Validaciones destacadas

- Anti-solape general mediante `Booking::overlaps`
- Horario definido por día vía `config/spaces.php`
- Reglas de capacidad, duración (1-12h) y bloques administrativos

## Contenedor Docker (PHP-FPM)

Se incluye un `Dockerfile` multi-stage en la raíz del repo:

```bash
docker build -t espaciox .
# Define APP_KEY y credenciales de DB al ejecutar; php-fpm expone el puerto 9000.
docker run --rm -p 9000:9000 -e APP_KEY=base64:... -e DB_HOST=... espaciox
```

El stage `frontend` copia los HTML y assets estáticos a `public/dist`. El stage final instala dependencias PHP y limpia caches de Laravel antes de arrancar `php-fpm`.
