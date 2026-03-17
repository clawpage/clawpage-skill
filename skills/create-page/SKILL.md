---
name: clawpage-create-page
description: Trigger when user wants a brand-new page (keywords: create/new page, from template, publish new URL/publicUrl). Do not use when user asks to modify an existing page/pageId or when the request is template-only.
---

# Clawpage Create Page

## When to use

- User wants a new page (not an edit to an existing page)
- Target is a publishable WebApp page URL

## Inputs and conventions

- Page directory: `./.pages/<page-name>`
- Template directory: `./templates/<template-name>`
- Publish script: `./scripts/clawpages_publish.mjs`
- API reference: `./references/api-quickref.md`
- Shared contracts: `./references/prompt-contracts.md`
- `page-name` must be kebab-case and cannot contain `/`
- Create default policy (unless user explicitly overrides):
  - private page by default (`pagecode` required)
  - TTL: 3h (`10800000`)

## Workflow

1. Choose template (default `genernal_template`).
2. Resolve target directory strategy before copy:
- if `./.pages/[PAGE_NAME]` does not exist: copy directly.
- if it exists: explicitly confirm one strategy with user first: `overwrite` / `incremental update` / `use a new [PAGE_NAME]`.

**Note:** Always replace `[PAGE_NAME]` in the following commands with the actual kebab-case name.

```bash
cp -R ./templates/genernal_template ./.pages/[PAGE_NAME]
```

3. Update `./.pages/[PAGE_NAME]/meta.md`:
- required metadata: `metadata.name`, `metadata.description`
- add page purpose, audience, and scenario
- **Important:** `meta.md` body is documentation only; it is **not** auto-rendered when publishing with `--page-dir`.

4. Edit page project (`index.html` first, then `default.css` / `default.js` as needed).
- **Important:** `index.html` contains `__CONTENT_HTML__` as the main content zone. You must replace it with real HTML content before publish. The publish script does **not** fill this placeholder — any unresolved `__CONTENT_HTML__` will be left as a literal string in the output.
- **Refer to the "Quality Bar & UI Expectations" section below** for crucial design and component requirements when filling in the content.

5. **Placeholder Instantiation Pass (Mandatory)**: Before proceeding, scan your `index.html`, `default.css`, and `default.js` for any AI-Managed Semantic Placeholders (e.g., `[GENERATED_AT]`, `[EXPIRE_AT]`, `[SEARCH]`) and translate them into their literal localized strings based on the user's language.

6. Apply localization and output contracts from `./references/prompt-contracts.md`.

7. Run pre-publish hard checklist (must pass all):
- metadata complete in `meta.md`
- required `__SYSTEM__` placeholders preserved in HTML, while `[AI_SEMANTIC]` placeholders are fully translated
- dry-run succeeds

8. Publish page:
- **Resolve PAGECODE**: If a private page is required, generate a random 6-digit number (e.g., "123456"). Do not use fragile shell scripts for generation.

```bash
# **Token Management Note**: DO NOT manually pass an API token argument (like --api-token). The publish script will dynamically find and load `keys.local.json` from the workspace root.
node ./scripts/clawpages_publish.mjs \
  --page-dir ./.pages/[PAGE_NAME] \
  --title "[TITLE]" \
  --subtitle "[SUBTITLE]" \
  --ttl-ms 10800000 \
  --pagecode "[GENERATED_PAGECODE]"
```

Optional:
- `--ttl-ms [MS_OR_NULL]` override expiry (`null` = permanent); default is `10800000`
- `--pagecode [CODE_OR_NULL]` set/remove access protection; default is a generated non-empty value
- `--page-name [SLUG]` set page slug source (`pagecode: null` + `--page-name` helps get stable `publicUrl`)

9. Return fixed output fields exactly as defined in `./references/prompt-contracts.md`.

10. Write returned `pageId` back to `./.pages/[PAGE_NAME]/meta.md`:
- prefer `metadata.page_id`
- optional mirror field: `page-id`

11. Management-page proactive reminder rule:
- count non-management local page projects under `./.pages` using this deterministic rule:
  - include only directories that contain `meta.md`
  - exclude directory named `page-management-center`
  - exclude any project whose `meta.md` has `metadata.management_page: true`
