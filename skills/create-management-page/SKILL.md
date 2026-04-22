---
name: clawpage-create-management-page
description: "Trigger when user asks for a management/admin page that lists all created pages in a read-only UI (keywords: 管理页, 页面管理, 列出所有页面, pages dashboard, admin page). This skill creates or updates the current management page. Default publish policy: TTL 3h and password protected."
install:
  binaries:
    - node
---

# Clawpage Create/Update Management Page

## When to use

- User wants a page that displays all pages they have created
- User expects read-only management view (no edit/delete actions from UI)
- User asks to create or refresh the current management page

## Data-flow rule

> The default workflow pre-fetches page data **at publish time via CLI `curl`** (see Workflow step 3) and inlines the JSON into the static HTML. The rendered management page makes **zero live API calls from the browser**, so the SDK is not required in the default path.
>
> **If you add any live/interactive feature** (refresh button, live stats, filters that re-query the API, edit/delete actions): the page-side JS MUST use the Clawpage Browser SDK (`https://clawpage.ai/sdk.js`) — never raw `fetch('/api/...')`. See `skills/use-sdk/SKILL.md`.
>
> **Owner `sk_*` tokens are only acceptable in this management page because it is pagecode-protected.** Never paste an owner token into a public (non-pagecode) page. CLI/server-side owner token usage (e.g. `curl` from a terminal, the publish script) is fine.
>
> **SDK coverage:** the SDK wraps `table` / `links` / `stats` / `blobs` / `me` / `pages`. For live page listing / refresh / edit actions in the browser, use `c.pages` — see the "Live-refresh recipe" below.

### Live-refresh recipe (optional)

If the user asks for a "refresh now" button or live filtering, embed the SDK and use `c.pages.listAll()` — owner token is fine here because the page is pagecode-protected:

```html
<script src="https://clawpage.ai/sdk.js"></script>
<script>
  const c = new Clawpage({ token: "__OWNER_TOKEN__" });  // inlined from keys.local.json at publish time

  async function refresh() {
    const items = await c.pages.listAll({ maxItems: 500 });
    renderPages(items);       // your DOM update
    document.getElementById("data-fetched-at").textContent = new Date().toLocaleString();
  }

  // Initial paint from inlined data; refresh button calls refresh().
  document.getElementById("refresh-btn")?.addEventListener("click", refresh);
</script>
```

Keep `renderPages` ≤ 50 lines and don't swallow errors — let `ClawpageError` bubble to a toast. If live refresh is not requested, skip this entirely and stick with the publish-time-inlined static flow below.

## Inputs and conventions

### Paths (resolve before any file op)

