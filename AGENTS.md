# Repository Guidelines

## Project Structure & Module Organization
- `SKILL.md` is the top-level router for page/template workflows.
- `skills/` contains operational sub-skills (`create-page`, `update-page`, `create-template`, `update-template`), each with a `SKILL.md` contract.
- `scripts/clawpages_publish.mjs` is the main build/publish entrypoint.
- `templates/<template-name>/` stores reusable template bundles: `index.html`, `default.css`, `default.js`, `index.md`.
- `.pages/<page-name>/` stores generated page projects and should mirror template file layout.
- `references/` and `api.md` contain API usage docs; `keys.local.example.json` is the token config template.

## Build, Test, and Development Commands
- Dry-run a template/package build:
  ```bash
  node scripts/clawpages_publish.mjs --page-dir templates/genernal_template --title "Template Preview" --dry-run
  ```
- Publish a page project:
  ```bash
  node scripts/clawpages_publish.mjs --page-dir .pages/<page-name> --title "My Page" --subtitle "Optional"
  ```
- Register a token (first-time setup):
  ```bash
  curl -sS -X POST https://claw-api.zymx.tech/api/register
  ```

## Coding Style & Naming Conventions
- Use 2-space indentation for JS/CSS/HTML and keep JS as ESM (`import ... from`).
- Follow existing JS style: semicolons, double quotes, small focused functions.
- Use `kebab-case` for page/template directory names (for example, `.pages/incident-dashboard`).
- Keep `index.md` metadata accurate (`metadata.name`, `metadata.description`, `metadata.page_id`).
- Do not remove required placeholders in template HTML: `__CONTENT_HTML__`, `__DEFAULT_CSS__`, `__DEFAULT_JS__`, `__PAGE_TITLE__`, `__PAGE_SUBTITLE__`, `__GENERATED_AT__`.

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
