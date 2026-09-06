# Repository Guidelines

## Project Structure & Module Organization

- Static marketing pages live at the root (`index.html`, `reservas.html`, legal pages) and currently load the versioned/minified assets in `assets/css` and `assets/js`; inspect the HTML before choosing an asset to edit.
- Add UI behavior by extending `App` so booking flows stay centralized; avoid new globals.
- Laravel API is in `backend/` with routes in `routes/api.php`, controllers in `app/Http/Controllers`, and env config in `.env.example`/`.env`.
- Automation stays in `scripts/`; `test-results/` are disposable Playwright artefacts; keep e2e specs in `tests/e2e/` (create if needed).

## Build, Test & Development Commands

- Static preview: `python -m http.server 8000`.
- First local API initialization is separate from normal startup. Refuse to initialize if `backend/.env` or `backend/database/database.sqlite` already exists. For a new local SQLite environment, copy `.env.example` without overwriting, create the SQLite file with restrictive permissions, install dependencies only when requested/needed, generate the key, and explain that `migrate --seed` mutates the new local database before running it.
- Normal API startup is `cd backend && php artisan serve --host=127.0.0.1 --port=8001`; it must not regenerate keys, reinstall dependencies, migrate, or seed data.
- Point the frontend to the local API through the configuration mechanism used by the current HTML. Do not refer to a source asset that is absent.
- `scripts/generate-page-images.mjs` generates and overwrites image assets through an external AI API; it is not a screenshot test. Run it only when explicitly requested, after inspecting its outputs and dependencies, with separate authorization for API cost and asset replacement.

## Coding Style & Naming Conventions

- HTML/CSS: two-space indent; hyphenated classes (`hero-content`, `btn secondary`); inspect the currently referenced stylesheet before editing tokens.
- JavaScript: ES2015+, favor `const`/`let`; extend `App`/`ApiService` and reuse helpers instead of adding globals.
- Laravel/PHP: PSR-12; prefer route model binding; keep validation/authorization in Form Requests or policies.

## Testing Guidelines

- Frontend: store specs in `tests/e2e/`; run `npx playwright test`. Do not delete existing test artifacts unless they were created by the current task and are confirmed disposable.
- Backend: run `php artisan test`, optionally `--filter BookingControllerTest`.
- Test data: use SQLite-backed `.env.testing`; apply migrations with `php artisan migrate --seed --env=testing` to keep calendars deterministic.

## Commit & Pull Request Guidelines

- Commits are imperative and scoped to a layer (e.g., `frontend: tighten booking form validation`, `backend: enforce block overlap guard`).
- PRs include a summary, verification steps, linked issue IDs, and screenshots/clips for UI changes; note migrations, seeds, or scripts reviewers must run.
- Never commit `.env`, keys, or large generated assets; mention required secrets in the PR body instead.

## Environment & Security Notes

- `.env.example` defines required Laravel and tooling variables (`APP_*`, DB settings, `OPENAI_API_KEY`, optional `ESPACIOX_API_BASE_URL`).
- Source `scripts/open-vscode-with-env.sh` so editors inherit the environment.
- Keep production credentials in hosting dashboards; override API URLs at runtime rather than hardcoding them into the currently referenced minified asset.