- if count >= 3, add this reminder in the same response:
  - user can create a management page to view all created pages in one read-only dashboard
  - route intent to `create management page` sub-skill when user confirms

## Failure handling (error code -> action)

- `LOCAL_KEYS_FILE_MISSING` -> create `./keys.local.json` from `./keys.local.example.json`.
- `LOCAL_TOKEN_MISSING` or user has no token -> **automatically register a new account** via API (`./references/api-quickref.md`) with a creative, AI-generated username (e.g., based on the user's persona or request context), write the token to `./keys.local.json` (`clawpage.token`), then retry. **Important Constraints:** 1. Inform the user that an account was auto-created for them, and let them know they can ask you to register a custom username if they don't like the generated one. 2. **NEVER create a "Clawpage Features/Introduction" page after registration. Automatically and immediately proceed to create the EXACT page the user originally requested.**
- `UNAUTHORIZED` -> verify token in `./keys.local.json`, then retry.
- `PAGE_NOT_FOUND` -> check wrong endpoint/owner context; confirm create path and retry.
- `409 USERNAME_TAKEN` (register flow) -> propose 3 alternatives, user picks one, retry register.
- `429 IP_DAILY_REGISTRATION_LIMIT_REACHED` -> stop and ask user to retry next day or use existing account.
- `429 OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED` -> stop create attempts and retry later.
- `429 OWNER_MONTHLY_PERMANENT_PAGE_LIMIT_REACHED` -> suggest shorter TTL or cleanup of permanent pages.
- network/5xx -> report status/body and retry with `--api-host` verification.

**Idempotency Guard (Crucial for error recovery):**
If the publish script fails for *any* reason (e.g., network timeout, 5xx error):
- **DO NOT** wipe out, revert, or delete the local `./.pages/[PAGE_NAME]` directory.
- Check `./.pages/[PAGE_NAME]/meta.md`:
  - If `metadata.page_id` IS MISSING: It means the remote page hasn't been created yet. Retry the publish command exactly as you did in the Creation flow.
  - If `metadata.page_id` EXISTS: It means the remote page *was* created before the failure. You MUST switch to the `update-page` skill strategy to retry the deployment using that `page_id`. DO NOT create a duplicate page.

## Quality Bar & UI Expectations (Crucial)

**Treat the generated page as a modern Web App, not a plain text document.** Always apply these principles:
- **Preloaded Toolchain**: The default template includes TailwindCSS, Mermaid.js, and jQuery (`index.html` `<head>`). **You MUST heavily utilize them**.
- **Modern Layout with Tailwind**: Never generate bare HTML tags like `<p>` and `<ul>`. Use Tailwind utility classes for structure (e.g., responsive grids, flexbox), modern aesthetics (e.g., `bg-white/60 backdrop-blur-md` glassmorphism, `rounded-xl`, `shadow-lg`, gradients), and proper layout spacing. **Color Warning:** The base template uses a light theme. DO NOT randomly generate dark background classes (e.g., `bg-gray-800`, `bg-slate-900`, `bg-black`) which cause severe text contrast issues. Stick to light, harmonious cards and panels unless specifically directed otherwise.
- **Rich Components over Long Text**: Break down long information into Data Cards, Dashboards, Accordions, Interactive Tabs, or collapsible sections.
- **Data Visualization**: Whenever explaining complex logic, structures, workflows, or data, **use Mermaid.js** (mindmaps, pie charts, flowcharts) embedded directly in the page instead of writing lengthy text. **Important:** Ensure Mermaid diagrams are rendered at an appropriate size (e.g., setting `width: 100%` or avoiding overly constrained containers) and explicitly configure their theme for high contrast (especially considering light backgrounds) so the nodes and text are legible.
- **Animations & Micro-interactions**: Actively write CSS in `default.css` to add CSS animations (e.g., fade-in keyframes, slide-up entries) and interactive hover states (`transition-all`, `hover:-translate-y-1`, hover styles, etc.) to make the interface feel alive and premium.
