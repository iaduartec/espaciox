# Repository Guidelines

## Project Structure & Module Organization

- Static marketing pages sit at the repo root (`index.html`, `reservas.html`, legal pages) and currently use minified assets under `assets/css` and `assets/js`; inspect the HTML before selecting an asset.
- Frontend behavior extends `App` to keep booking flows centralized; prefer helpers over new globals.
- Laravel API code lives here (artisan, `app/`, `config/`, `routes/`); routes in `routes/api.php`, controllers in `app/Http/Controllers`, envs in `.env.example`/`.env`.
- Repository-level automation is in `../scripts/`; backend work must not assume a local `scripts/` directory.

## Build, Test & Development Commands

- Static preview: `python -m http.server 8000`.
- First local SQLite initialization must refuse to continue if `.env` or `database/database.sqlite` already exists. Create both explicitly without overwriting, restrict the database file permissions, and disclose that `php artisan migrate --seed` changes schema and data before running it.
- Normal startup is `php artisan serve --host=127.0.0.1 --port=8001`; do not reinstall, regenerate keys, migrate, or seed as part of startup.
- Backend tests: `php artisan test` (or `--filter BookingControllerTest`). Use a dedicated testing environment; seeding is a mutating setup step, not a routine read-only check.
- Frontend E2E and generated-image tooling belong to the repository root. Use `../scripts/generate-page-images.mjs` only for explicitly requested AI asset generation, never as a screenshot check.

## Coding Style & Naming Conventions

- HTML/CSS lives outside this backend directory; inspect the currently referenced minified/versioned asset before changing it.
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

- Start from `.env.example` only for a new local environment and override through runtime configuration; do not hardcode API URLs into built/minified assets.
- From the repository root, inspect `scripts/open-vscode-with-env.sh` before sourcing it; keep production credentials in hosting dashboards.
- Production hardening: set `SESSION_SECURE_COOKIE=true`, align `SESSION_DOMAIN`/`SANCTUM_STATEFUL_DOMAINS` with deployed domains, and tighten CSP to your script/font origins. Serve assets versionados (hash) con `Cache-Control: public, max-age=31536000, immutable`; minify CSS/JS y usa gzip/brotli. Añade healthcheck simple (p.ej. `/api/health`) y logs estructurados para monitorizar.
- UX/SEO: asegúrate de títulos y meta description en todas las páginas, `lang="es"` en `<html>`, `aria-label` en iconos/menú, `aria-live` en avisos de formularios y `srcset`/dimensiones explícitas para imágenes.
