# Espacio Río Norte

Landing estática para el salón privado Espacio Río Norte en Burgos. Incluye páginas de marketing, sección de blog y formularios básicos para simulación de reservas.

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
No hay dependencias ni build. Basta servir los archivos estáticos:

```bash
# Opción con Python 3
python -m http.server 8000
# Luego abre http://localhost:8000 en el navegador
```

## Mantenimiento rápido
- Mantén la navegación en `header` sincronizada en todas las páginas.
- Reutiliza las clases existentes de `styles.css` para nuevas secciones.
- Si añades nuevas interacciones, centralízalas en `assets/js/main.js` para mantener un único punto de scripts.
