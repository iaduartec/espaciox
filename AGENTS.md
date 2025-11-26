# Repository Guidelines

## Project Structure & Module Organization
- Static marketing pages live at the root (`index.html`, `reservas.html`, legal pages) and share styling in `assets/css`, scripts in `assets/js/main.js`, and media in `assets/img`.
- Add UI behavior by extending `App` so booking flows stay centralized; avoid new globals.
- Laravel API is in `backend/` with routes in `routes/api.php`, controllers in `app/Http/Controllers`, and env config in `.env.example`/`.env`.
- Automation stays in `scripts/`; `test-results/` are disposable Playwright artefacts; keep e2e specs in `tests/e2e/` (create if needed).

## Build, Test & Development Commands
- Static preview: `python -m http.server 8000`.
- API bootstrap: `cd backend && cp .env.example .env && composer install && php artisan key:generate && php artisan migrate --seed && php artisan serve --port 8001`.
- Point the frontend to the local API by injecting `window.ESPACIOX_API_BASE = 'http://localhost:8001/api';` before loading `assets/js/main.js`.
- Node tooling (Playwright, image generator) only after `npm install`; generate page shots with `node scripts/generate-page-images.mjs` once `OPENAI_API_KEY` is in `.env`.

## Coding Style & Naming Conventions
- HTML/CSS: two-space indent; hyphenated classes (`hero-content`, `btn secondary`); rely on tokens at the top of `assets/css/styles.css` for spacing, color, and type.
- JavaScript: ES2015+, favor `const`/`let`; extend `App`/`ApiService` and reuse helpers instead of adding globals.
- Laravel/PHP: PSR-12; prefer route model binding; keep validation/authorization in Form Requests or policies.

## Testing Guidelines
- Frontend: store specs in `tests/e2e/`; run `npx playwright test`; delete `test-results/` before committing.
- Backend: run `php artisan test`, optionally `--filter BookingControllerTest`.
- Test data: use SQLite-backed `.env.testing`; apply migrations with `php artisan migrate --seed --env=testing` to keep calendars deterministic.

## Commit & Pull Request Guidelines
- Commits are imperative and scoped to a layer (e.g., `frontend: tighten booking form validation`, `backend: enforce block overlap guard`).
- PRs include a summary, verification steps, linked issue IDs, and screenshots/clips for UI changes; note migrations, seeds, or scripts reviewers must run.
- Never commit `.env`, keys, or large generated assets; mention required secrets in the PR body instead.

## Environment & Security Notes
- `.env.example` defines required Laravel and tooling variables (`APP_*`, DB settings, `OPENAI_API_KEY`, optional `ESPACIOX_API_BASE_URL`).
- Source `scripts/open-vscode-with-env.sh` so editors inherit the environment.
- Keep production credentials in hosting dashboards; override API URLs at runtime rather than editing `assets/js/main.js` to avoid leaks.
