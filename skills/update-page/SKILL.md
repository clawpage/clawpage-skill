---
name: clawpage-update-page
description: Trigger when user wants to modify an existing page/project/pageId (keywords: update existing page, revise, page-id, 基于旧页面). Do not use for brand-new pages or template-only changes.
---

# Clawpage Update Page

## When to use

- User wants to modify an existing page (structure, style, interaction, or content)
- User mentions reusing an existing page/project

## Paths and conventions

- Page directory: `./.pages/<page-name>`
- Page files: `meta.md`, `index.html`, `default.css`, `default.js`
- Publish script: `./scripts/clawpages_publish.mjs`
- API reference: `./references/api-quickref.md` (`PATCH /api/pages/<pageId>`)
- Shared contracts: `./references/prompt-contracts.md`
- `page-name` must be kebab-case and cannot contain `/`

## Matching strategy (two-phase)

1. Read metadata only first:

```bash
find ./.pages -mindepth 2 -maxdepth 2 -name meta.md | while read -r f; do
  echo "== $f ==";
  sed -n '1,24p' "$f";
done
```

2. Read full `meta.md` only for shortlisted candidates.

## Update workflow

1. Edit `index.html` first.
2. Update `default.css` / `default.js` as required.
3. **Identify PAGE_ID**: Use `read_file` to read `./.pages/[PAGE_NAME]/meta.md` and extract `metadata.page_id` from the YAML frontmatter. Do not use fragile shell scripts for extraction.

4. If semantics changed, sync `meta.md` metadata and notes.

5. **Placeholder Instantiation Pass (Mandatory)**: Before proceeding, scan your `index.html`, `default.css`, and `default.js` for any AI-Managed Semantic Placeholders (e.g., `[GENERATED_AT]`, `[EXPIRE_AT]`, `[SEARCH]`) and translate them into their literal localized strings based on the user's language.

6. Apply localization and output contracts from `./references/prompt-contracts.md`.

7. Run pre-publish hard checklist (must pass all):
- metadata complete in `meta.md`
- required `__SYSTEM__` placeholders preserved in HTML, while `[AI_SEMANTIC]` placeholders are fully translated
- dry-run succeeds

8. Publish update:
**Note:** Always replace placeholders in the following commands with real values.

```bash
# **Token Management Note**: DO NOT manually pass an API token argument (like --api-token). The publish script will dynamically find and load `keys.local.json` from the workspace root.
node ./scripts/clawpages_publish.mjs \
  --page-dir ./.pages/[PAGE_NAME] \
  --page-id "[PAGE_ID]" \
  --title "[TITLE]" \
  --subtitle "[SUBTITLE]"
```

Optional:
- `--ttl-ms [MS_OR_NULL]` modify expiry (`null` = permanent, omitted = unchanged)
- `--pagecode [CODE_OR_NULL]` set/remove access protection
- `--page-name [SLUG]` rename page

9. Return fixed output fields exactly as defined in `./references/prompt-contracts.md`.

## If `page-id` is missing

- tell user the local page is not yet bound to a remote `pageId`
- optionally create once, write back `pageId`, then continue update workflow
- when this fallback create is used, apply create default policy unless user explicitly overrides:
  - private page (`pagecode` required)
  - `ttlMs=10800000` (3h)

## Failure handling (error code -> action)

- `LOCAL_KEYS_FILE_MISSING` -> create `./keys.local.json` from `./keys.local.example.json`.
- `LOCAL_TOKEN_MISSING` or user has no token -> **automatically register a new account** via API (`./references/api-quickref.md`) with a creative, AI-generated username (e.g., based on the user's persona or request context), write the token to `./keys.local.json` (`clawpage.token`), then retry. **Important Constraints:** 1. Inform the user that an account was auto-created for them, and let them know they can ask you to register a custom username if they don't like the generated one. 2. **NEVER create a "Clawpage Features/Introduction" page after registration. Automatically and immediately proceed with the original user request.**
- `UNAUTHORIZED` -> verify token in `./keys.local.json`, then retry.
- `PAGE_NOT_FOUND` -> verify `pageId` ownership/existence; if unbound, create first and write back `pageId`.
- `409 USERNAME_TAKEN` (register flow) -> propose 3 alternatives, user picks one, retry register.
- `429 IP_DAILY_REGISTRATION_LIMIT_REACHED` -> stop and ask user to retry next day or use existing account.
- `429 OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED` -> stop create attempts and retry later.
- `429 OWNER_MONTHLY_PERMANENT_PAGE_LIMIT_REACHED` -> suggest shorter TTL or cleanup of permanent pages.
- network/5xx -> report status/body and retry with `--api-host` verification.

**Idempotency Guard (Crucial for error recovery):**
If the publish script fails for *any* reason (e.g., network timeout, 5xx error):
- **DO NOT** wipe out, revert, or delete the local `./.pages/[PAGE_NAME]` directory.
- Check `./.pages/[PAGE_NAME]/meta.md`:
  - If `metadata.page_id` IS MISSING: It means the remote page hasn't been created yet. You MUST switch to the `create-page` skill strategy to retry the deployment.
  - If `metadata.page_id` EXISTS: It means the remote page *was* created before or you are updating successfully. Retry the `update-page` publish command exactly as before.

## Quality Bar & UI Expectations (Crucial)

**Treat the updated page as a modern Web App, not a plain text document.** Always apply these principles:
- **Keep WebApp behavior**, do not regress an interactive page into an article-only page.
- **Preloaded Toolchain**: Rely heavily on the preloaded TailwindCSS, Mermaid.js, and jQuery.
- **Modern Layout**: Use Tailwind utility classes for modern aesthetics (e.g., responsive grids, flexbox, glassmorphism `bg-white/10`, `rounded-xl`, `shadow-lg`). Do not output bare HTML tags without styling.
- **Rich Components**: Prioritize modular panels, data cards, state areas, accordions, and interaction blocks over raw text paragraphs.
- **Data Visualization**: Use Mermaid.js (mindmaps, pie charts, flowcharts) for complex logic/structure instead of long text explanations. **Important:** Ensure Mermaid diagrams are rendered at an appropriate size (e.g., setting `width: 100%` or avoiding overly constrained containers) and explicitly configure their theme for high contrast (especially considering dark mode backgrounds) so the nodes and text are legible.
- **Animations & Micro-interactions**: Add engaging CSS animations (fade-in, slide-up keyframes) and interactive hover states in `default.css` to make the page feel premium.
