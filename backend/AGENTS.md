# Repository Guidelines

## Project Structure & Module Organization
- Static marketing pages sit at the repo root (`index.html`, `reservas.html`, legal pages) with shared styling in `assets/css`, scripts in `assets/js/main.js`, and media in `assets/img`.
- Frontend behavior extends `App` to keep booking flows centralized; prefer helpers over new globals.
- Laravel API code lives here (artisan, `app/`, `config/`, `routes/`); routes in `routes/api.php`, controllers in `app/Http/Controllers`, envs in `.env.example`/`.env`.
- `scripts/` holds automation; e2e specs belong in `tests/e2e/` (create if missing); Playwright artefacts go to `test-results/` and can be deleted.

## Build, Test & Development Commands
- Static preview: `python -m http.server 8000`.
- API bootstrap (SQLite dev): `cp .env.example .env && composer install && php artisan key:generate && php artisan migrate --seed && php artisan serve --port 8001`.
- Point the frontend to the local API by injecting `window.ESPACIOX_API_BASE = 'http://localhost:8001/api';` before loading `assets/js/main.js`.
- Backend tests: `php artisan test` (or `--filter BookingControllerTest`); seed deterministic testing DB with `php artisan migrate --seed --env=testing`.
- Frontend e2e: `npx playwright test` after `npm install`; clean `test-results/` before committing.
- Generate page screenshots: `node scripts/generate-page-images.mjs` once `OPENAI_API_KEY` is set.

## Coding Style & Naming Conventions
- HTML/CSS: two-space indent, hyphenated classes (`hero-content`, `btn secondary`); use design tokens in `assets/css/styles.css`.
- JavaScript: ES2015+; prefer `const`/`let`; extend `App`/`ApiService` rather than creating globals.
- Laravel/PHP: PSR-12; lean on route model binding; keep validation/authorization in Form Requests or policies.

## Testing Guidelines
- Name e2e specs by feature under `tests/e2e/`; keep fixtures deterministic; run with `npx playwright test`.
- Favor backend feature tests that cover booking flows and block overlap guards; run with `--env=testing` when seeding calendars.

## Commit & Pull Request Guidelines
- Commits: imperative, scoped by layer (e.g., `frontend: tighten booking form validation`, `backend: enforce block overlap guard`).
- PRs include a summary, verification steps, linked issues, UI screenshots/clips, and call out migrations/seeds/scripts reviewers must run.
- Never commit `.env`, keys, or generated assets; note required secrets (e.g., `OPENAI_API_KEY`) in the PR body.

## Security & Configuration Tips
- Start from `.env.example` and override via runtime env vars; avoid hardcoding API URLs in `assets/js/main.js`.
- Source `scripts/open-vscode-with-env.sh` so editors inherit env; keep production credentials in hosting dashboards.
- Production hardening: set `SESSION_SECURE_COOKIE=true`, align `SESSION_DOMAIN`/`SANCTUM_STATEFUL_DOMAINS` with deployed domains, and tighten CSP to your script/font origins. Serve assets versionados (hash) con `Cache-Control: public, max-age=31536000, immutable`; minify CSS/JS y usa gzip/brotli. Añade healthcheck simple (p.ej. `/api/health`) y logs estructurados para monitorizar.
- UX/SEO: asegúrate de títulos y meta description en todas las páginas, `lang="es"` en `<html>`, `aria-label` en iconos/menú, `aria-live` en avisos de formularios y `srcset`/dimensiones explícitas para imágenes.
