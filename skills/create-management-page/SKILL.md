---
name: clawpage-create-management-page
description: Trigger when user asks for a management/admin page that lists all created pages in a read-only UI (keywords: 管理页, 页面管理, 列出所有页面, pages dashboard, admin page). This skill creates or updates the current management page. Default publish policy: TTL 3h and password protected.
---

# Clawpage Create/Update Management Page

## When to use

- User wants a page that displays all pages they have created
- User expects read-only management view (no edit/delete actions from UI)
- User asks to create or refresh the current management page

## Inputs and conventions

- Management page directory (preferred fixed path): `../../.pages/page-management-center`
- Management page bootstrap template (default): `../../templates/genernal_template`
- Publish script: `../../scripts/clawpages_publish.mjs`
- API reference: `../../references/api-quickref.md`
- Shared contracts: `../../references/prompt-contracts.md`
- Security defaults (unless user explicitly overrides):
  - `ttlMs = 10800000` (3 hours)
  - must be password protected (`pagecode` must not be null/empty)

## Workflow

1. Resolve `MANAGEMENT_PAGE_DIR` once, then use it for all later steps:
- valid management-page project must satisfy both:
  - has `index.md`
  - `index.md` contains `metadata.management_page: true`
- first choice: `../../.pages/page-management-center` only when it satisfies the rule above
- otherwise scan `../../.pages/*/index.md` for projects satisfying the same rule and pick one deterministic path (lexicographically first)
- if none found, initialize a new management project with an existing-dir guard:
  - if `../../.pages/page-management-center` does not exist: use it directly
  - if it exists but does not satisfy management marker rule: do not copy into it; use `../../.pages/page-management-center-v2` (or next available `-vN`) as `MANAGEMENT_PAGE_DIR`

```bash
cp -R ../../templates/genernal_template "${MANAGEMENT_PAGE_DIR}"
```

2. Ensure metadata in `MANAGEMENT_PAGE_DIR/index.md` is explicit:
- `metadata.name`
- `metadata.description`
- required marker: `metadata.management_page: true`

3. Pull latest page list via API (`GET /api/pages?page=1&limit=20`, paginate if needed):
- include key fields: `pageId`, `pageName`, `rootUrl`, `publicUrl`, `currentVersion`, expiry/protection status when available
- normalize empty values for stable rendering
- capture data acquisition time as `dataFetchedAt` (ISO string + readable local time)
- keep timezone context (for example `UTC+08:00` or browser locale timezone label)

4. Build a high-quality read-only UI:
- emphasize clarity: search/filter/sort/read-only cards or table
- no mutation controls (no delete/update API buttons)
- expose share-relevant URLs and protection/expiry summaries
- must clearly show data acquisition time in the header area, for example: `Data fetched at: <dataFetchedAt> (<timezone>)`

5. Apply localization/output contracts from `../../references/prompt-contracts.md`.

6. Pre-publish hard checks (must pass):
- `index.md` metadata complete
- required placeholders preserved
- dry-run succeeds
- no obvious unreplaced localization tags

7. Publish:
- read update key only from frontmatter `metadata.page_id` in `MANAGEMENT_PAGE_DIR/index.md`:

```bash
PAGE_ID="$(node -e 'const fs=require("fs");const s=fs.readFileSync(process.argv[1],"utf8");const fm=s.match(/^---\\n([\\s\\S]*?)\\n---/);if(!fm)process.exit(0);const meta=fm[1].match(/(?:^|\\n)metadata:\\n([\\s\\S]*?)(?=\\n\\S|$)/);if(!meta)process.exit(0);const pid=meta[1].match(/^\\s{2}page_id:\\s*"?([^"\\n]+)"?\\s*$/m);if(pid&&pid[1])process.stdout.write(pid[1].trim());' "${MANAGEMENT_PAGE_DIR}/index.md")"
```

