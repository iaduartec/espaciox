# EspacioX API Backend

Esta carpeta contiene la propuesta de backend Laravel API-first para el sistema de reservas.

## Setup

1. Copia `.env.example` a `.env` y actualiza credenciales de base de datos.
2. Corre `composer install` desde esta carpeta.
3. Genera el `APP_KEY` y configura Sanctum si se usa en producción.
4. Ejecuta `php artisan migrate` para crear las tablas.

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
