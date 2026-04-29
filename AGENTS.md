# Repository Guidelines

## Project Structure & Module Organization
- `SKILL.md` is the top-level router for page/template workflows.
- `skills/` contains operational sub-skills (`create-page`, `update-page`, `create-management-page`, `create-template`, `update-template`), each with a `SKILL.md` contract.
- `scripts/clawpages_publish.mjs` is the main build/publish entrypoint.
- `templates/<template-name>/` stores reusable template bundles: `index.html`, `default.css`, `default.js`, `meta.md`.
- **Generated page projects do NOT live inside this repo.** They are written to `$PAGES_DIR/<page-name>/` — default `$PWD/.pages` (user's current working directory), overridable to `/tmp/clawpage-pages` or any absolute path. The skill install tree (`$SKILL_DIR`) is treated as read-only.
- `references/` (especially `references/api-quickref.md`) contains API usage docs; `keys.local.example.json` is the token config template.

## Path Conventions
- `$SKILL_DIR` — this skill's install directory (`templates/`, `scripts/`, `references/`, `keys.local.json`). Read-only.
- `$PAGES_DIR` — where generated page projects live. Default `$PWD/.pages`; user may specify `/tmp/clawpage-pages` or any absolute path at invocation time.
- `$PAGE_DIR` = `$PAGES_DIR/<page-name>`.

## Build, Test, and Development Commands
- Dry-run a template/package build:
  ```bash
  node "$SKILL_DIR/scripts/clawpages_publish.mjs" --page-dir "$SKILL_DIR/templates/general_template" --title "Template Preview" --dry-run
  ```
- Publish a page project:
  ```bash
  node "$SKILL_DIR/scripts/clawpages_publish.mjs" --page-dir "$PAGES_DIR/<page-name>" --title "My Page" --subtitle "Optional"
  ```
- Register a token (first-time setup):
  ```bash
  curl -sS -X POST https://api.clawpage.ai/api/register \
    -H 'Content-Type: application/json' \
    -d '{"username":"<username>"}'
  ```

## Coding Style & Naming Conventions
- Use 2-space indentation for JS/CSS/HTML and keep JS as ESM (`import ... from`).
- Follow existing JS style: semicolons, double quotes, small focused functions.
- Use `kebab-case` for page/template directory names (for example, `$PAGES_DIR/incident-dashboard`).
- Keep `meta.md` metadata accurate (`metadata.name`, `metadata.description`, `metadata.page_id`).
- Do not remove required placeholders in template HTML: `__CONTENT_HTML__`, `__DEFAULT_CSS__`, `__DEFAULT_JS__`.

## Clawpage Browser SDK (page-side JS)
- All page-side JS that hits Clawpage APIs (data tables, atomic incr, short links, stats, blobs, `/api/me`) MUST use the Browser SDK: `https://clawpage.ai/sdk.js` (IIFE, exposes `window.Clawpage`) or `https://clawpage.ai/sdk.mjs` (ESM). Raw `fetch('/api/...')` in page HTML/JS is forbidden going forward.
- CLI scope (Node scripts in `$SKILL_DIR/scripts/*.mjs`, Node-based sub-skills `manage-data` / `manage-blobs` / `manage-links` / `view-stats`) may keep using raw `fetch` / `curl` — the SDK is browser-targeted.
- Owner `sk_*` tokens must NEVER appear in public-page JS; allowed only in pagecode-protected management pages or CLI/server contexts.
- See also: `skills/use-sdk/SKILL.md`.

## Testing Guidelines
- No automated test framework is currently configured; use publish-script validation as the test gate.
- For template changes, run `--dry-run` and confirm generated output is valid HTML.
- For page updates, verify returned fields include URL, `pageId`, TTL/expires info, and password status.
- Manually smoke-test mobile and desktop rendering for UI changes.

## Commit & Pull Request Guidelines
- Git history is not available in this workspace snapshot; use Conventional Commit style (for example, `feat: add dashboard template`, `fix: preserve page_id on update`).
- Keep commits scoped to one area (`scripts`, `templates`, `skills`, `docs`).
- PRs should include purpose, changed paths, verification commands run, and preview URL/screenshot for page/template UI changes.

## Security & Configuration Tips
- Never commit real credentials from `keys.local.json`; keep secrets local and share only via secure channels.
- Use `keys.local.example.json` as the committed baseline for config shape.