- if `PAGE_ID` is empty -> create mode and then write back returned `pageId` to `metadata.page_id`
- if `PAGE_ID` is non-empty -> update mode
- publish target must always be `--page-dir "${MANAGEMENT_PAGE_DIR}"` (never hardcode another directory)
- resolve `PAGECODE` only when needed:
  - create mode: must have `PAGECODE` (generate if missing)
  - update mode:
    - if user explicitly requests rotate/reset password -> generate/use `PAGECODE` and pass `--pagecode`
    - otherwise check current `pagecodeProtected` (via page detail API or latest known page metadata)
    - if `pagecodeProtected` is `false` and user did not explicitly request public access -> generate/use `PAGECODE` and pass `--pagecode` (enforce secure default)
    - if `pagecodeProtected` is `true` and user did not request reset -> do not pass `--pagecode` (avoid unnecessary password rotation)

```bash
if [ -z "${PAGECODE}" ] || [ "${PAGECODE}" = "<PAGECODE>" ]; then
  PAGECODE="$(node -e 'process.stdout.write(require("crypto").randomBytes(6).toString("base64url"))')"
fi
```

- create command:

```bash
node ../../scripts/clawpages_publish.mjs \
  --page-dir "${MANAGEMENT_PAGE_DIR}" \
  --title "<TITLE_PLACEHOLDER>" \
  --subtitle "<SUBTITLE_PLACEHOLDER>" \
  --ttl-ms 10800000 \
  --pagecode "${PAGECODE}"
```

- update command:

```bash
node ../../scripts/clawpages_publish.mjs \
  --page-dir "${MANAGEMENT_PAGE_DIR}" \
  --page-id "${PAGE_ID}" \
  --title "<TITLE_PLACEHOLDER>" \
  --subtitle "<SUBTITLE_PLACEHOLDER>" \
  --ttl-ms 10800000
```

- update command when user explicitly requests pagecode reset:

```bash
node ../../scripts/clawpages_publish.mjs \
  --page-dir "${MANAGEMENT_PAGE_DIR}" \
  --page-id "${PAGE_ID}" \
  --title "<TITLE_PLACEHOLDER>" \
  --subtitle "<SUBTITLE_PLACEHOLDER>" \
  --ttl-ms 10800000 \
  --pagecode "${PAGECODE}"
```

Notes:
- Create mode: if user does not provide `pagecode`, generate one and return it.
- Update mode: if current page is already protected, default is keep existing password (do not pass `--pagecode`).
- Update mode: if current page is public and user did not explicitly request public access, must set `--pagecode` to enforce password protection.
- Update mode should pass `--pagecode` in exactly two cases: user explicitly requests reset/rotate, or current page is public and needs enforcement to meet secure default.
- Do not publish management page with `--pagecode null` unless user explicitly requests public access.

8. Return fixed output fields from `../../references/prompt-contracts.md`.

9. Mandatory post-publish reminder (every create/update response):
- clearly state: "This management page is valid for 3 hours by default and is password protected."
- include actual values in same response:
  - `ttlMsApplied`
  - `expiresAt`
  - `pagecodeProtected`
  - `pagecode` (if set/returned)
  - `dataFetchedAt` (the timestamp used in the management page)

## Failure handling (error code -> action)

- `LOCAL_KEYS_FILE_MISSING` -> create `../../keys.local.json` from `../../keys.local.example.json`, then fill token.
- `LOCAL_TOKEN_MISSING` -> add valid token to `../../keys.local.json` (`clawpage.token`), then retry.
- if user has no token: register first via API reference (`../../references/api-quickref.md`), then write token to `../../keys.local.json`.
- `UNAUTHORIZED` -> verify token in `../../keys.local.json`, then retry.
- `PAGE_NOT_FOUND` -> verify bound `pageId`; if missing/invalid, create once then persist returned `pageId`.
- `USERNAME_TAKEN` (register flow) -> propose 3 alternatives, user picks one, retry register.
- `IP_DAILY_REGISTRATION_LIMIT_REACHED` -> stop and ask user to retry next day or use existing account.
- `OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED` -> stop create attempts and retry later.
- `OWNER_MONTHLY_PERMANENT_PAGE_LIMIT_REACHED` -> keep management page temporary (3h TTL), avoid permanent publish.
- `NETWORK_ERROR` / `SERVER_ERROR` -> report status/body context and retry after network/server check.
