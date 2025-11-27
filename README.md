# El Santuario

Landing estática para el salón privado El Santuario en Burgos. Incluye páginas de marketing, sección de blog y formularios básicos para simulación de reservas.

## Estructura del proyecto

- `index.html`: página de inicio con navegación hacia reservas, tarifas, instalaciones, blog y regalos.
- `reservas.html`: formulario para solicitar fecha y hora con validación en cliente.
- `tarifas.html`: detalle de planes y extras disponibles.
- `instalaciones.html`: descripción visual de las zonas del espacio.
- `blog.html`: listado de artículos con filtros por categoría.
- `regalos.html`: sección de bonos/regalos disponibles.
- `politica-privacidad.html`, `politica-cookies.html`, `normas-uso.html`, `aviso-legal.html`: páginas legales.
- `assets/css/styles.css`: estilos globales y componentes (tipografías, colores, tarjetas, botones, rejillas responsive).
- `assets/js/main.js`: interactividad mínima (menú móvil, simulación de disponibilidad, validación de reservas, filtro de blog).
- `backend/`: API Laravel para persistir reservas, usuarios y disponibilidad.

## Funcionalidades destacadas

- **Menú responsive**: botón hamburguesa que despliega la navegación móvil y mantiene accesibilidad con `aria-expanded`.
- **Simulador de calendario**: marca fechas ocupadas en el calendario de reservas.
- **Validación de formulario**: evita envíos vacíos y muestra mensajes de alerta para nombre, correo y fecha.
- **Filtros de blog**: botones que muestran/ocultan posts según categoría.

## Cómo ejecutar

### Front estático (marketing + reservas)

No hay dependencias de build; sirve los archivos estáticos desde la raíz del repositorio:

```bash
# Opción con Python 3
python -m http.server 8000
# Luego abre http://localhost:8000 en el navegador
```

### API Laravel (backend/)

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed    # usa SQLite por defecto
php artisan serve --host 0.0.0.0 --port 8001
```

El frontend consulta la API pública desplegada en Render (`https://espaciox.onrender.com/api`). Si quieres apuntar a la API local, sobrescribe `baseUrl` en `assets/js/main.js` o sirve un proxy inverso.

## Entornos recomendados

| Entorno   | Front estático                                      | API Laravel                               | Notas |
|-----------|------------------------------------------------------|-------------------------------------------|-------|
| Local     | `python -m http.server 8000`                         | `php artisan serve --port 8001`           | Usa `.env` con `APP_ENV=local`, DB SQLite. |
| Staging   | Vercel/Netlify/Pages apuntando al branch de pruebas  | Render/AlwaysData con base SQLite/MySQL   | Añade `APP_ENV=staging`, `APP_DEBUG=false`. |
| Producción | Hosting estático con HTTPS forzado                 | Render/Docker en servidor PHP 8.3         | `APP_ENV=production`, `APP_DEBUG=false`, habilita HTTPS y backups de DB. |

Notas de hosting:

- El front puede publicarse en GitHub Pages, Vercel, Netlify o Cloudflare Pages; solo necesita servir la carpeta raíz con HTTPS.
- La API requiere PHP 8.3, Composer y un servidor web apuntando a `backend/public`. Consulta `backend/HOSTING.md` para configuración paso a paso.
- Si Docker/Render necesita descargar dependencias de GitHub, pasa `GITHUB_TOKEN` como build-arg para evitar límites de rate:

  ```bash
  docker build --build-arg GITHUB_TOKEN=ghp_xxx -t espaciox .
  ```

## Mantenimiento rápido

- Mantén la navegación en `header` sincronizada en todas las páginas.
- Reutiliza las clases existentes de `styles.css` para nuevas secciones.
- Si añades nuevas interacciones, centralízalas en `assets/js/main.js` para mantener un único punto de scripts.

## Configuración de Codex Chat en VS Code

- Copia `.env.example` a `.env` y rellena `OPENAI_API_KEY` con tu clave válida (no se versiona).
- Opcional: define `OPENAI_API_BASE_URL` solo si tu endpoint difiere del valor por defecto de la extensión.
- Abre VS Code con `./scripts/open-vscode-with-env.sh` para exportar automáticamente las variables del `.env` al proceso de VS Code.
- `.vscode/settings.json` lee esas variables directamente del entorno, evitando hardcodear valores sensibles.

## Base de datos de prueba

Para levantar datos ficticios en local:

```bash
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan tinker # Opcional: crear reservas adicionales
```

Las migraciones crean un espacio inicial y reservas de ejemplo para validar el calendario.

## Validaciones SEO

- `npm run check:meta` revisa que cada HTML tenga `<title>`, `<link rel="canonical">` y `<meta name="robots">` antes de desplegar.
- Añádelo al pipeline (GitHub Actions, Vercel Hook, etc.) para bloquear un despliegue si falta alguno de esos tags y mantener la puntuación SEO alta.
- El workflow `.github/workflows/meta-guard.yml` ya implementa esa comprobación sobre `main` (push + PR) y fallará el flujo si detecta algún HTML sin los metadatos obligatorios.
- Para analizar métricas puedes ejecutar `node scripts/flow-espaciox.mjs` y comparar los reports. El nuevo workflow `.github/workflows/flow-compare.yml` corre ese Flow semanal, genera `flow-report-espaciox.html`/`flow-result-espaciox.json` y valida CLS/LCP/FCP/SEO frente a `flow-baseline.json`, fallando si se degradan.
