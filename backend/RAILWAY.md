# Guía de despliegue en Railway (Laravel + MySQL)

Esta app Laravel está lista para Railway. La carpeta raíz del servicio debe ser `backend` (puedes configurarlo en la sección **Root Directory** de Railway). El archivo `.nixpacks.toml` fija PHP 8.3 con `pdo_mysql` y usa `./bin/railway-start.sh` como comando de arranque.

## 1) Crear el servicio en Railway

1. Conecta el repositorio y selecciona **Deploy from GitHub**.
2. Define `backend` como root. Railway detectará PHP/Laravel y usará el Nixpacks incluido.

## 2) Añadir base de datos MySQL

1. Agrega un servicio de MySQL.
2. Copia sus credenciales y súbelas como variables de entorno del servicio Laravel (o del proyecto):
   - `DB_CONNECTION=mysql`
   - `DB_HOST=<host>`
   - `DB_PORT=3306`
   - `DB_DATABASE=<db>`
   - `DB_USERNAME=<user>`
   - `DB_PASSWORD=<password>`

Puedes usar `backend/.env.railway.example` como plantilla.

## 3) Variables de aplicación

- `APP_KEY`: genera uno localmente con `php artisan key:generate --show` y pégalo.
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://<dominio-temporal-o-custom>`
- `SANCTUM_STATEFUL_DOMAINS=<dominio-del-front>`
- Opcional: `SEED_DEMO=true` si quieres cargar los datos demo en cada arranque (admin/cliente).

## 4) Migraciones y seeders

- El comando de arranque `./bin/railway-start.sh` ejecuta `php artisan migrate --force` antes de servir la app, y corre `php artisan db:seed --force` si `SEED_DEMO=true`.
- Para un primer bootstrap manual puedes hacer:

```bash
railway run php artisan migrate --force
railway run php artisan db:seed --force
```

## 5) Despliegue y verificación

1. Redeploy desde Railway.
2. Abre el dominio temporal, prueba el panel/admin con las credenciales seed (`admin@espaciox.demo` / `admin123`) si cargaste los datos demo.
3. Crea un artículo o recurso de prueba y verifica en la base de datos (Railway Data) que se guarda.

## 6) Notas del plan gratuito

- Railway ofrece ~$5 en créditos free; suficiente para demos y pruebas.
- El almacenamiento es efímero, así que no guardes ficheros persistentes en disco; la BD se mantiene en el servicio MySQL.