- `$SKILL_DIR` — absolute path to this skill's install directory (holds `templates/`, `scripts/`, `references/`, `keys.local.json`). Reference every skill asset as `$SKILL_DIR/<asset>`.
- `$PAGES_DIR` — where page projects live. **Default: `$PWD/.pages`** (user's current working directory — NOT `$SKILL_DIR`). User may override per request (e.g., `/tmp/clawpage-pages`). Use the same `$PAGES_DIR` the user's other pages live under so the management page can see them.
- `$MGMT_PAGE_DIR` — the management page project dir: preferred `$PAGES_DIR/page-management-center`, else `$PAGES_DIR/page-management-center-vN`.
- **Never** create, copy into, or modify anything inside `$SKILL_DIR`.

### Resources

- Management page bootstrap template (default): `$SKILL_DIR/templates/general_template`
- Publish script: `$SKILL_DIR/scripts/clawpages_publish.mjs`
- API reference: `$SKILL_DIR/references/api-quickref.md`
- Shared contracts: `$SKILL_DIR/references/prompt-contracts.md`

### Security defaults (unless user explicitly overrides)

- `ttlMs = 10800000` (3 hours)
- must be password protected (`pagecode` must not be null/empty)

## Workflow

1. Resolve `$MGMT_PAGE_DIR` once:
- A valid management-page project must satisfy both:
  - has `meta.md`
  - `meta.md` contains `metadata.management_page: true`
- Preferred path: `$PAGES_DIR/page-management-center`
- If the preferred path does not exist or lacks the marker, scan `$PAGES_DIR/*/meta.md` for projects satisfying the rule and pick one deterministic path.
- If none found, initialize a new project:
  - if `$PAGES_DIR/page-management-center` does not exist: use it.
  - if it exists but lacks the marker: use `$PAGES_DIR/page-management-center-v2` (or next available `-vN`).

**Note:** Always expand `$SKILL_DIR` / `$MGMT_PAGE_DIR` to absolute paths before running the commands below.

```bash
cp -R "$SKILL_DIR/templates/general_template" "$MGMT_PAGE_DIR"
```

2. Ensure metadata in `$MGMT_PAGE_DIR/meta.md` is explicit:
- `metadata.name`
- `metadata.description`
- required marker: `metadata.management_page: true`

3. Pull latest page list via API. 
- Use the token from `$SKILL_DIR/keys.local.json`.
- Example command:
```bash
curl -sS https://api.clawpage.ai/api/pages?page=1&limit=50 \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```
- include key fields: `pageId`, `pageName`, `rootUrl`, `publicUrl`, `currentVersion`, expiry/protection status.
- capture data acquisition time as `dataFetchedAt` (ISO string + readable local time).
- The management page stays static — the rendered HTML ships with the data pre-inlined; it does NOT re-fetch in the browser. If the user explicitly asks for live refresh or edit actions, switch that surface to the Browser SDK per `skills/use-sdk/SKILL.md` (and note the `/api/pages` SDK gap).

4. Build a high-quality read-only UI (refer to `$SKILL_DIR/references/design-guidelines.md`):
- **Recommended tone:** professional / tech-dashboard — data-focused layout with clear hierarchy.
- clarity: search/filter/sort/read-only cards or table.
- no mutation controls (no delete/update API buttons).
- expose share-relevant URLs and protection/expiry summaries.
- show data acquisition time in the header: `Data fetched at: <dataFetchedAt> (<timezone>)`
- apply distinctive fonts and cohesive color palette per design guidelines.
- add page-load stagger animations for the page card list.

5. Apply localization/output contracts from `$SKILL_DIR/references/prompt-contracts.md`.

6. Pre-publish hard checks (must pass):
- `meta.md` metadata complete.
- required placeholders preserved.
- dry-run succeeds.

7. Publish:
- **Identify PAGE_ID**: Use `read_file` to read `$MGMT_PAGE_DIR/meta.md` and extract `metadata.page_id` from the YAML frontmatter. Do not use fragile shell regex.
- **Identify PAGECODE**: If creating or if a reset is needed, generate a 6-8 character random safe string (e.g., base64url or alphanumeric).

- **Create mode** (if `page_id` is missing):
```bash
node "$SKILL_DIR/scripts/clawpages_publish.mjs" \
  --page-dir "$MGMT_PAGE_DIR" \
  --title "[TITLE]" \
  --subtitle "[SUBTITLE]" \
  --ttl-ms 10800000 \
  --pagecode "[GENERATED_PAGECODE]"
```
- Write back the returned `pageId` to `metadata.page_id` in `$MGMT_PAGE_DIR/meta.md`.

- **Update mode** (if `page_id` exists):
```bash
node "$SKILL_DIR/scripts/clawpages_publish.mjs" \
  --page-dir "$MGMT_PAGE_DIR" \
  --page-id "[PAGE_ID]" \
  --title "[TITLE]" \
  --subtitle "[SUBTITLE]" \
  --ttl-ms 10800000
```
- *Note:* Add `--pagecode "[GENERATED_PAGECODE]"` only if rotating password or enforcing security on a previously public page.

8. Return fixed output fields from `$SKILL_DIR/references/prompt-contracts.md`.

9. Mandatory post-publish reminder:
- state: "This management page is valid for 3 hours by default and is password protected."
- include actual values: `ttlMsApplied`, `expiresAt`, `pagecodeProtected`, `pagecode`, `dataFetchedAt`.


## Failure handling (error code -> action)

- `LOCAL_KEYS_FILE_MISSING` -> create `$SKILL_DIR/keys.local.json` from `$SKILL_DIR/keys.local.example.json`, then fill token.
- `LOCAL_TOKEN_MISSING` -> add valid token to `$SKILL_DIR/keys.local.json` (`clawpage.token`), then retry.
- if user has no token: register first via API reference (`$SKILL_DIR/references/api-quickref.md`), then write token to `$SKILL_DIR/keys.local.json`.
- `UNAUTHORIZED` -> verify token in `$SKILL_DIR/keys.local.json`, then retry.
- `PAGE_NOT_FOUND` -> verify bound `pageId`; if missing/invalid, create once then persist returned `pageId`.
- `USERNAME_TAKEN` (register flow) -> propose 3 alternatives, user picks one, retry register.
- `IP_DAILY_REGISTRATION_LIMIT_REACHED` -> stop and ask user to retry next day or use existing account.
- `OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED` -> stop create attempts and retry later.
- `OWNER_MONTHLY_PERMANENT_PAGE_LIMIT_REACHED` -> keep management page temporary (3h TTL), avoid permanent publish.
- `NETWORK_ERROR` / `SERVER_ERROR` -> report status/body context and retry after network/server check.
