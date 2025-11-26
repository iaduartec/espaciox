# Repository Guidelines

## Project Structure & Module Organization

Static marketing pages (`index.html`, `reservas.html`, legal pages) live at the repo root and reuse styling, scripts, and media from `assets/css`, `assets/js/main.js`, and `assets/img`. Add new UI logic by extending the `App` class so booking flows and helpers stay centralized. The Laravel API resides in `backend/`, exposing endpoints through `routes/api.php` with feature controllers in `app/Http/Controllers`. Keep automation under `scripts/` (image generation, VS Code bootstrap) and treat `test-results/` as disposable Playwright artefacts.

## Build, Test & Development Commands

`python -m http.server 8000` serves the static frontend for local QA. Run `npm install` only when Playwright or the AI image generator is needed; execute `node scripts/generate-page-images.mjs` after setting `OPENAI_API_KEY` in `.env`. For the API, run `cd backend && cp .env.example .env && composer install && php artisan key:generate`, then `php artisan migrate --seed` and `php artisan serve --port 8001`. Point the frontend to the local API by injecting `window.ESPACIOX_API_BASE = 'http://localhost:8001/api';` before loading `assets/js/main.js`.

## Coding Style & Naming Conventions

HTML/CSS use two-space indentation and hyphenated classes (`hero-content`, `btn secondary`); keep typography, colors, and spacing tied to the tokens defined at the top of `assets/css/styles.css`. JavaScript stays ES2015+, favors `const`/`let`, and should extend helpers such as `ApiService` while avoiding new globals. Laravel code follows PSR-12, leans on route model binding, and keeps validation or authorization inside request classes or policies.

## Testing Guidelines

Store UI specs under `tests/e2e/` (create if missing) and run them with `npx playwright test`, cleaning `test-results/` before committing. Backend changes must pass `php artisan test`, optionally narrowed with `--filter BookingControllerTest`. Use a SQLite-backed `.env.testing`, running `php artisan migrate --seed --env=testing` to keep booking calendars deterministic.

## Commit & Pull Request Guidelines

Commits should be imperative and scoped to the affected layer (`frontend: tighten booking form validation`, `backend: enforce block overlap guard`). Every PR needs a summary, verification steps, linked issue IDs, and screenshots or clips for UI changes, plus notes about migrations, seeds, or scripts reviewers must run. Keep `.env`, API keys, and large generated assets out of version control; reference them in the PR body instead.

## Environment & Security Notes

`.env.example` is the contract for Laravel (`APP_*`, DB settings) and tooling variables (`OPENAI_API_KEY`, optional `ESPACIOX_API_BASE_URL`). Source `scripts/open-vscode-with-env.sh` before developing so VS Code inherits the same configuration. Keep production credentials inside their hosting dashboards and override API URLs at runtime rather than editing `main.js` to avoid leaks.
