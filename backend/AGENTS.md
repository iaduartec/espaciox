# Repository Guidelines

## Project Structure & Module Organization
- Static marketing pages live at the repo root (`index.html`, `reservas.html`, legal pages) with shared styling in `assets/css`, scripts in `assets/js/main.js`, and media in `assets/img`.
- Add UI behavior by extending `App` so booking flows stay centralized; avoid new globals.
- Laravel API sits in `backend/` with routes in `routes/api.php`, controllers in `app/Http/Controllers`, and env config in `.env.example`/`.env`.
- Automation stays in `scripts/`; disposable Playwright artefacts go in `test-results/`; keep e2e specs in `tests/e2e/` (create it if needed).

## Build, Test & Development Commands
- Static preview: `python -m http.server 8000` from the repo root.
- API bootstrap: `cd backend && cp .env.example .env && composer install && php artisan key:generate && php artisan migrate --seed && php artisan serve --port 8001`.
- Point the frontend to the local API by injecting `window.ESPACIOX_API_BASE = 'http://localhost:8001/api';` before loading `assets/js/main.js`.
- Node tooling (Playwright, image generator) only after `npm install`; generate page shots with `node scripts/generate-page-images.mjs` when `OPENAI_API_KEY` is set.
- Backend tests: `cd backend && php artisan test` (optionally `--filter BookingControllerTest`). Frontend e2e: `npx playwright test`; delete `test-results/` before committing.

## Coding Style & Naming Conventions
- HTML/CSS: two-space indent; hyphenated classes (`hero-content`, `btn secondary`); reuse design tokens at the top of `assets/css/styles.css`.
- JavaScript: ES2015+, prefer `const`/`let`; extend `App`/`ApiService` and reuse helpers instead of adding globals.
- Laravel/PHP: PSR-12; prefer route model binding; keep validation/authorization in Form Requests or policies.

## Testing Guidelines
- Frontend specs live in `tests/e2e/`; keep names descriptive by feature. Run `npx playwright test`; prune `test-results/` artefacts after runs.
- Backend uses the Laravel test suite; seed deterministic calendars with `php artisan migrate --seed --env=testing` against SQLite `.env.testing`.

## Commit & Pull Request Guidelines
- Commits are imperative and scoped to a layer (e.g., `frontend: tighten booking form validation`, `backend: enforce block overlap guard`).
- PRs include a summary, verification steps, linked issue IDs, and screenshots/clips for UI changes; call out migrations, seeds, or scripts reviewers must run.
- Never commit `.env`, keys, or large generated assets; mention required secrets (like `OPENAI_API_KEY`) in the PR body instead.

## Security & Configuration Tips
- `.env.example` lists required Laravel and tooling variables; start from it rather than editing `assets/js/main.js` to set API URLs.
- Source `scripts/open-vscode-with-env.sh` so editors inherit the environment; keep production credentials in hosting dashboards.
