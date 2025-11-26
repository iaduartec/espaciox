# Repository Guidelines

## Project Structure & Module Organization
Static marketing pages sit at the repo root (`index.html`, `reservas.html`, legal pages) and reuse shared styling in `assets/css`, scripts in `assets/js/main.js`, and media in `assets/img`. Add UI logic by extending the `App` class so booking flows and helpers stay centralized. The Laravel API lives in `backend/`, with routes in `routes/api.php` and controllers in `app/Http/Controllers`. Automation belongs in `scripts/`; `test-results/` are disposable Playwright artefacts.

## Build, Test & Development Commands
- `python -m http.server 8000` serves the static frontend for local QA.
- API local stack: `cd backend && cp .env.example .env && composer install && php artisan key:generate && php artisan migrate --seed && php artisan serve --port 8001`.
- Point the frontend to the local API by injecting `window.ESPACIOX_API_BASE = 'http://localhost:8001/api';` before loading `assets/js/main.js`.
- Install Node deps only when needed for Playwright or image generation; run `node scripts/generate-page-images.mjs` after setting `OPENAI_API_KEY` in `.env`.

## Coding Style & Naming Conventions
Use two-space indentation in HTML/CSS and hyphenated classes (`hero-content`, `btn secondary`); keep typography, colors, and spacing tied to the tokens at the top of `assets/css/styles.css`. JavaScript is ES2015+, favors `const`/`let`, and should extend helpers like `ApiService`/`App` instead of adding globals. Laravel follows PSR-12, leans on route model binding, and keeps validation/authorization inside Form Requests or policies.

## Testing Guidelines
Place UI specs under `tests/e2e/` (create if missing) and run with `npx playwright test`, clearing `test-results/` before committing. Backend changes must pass `php artisan test`; narrow with `--filter BookingControllerTest` when needed. Use a SQLite-backed `.env.testing` and run `php artisan migrate --seed --env=testing` to keep booking calendars deterministic.

## Commit & Pull Request Guidelines
Write imperative, scoped commits (e.g., `frontend: tighten booking form validation`, `backend: enforce block overlap guard`). PRs need a summary, verification steps, linked issue IDs, and screenshots/clips for UI changes, plus notes about migrations, seeds, or scripts reviewers must run. Keep `.env`, API keys, and large generated assets out of version control; reference them in the PR body instead.

## Environment & Security Notes
Treat `.env.example` as the contract for Laravel and tooling variables (`APP_*`, DB settings, `OPENAI_API_KEY`, optional `ESPACIOX_API_BASE_URL`). Source `scripts/open-vscode-with-env.sh` so editors inherit the environment. Keep production credentials inside hosting dashboards and override API URLs at runtime rather than editing `main.js` to avoid leaks.
