---
name: clawpage-create-page
description: Trigger when user wants a brand-new page (keywords: create/new page, from template, publish new URL/publicUrl). Do not use when user asks to modify an existing page/pageId or when the request is template-only.
---

# Clawpage Create Page

## When to use

- User wants a new page (not an edit to an existing page)
- Target is a publishable WebApp page URL

## Inputs and conventions

- Page directory: `../../.pages/<page-name>`
- Template directory: `../../templates/<template-name>`
- Publish script: `../../scripts/clawpages_publish.mjs`
- API reference: `../../references/api-quickref.md`
- Shared contracts: `../../references/prompt-contracts.md`
- `page-name` must be kebab-case and cannot contain `/`
- Create default policy (unless user explicitly overrides):
  - private page by default (`pagecode` required)
  - TTL: 3h (`10800000`)

## Workflow

1. Choose template (default `genernal_template`).
2. Resolve target directory strategy before copy:
- if `../../.pages/<page-name>` does not exist: copy directly.
- if it exists: explicitly confirm one strategy with user first: `overwrite` / `incremental update` / `use a new page-name`.

```bash
cp -R ../../templates/genernal_template ../../.pages/<page-name>
```

3. Update `../../.pages/<page-name>/index.md`:
- required metadata: `metadata.name`, `metadata.description`
- add page purpose, audience, and scenario

4. Edit page project (`index.html` first, then `default.css` / `default.js` as needed).

5. Apply localization and output contracts from `../../references/prompt-contracts.md`.

6. Run pre-publish hard checklist (must pass all):
- metadata complete in `index.md`
- required placeholders preserved in HTML
- dry-run succeeds
- no obvious unreplaced localization labels

7. Publish page:

- resolve `PAGECODE` before publish (never pass literal placeholder):

```bash
if [ -z "${PAGECODE}" ] || [ "${PAGECODE}" = "<PAGECODE>" ]; then
  PAGECODE="$(node -e 'process.stdout.write(require("crypto").randomBytes(6).toString("base64url"))')"
fi
```

```bash
node ../../scripts/clawpages_publish.mjs \
  --page-dir ../../.pages/<page-name> \
  --title "<TITLE_PLACEHOLDER>" \
  --subtitle "<SUBTITLE_PLACEHOLDER>" \
  --ttl-ms 10800000 \
  --pagecode "${PAGECODE}"
```

Optional:
- `--ttl-ms <number|null>` override expiry (`null` = permanent); default is `10800000`
- `--pagecode <text|null>` set/remove access protection; default is generated non-empty value
- `--page-name <text>` set page slug source (`pagecode: null` + `page-name` helps get stable `publicUrl`)

8. Return fixed output fields exactly as defined in `../../references/prompt-contracts.md`.

9. Write returned `pageId` back to `../../.pages/<page-name>/index.md`:
- prefer `metadata.page_id`
- optional mirror field: `page-id`

10. Management-page proactive reminder rule:
- count non-management local page projects under `../../.pages` using this deterministic rule:
  - include only directories that contain `index.md`
  - exclude directory named `page-management-center`
  - exclude any project whose `index.md` has `metadata.management_page: true`
- if count >= 3, add this reminder in the same response:
  - user can create a management page to view all created pages in one read-only dashboard
  - route intent to `create management page` sub-skill when user confirms

## Failure handling (error code -> action)

- `LOCAL_KEYS_FILE_MISSING` -> create `../../keys.local.json` from `../../keys.local.example.json`, then fill token.
- `LOCAL_TOKEN_MISSING` -> add valid token to `../../keys.local.json` (`clawpage.token`), then retry.
- if user has no token: register first via API reference (`../../references/api-quickref.md`), then write token to `../../keys.local.json`.
- `UNAUTHORIZED` -> verify token in `../../keys.local.json`, then retry.
- `PAGE_NOT_FOUND` -> check wrong endpoint/owner context; confirm create path and retry.
- `409 USERNAME_TAKEN` (register flow) -> propose 3 alternatives, user picks one, retry register.
- `429 IP_DAILY_REGISTRATION_LIMIT_REACHED` -> stop and ask user to retry next day or use existing account.
- `429 OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED` -> stop create attempts and retry later.
- `429 OWNER_MONTHLY_PERMANENT_PAGE_LIMIT_REACHED` -> suggest shorter TTL or cleanup of permanent pages.
- network/5xx -> report status/body and retry with `--api-host` verification.
