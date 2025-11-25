# Requisitos de hosting para dominio y API

La landing estática vive en la raíz del repositorio y puede servirse en cualquier hosting de archivos estáticos. La API está en `/backend` y es una app Laravel orientada a API. Asegúrate de separar front (dominio principal) y API (subdominio o ruta) para simplificar certificados y caché.

## Front (dominio principal)

- **Tipo de hosting:** servidor de archivos estáticos (Nginx/Apache con `root` a la carpeta del proyecto) o CDN con origen estático.
- **Runtime necesario:** ninguno; basta con servir los `.html`, `assets/css`, `assets/js` y fuentes.
- **HTTPS y dominio:** apunta el dominio principal al host estático y fuerza HTTPS (HTTP->HTTPS) para evitar bloqueos de contenido mixto.
- **Headers recomendados:** `Cache-Control` en assets, compresión gzip/brotli y `Content-Type` correcto para `.css`/`.js`.

## API (subdominio p. ej. api.midominio.com)

- **PHP:** 8.3.x con extensiones `dom`, `pdo_sqlite` (para desarrollo o tests) y `pdo_mysql` si usas MySQL. Composer disponible para instalar dependencias.
- **Servidor web:** Nginx/Apache apuntando el `document root` a `backend/public` y ejecutando PHP vía PHP-FPM. Activa HTTPS en el subdominio.
- **Base de datos:**
  - Desarrollo/simple: SQLite con archivo en `backend/database/database.sqlite` y permisos de escritura.
  - Producción: MySQL 8 o compatible, con extensiones `pdo_mysql`/`mysqli` habilitadas.
- **Archivos y permisos:**
  - Permisos de escritura para `backend/storage` y `backend/bootstrap/cache`.
  - Configura el usuario de PHP-FPM para que tenga acceso a esos directorios.
- **Variables de entorno:** copia `.env` desde `.env.example`, define `APP_KEY`, `APP_URL`, credenciales de DB y `SANCTUM_STATEFUL_DOMAINS` con el dominio del front.
- **Jobs y caché:** drivers por defecto son `file` y `sync`, por lo que no se necesita Redis/cola dedicada, pero puedes habilitarlos si tu hosting los ofrece.

## Despliegue mínimo

1. Instala dependencias en el servidor: `cd backend && composer install --optimize-autoloader --no-dev`.
2. Genera clave y migra base de datos (`php artisan key:generate` y `php artisan migrate --seed`).
3. Configura el vhost a `backend/public`, habilita HTTPS y reinicia PHP-FPM.
4. Sube el front a tu hosting estático y apunta el dominio principal a esa ubicación.
