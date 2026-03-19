---
name: clawpage-create-management-page
description: Trigger when user asks for a management/admin page that lists all created pages in a read-only UI (keywords: 管理页, 页面管理, 列出所有页面, pages dashboard, admin page). This skill creates or updates the current management page. Default publish policy: TTL 3h and password protected.
install:
  binaries:
    - node
---

# Clawpage Create/Update Management Page

## When to use

- User wants a page that displays all pages they have created
- User expects read-only management view (no edit/delete actions from UI)
- User asks to create or refresh the current management page

## Inputs and conventions

- Management page directory (preferred fixed path): `./.pages/page-management-center`
- Management page bootstrap template (default): `./templates/general_template`
- Publish script: `./scripts/clawpages_publish.mjs`
- API reference: `./references/api-quickref.md`
- Shared contracts: `./references/prompt-contracts.md`
- Security defaults (unless user explicitly overrides):
  - `ttlMs = 10800000` (3 hours)
  - must be password protected (`pagecode` must not be null/empty)

## Workflow

1. Resolve `MANAGEMENT_PAGE_DIR` once:
- A valid management-page project must satisfy both:
  - has `meta.md`
  - `meta.md` contains `metadata.management_page: true`
- Preferred path: `./.pages/page-management-center`
- If the preferred path does not exist or lacks the marker, scan `./.pages/*/meta.md` for projects satisfying the rule and pick one deterministic path.
- If none found, initialize a new project:
  - if `./.pages/page-management-center` does not exist: use it.
  - if it exists but lacks the marker: use `./.pages/page-management-center-v2` (or next available `-vN`).

**Note:** Always replace `[MANAGEMENT_PAGE_DIR]` in the following commands with the actual resolved path.

```bash
cp -R ./templates/general_template [MANAGEMENT_PAGE_DIR]
```

2. Ensure metadata in `[MANAGEMENT_PAGE_DIR]/meta.md` is explicit:
- `metadata.name`
- `metadata.description`
- required marker: `metadata.management_page: true`

3. Pull latest page list via API. 
- Use the token from `./keys.local.json`.
- Example command:
```bash
curl -sS https://api.clawpage.ai/api/pages?page=1&limit=50 \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```
- include key fields: `pageId`, `pageName`, `rootUrl`, `publicUrl`, `currentVersion`, expiry/protection status.
- capture data acquisition time as `dataFetchedAt` (ISO string + readable local time).

4. Build a high-quality read-only UI (refer to `./references/design-guidelines.md`):
- **Recommended tone:** professional / tech-dashboard — data-focused layout with clear hierarchy.
- clarity: search/filter/sort/read-only cards or table.
- no mutation controls (no delete/update API buttons).
- expose share-relevant URLs and protection/expiry summaries.
- show data acquisition time in the header: `Data fetched at: <dataFetchedAt> (<timezone>)`
- apply distinctive fonts and cohesive color palette per design guidelines.
- add page-load stagger animations for the page card list.

5. Apply localization/output contracts from `./references/prompt-contracts.md`.

6. Pre-publish hard checks (must pass):
- `meta.md` metadata complete.
- required placeholders preserved.
- dry-run succeeds.

7. Publish:
- **Identify PAGE_ID**: Use `read_file` to read `[MANAGEMENT_PAGE_DIR]/meta.md` and extract `metadata.page_id` from the YAML frontmatter. Do not use fragile shell regex.
- **Identify PAGECODE**: If creating or if a reset is needed, generate a 6-8 character random safe string (e.g., base64url or alphanumeric).

- **Create mode** (if `page_id` is missing):
```bash
node ./scripts/clawpages_publish.mjs \
  --page-dir [MANAGEMENT_PAGE_DIR] \
  --title "[TITLE]" \
  --subtitle "[SUBTITLE]" \
  --ttl-ms 10800000 \
  --pagecode "[GENERATED_PAGECODE]"
```
- Write back the returned `pageId` to `metadata.page_id` in `[MANAGEMENT_PAGE_DIR]/meta.md`.

- **Update mode** (if `page_id` exists):
```bash
node ./scripts/clawpages_publish.mjs \
  --page-dir [MANAGEMENT_PAGE_DIR] \
  --page-id "[PAGE_ID]" \
  --title "[TITLE]" \
  --subtitle "[SUBTITLE]" \
  --ttl-ms 10800000
```
- *Note:* Add `--pagecode "[GENERATED_PAGECODE]"` only if rotating password or enforcing security on a previously public page.

8. Return fixed output fields from `./references/prompt-contracts.md`.

9. Mandatory post-publish reminder:
- state: "This management page is valid for 3 hours by default and is password protected."
- include actual values: `ttlMsApplied`, `expiresAt`, `pagecodeProtected`, `pagecode`, `dataFetchedAt`.


## Failure handling (error code -> action)

- `LOCAL_KEYS_FILE_MISSING` -> create `./keys.local.json` from `./keys.local.example.json`, then fill token.
- `LOCAL_TOKEN_MISSING` -> add valid token to `./keys.local.json` (`clawpage.token`), then retry.
- if user has no token: register first via API reference (`./references/api-quickref.md`), then write token to `./keys.local.json`.
- `UNAUTHORIZED` -> verify token in `./keys.local.json`, then retry.
- `PAGE_NOT_FOUND` -> verify bound `pageId`; if missing/invalid, create once then persist returned `pageId`.
- `USERNAME_TAKEN` (register flow) -> propose 3 alternatives, user picks one, retry register.
- `IP_DAILY_REGISTRATION_LIMIT_REACHED` -> stop and ask user to retry next day or use existing account.
- `OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED` -> stop create attempts and retry later.
- `OWNER_MONTHLY_PERMANENT_PAGE_LIMIT_REACHED` -> keep management page temporary (3h TTL), avoid permanent publish.
- `NETWORK_ERROR` / `SERVER_ERROR` -> report status/body context and retry after network/server check.
