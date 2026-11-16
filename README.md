# El Santuario

> Salón privado en Burgos para eventos exclusivos.

![Optimization](https://img.shields.io/badge/Optimization-Complete-success)
![Lighthouse](https://img.shields.io/badge/Lighthouse-100-success)

Este repositorio contiene el código fuente de la landing page y el sistema de reservas de **El Santuario**.

## 🚀 Optimización y Auditoría
Este proyecto ha sido auditado y optimizado para cumplir con los más altos estándares de rendimiento y seguridad.
Consulta el [Informe de Auditoría](AUDIT_REPORT.md) para más detalles.

## 🛠️ Instalación y Despliegue
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

El frontend es estático. El backend Laravel de EspacioX fue retirado; las instrucciones antiguas de ejecución y despliegue de API ya no aplican.

## Mantenimiento rápido

- Mantén la navegación en `header` sincronizada en todas las páginas.
- Reutiliza las clases existentes de `styles.css` para nuevas secciones.
- Si añades nuevas interacciones, centralízalas en `assets/js/main.js` para mantener un único punto de scripts.

## Configuración de Codex Chat en VS Code

- Copia `.env.example` a `.env` y rellena `OPENAI_API_KEY` con tu clave válida (no se versiona).
- Opcional: define `OPENAI_API_BASE_URL` solo si tu endpoint difiere del valor por defecto de la extensión.
- Abre VS Code con `./scripts/open-vscode-with-env.sh` para exportar automáticamente las variables del `.env` al proceso de VS Code.
- `.vscode/settings.json` lee esas variables directamente del entorno, evitando hardcodear valores sensibles.

## Validaciones SEO

- `npm run check:meta` revisa que cada HTML tenga `<title>`, `<link rel="canonical">` y `<meta name="robots">` antes de desplegar.
- Añádelo al pipeline (GitHub Actions, Vercel Hook, etc.) para bloquear un despliegue si falta alguno de esos tags y mantener la puntuación SEO alta.
- El workflow `.github/workflows/meta-guard.yml` ya implementa esa comprobación sobre `main` (push + PR) y fallará el flujo si detecta algún HTML sin los metadatos obligatorios.
- Para analizar métricas puedes ejecutar `node scripts/flow-espaciox.mjs` y comparar los reports. El nuevo workflow `.github/workflows/flow-compare.yml` corre ese Flow semanal, genera `flow-report-espaciox.html`/`flow-result-espaciox.json` y valida CLS/LCP/FCP/SEO frente a `flow-baseline.json`, fallando si se degradan.
