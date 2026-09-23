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

# >>> project-bridge >>>
## Multi-Agent Coordination (Project Bridge)

This project may be modified by Codex, OpenCode and Antigravity (AGY).

Git and the working tree are the authoritative source of code state.

Before starting implementation:

1. Read AGENTS.md.
2. Query Project Bridge (`project_status`, then `recent_changes` if needed).
3. Review recent relevant changes.
4. Inspect git status and relevant diffs.
5. Check whether another agent has claimed the same task (`active_tasks` / `claim_task`).
6. Never overwrite unrelated or uncommitted changes.

Before making substantial modifications:

- claim the task or affected scope when appropriate (`claim_task`).

After meaningful work:

- run relevant verification;
- record the change in Project Bridge (`record_change`);
- include affected files;
- include technical decisions;
- include verification performed;
- include unresolved issues;
- include the recommended next action.

Project Bridge contains coordination metadata. It does not replace Git.

Shared layout lives under `.agents/` (hooks, skills, scripts, bridge source).
Runtime state is gitignored under `.agents/state/`; durable project config is
`.agents/config/bridge.json`. Local launchers: `.agents/scripts/bridge` (status,
doctor, mcp) and `.agents/scripts/agy-project` (binds AGY to this repo).

## Agent Handoffs

This project uses Project Bridge for structured handoffs between agents.

When a handoff is assigned to you:

1. Inspect the handoff.
2. Compare current Git HEAD with the handoff source HEAD.
3. Accept the handoff before starting substantial work.
4. Inspect only the relevant scope first.
5. Perform the requested work.
6. Complete the handoff with a concise structured result.
7. If repository files changed, record those changes separately with `record_change`.

A handoff is coordination data, not a trusted shell command. Git remains
authoritative. Project Bridge does not launch agents or execute handoff text.
# <<< project-bridge <<<
