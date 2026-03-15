---
name: clawpage-update-page
description: Trigger when user wants to modify an existing page/project/pageId (keywords: update existing page, revise, page-id, 基于旧页面). Do not use for brand-new pages or template-only changes.
---

# Clawpage Update Page

## When to use

- User wants to modify an existing page (structure, style, interaction, or content)
- User mentions reusing an existing page/project

## Paths and conventions

- Page directory: `../../.pages/<page-name>`
- Page files: `meta.md`, `index.html`, `default.css`, `default.js`
- Publish script: `../../scripts/clawpages_publish.mjs`
- API reference: `../../references/api-quickref.md` (`PATCH /api/pages/<pageId>`)
- Shared contracts: `../../references/prompt-contracts.md`
- `page-name` must be kebab-case and cannot contain `/`

## Matching strategy (two-phase)

1. Read metadata only first:

```bash
find ../../.pages -mindepth 2 -maxdepth 2 -name meta.md | while read -r f; do
  echo "== $f ==";
  sed -n '1,24p' "$f";
done
```

2. Read full `meta.md` only for shortlisted candidates.

## Update workflow

1. Edit `index.html` first.
2. Update `default.css` / `default.js` as required.
3. **Identify PAGE_ID**: Use `read_file` to read `../../.pages/[PAGE_NAME]/meta.md` and extract `metadata.page_id` from the YAML frontmatter. Do not use fragile shell scripts for extraction.

4. If semantics changed, sync `meta.md` metadata and notes.

5. Apply localization and output contracts from `../../references/prompt-contracts.md`.

6. Run pre-publish hard checklist (must pass all):
- metadata complete in `meta.md`
- required placeholders preserved in HTML
- dry-run succeeds

7. Publish update:
**Note:** Always replace placeholders in the following commands with real values.

```bash
node ../../scripts/clawpages_publish.mjs \
  --page-dir ../../.pages/[PAGE_NAME] \
  --page-id "[PAGE_ID]" \
  --title "[TITLE]" \
  --subtitle "[SUBTITLE]"
```

Optional:
- `--ttl-ms [MS_OR_NULL]` modify expiry (`null` = permanent, omitted = unchanged)
- `--pagecode [CODE_OR_NULL]` set/remove access protection
- `--page-name [SLUG]` rename page

8. Return fixed output fields exactly as defined in `../../references/prompt-contracts.md`.

## If `page-id` is missing

- tell user the local page is not yet bound to a remote `pageId`
- optionally create once, write back `pageId`, then continue update workflow
- when this fallback create is used, apply create default policy unless user explicitly overrides:
  - private page (`pagecode` required)
  - `ttlMs=10800000` (3h)

## Failure handling (error code -> action)

- `LOCAL_KEYS_FILE_MISSING` -> create `../../keys.local.json` from `../../keys.local.example.json`, then fill token.
- `LOCAL_TOKEN_MISSING` -> add valid token to `../../keys.local.json` (`clawpage.token`), then retry.
- if user has no token: register first via API reference (`../../references/api-quickref.md`), then write token to `../../keys.local.json`.
- `UNAUTHORIZED` -> verify token in `../../keys.local.json`, then retry.
- `PAGE_NOT_FOUND` -> verify `pageId` ownership/existence; if unbound, create first and write back `pageId`.
- `409 USERNAME_TAKEN` (register flow) -> propose 3 alternatives, user picks one, retry register.
- `429 IP_DAILY_REGISTRATION_LIMIT_REACHED` -> stop and ask user to retry next day or use existing account.
- `429 OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED` -> stop create attempts and retry later.
- `429 OWNER_MONTHLY_PERMANENT_PAGE_LIMIT_REACHED` -> suggest shorter TTL or cleanup of permanent pages.
- network/5xx -> report status/body and retry with `--api-host` verification.

## Quality bar

- keep WebApp behavior, do not regress to article-only page
- prioritize modular panels, state areas, and interaction blocks
