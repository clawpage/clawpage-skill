# Clawpage Prompt Contracts

Use this file as the single source for shared prompt contracts across router/create/update skills.

## 1. Placeholder Ownership & Localization Contract

**A. System-Managed Placeholders (DO NOT REPLACE)**
- Format: `__UPPERCASE__` (e.g., `__PAGE_TITLE__`, `__PAGE_SUBTITLE__`, `__DEFAULT_CSS__`, `__DEFAULT_JS__`, `__GENERATED_AT__`, `__EXPIRES_AT__`).
- Rule: The Agent **must leave these untouched** in the HTML. The publish script will compute and replace them automatically.
- *Exception*: `__CONTENT_HTML__` MUST be replaced by the Agent with rich UI components.

**B. AI-Managed Semantic Placeholders (MUST REPLACE)**
- Format: `[UPPERCASE]` (e.g., `[EXPIRE_AT]`, `[GENERATED_AT]`, `[SEARCH_PLACEHOLDER]`).
- Rule: The Agent **must instantiate** these placeholders into natural, goal-language strings (e.g. translate `[GENERATED_AT]` to "生成时间" or "Generated At").
- Do not use numeric key placeholders.
- Do not maintain key-mapping tables.
- Infer user language from prompt; ask only when unclear.

## 2. Output Schema (Fixed Fields)

For successful create/update runs, always return these fields in the JSON output (field names must stay stable):

| field | required | nullable | meaning |
|---|---|---|---|
| `summary` | yes | no | 1-2 sentence human summary |
| `mode` | yes | no | `created` or `updated` |
| `pageId` | yes | no | remote page id |
| `publicUrl` | yes | yes | public sharing URL when no password |
| `rootUrl` | yes | yes | preview URL without `pagecode` |
| `accessUrl` | yes | yes | URL with `pagecode` when protected (always in JSON, see Sharing Contract for human text) |
| `shareRecommendedUrl` | yes | yes | prefer `publicUrl`, otherwise `rootUrl` |
| `pagecode` | yes | yes | current pagecode if any |
| `pagecodeProtected` | yes | yes | whether page is password protected |
| `pagecodeUpdated` | yes | no | whether protection changed this run |
| `ttlMsApplied` | yes | yes | effective TTL after this run |
| `expiresAt` | yes | yes | effective expiry ISO timestamp |
| `warnings` | yes | no | array of strings for quota/limit warnings (may be empty if endpoint provides none) |
| `htmlPath` | yes | no | local bundled html path |

Failure output must include:

| field | required | meaning |
|---|---|---|
| `ok` | yes | always `false` |
| `errorCode` | yes | normalized error code |
| `errorMessage` | yes | short root cause |
| `action` | yes | concrete next action |

When calling `scripts/clawpages_publish.mjs`, this schema should be emitted as JSON even on failure (`ok: false` + non-zero exit code).

## 3. Sharing Contract (Human-readable responses)

- If `publicUrl` exists, recommend sharing `publicUrl`.
- If `publicUrl` is null and protection exists, share `rootUrl` and send `pagecode` separately.
- **Provide `accessUrl` in human-readable text ONLY when user explicitly asks for one-click protected access.** (It must always be available in the JSON `accessUrl` field for tooling).

## 4. Pre-Publish Hard Checklist

Run and pass all checks before publish:

1. `meta.md` metadata is complete (`metadata.name`, `metadata.description`; keep/update `metadata.page_id` when available).
2. Required HTML placeholders are preserved: `__CONTENT_HTML__`, `__DEFAULT_CSS__`, `__DEFAULT_JS__`, `__PAGE_TITLE__`, `__PAGE_SUBTITLE__`, `__GENERATED_AT__`, `__EXPIRES_AT__`.
3. Dry-run succeeds: `node scripts/clawpages_publish.mjs --page-dir <dir> --title "Preview" --dry-run`.
4. **Smart Zero-Tolerance for AI Placeholders:** Final HTML outputs must strictly NOT contain any uninstantiated semantic placeholders like `[GENERATED_AT]` or `[SEARCH_PLACEHOLDER]`. They must be translated and replaced before publishing. *(Note: Do not blindly strip all `[...]` to avoid breaking valid JavaScript arrays, Markdown links, or literal UI text like `Press [Enter]`).*
5. **Non-empty content gate (mandatory):** before returning links, verify published HTML is not an empty shell.
   - Ensure `index.html` does not leave `__CONTENT_HTML__` unresolved — it must be replaced with real content HTML before publish.
   - If this gate fails, do not send URL; fill in the content and republish first.

## 5. Error Code -> Action Mapping

- `LOCAL_KEYS_FILE_MISSING`: create `keys.local.json` from `keys.local.example.json`, then fill token.
- `LOCAL_TOKEN_MISSING`: add `clawpage.token` into `keys.local.json`, then retry.
- `UNAUTHORIZED` (HTTP 401): verify `keys.local.json` token, then retry publish.
- `PAGE_NOT_FOUND` (HTTP 404): verify `pageId` ownership/existence; if local page has no binding, create first and write back `pageId`.
- `409 USERNAME_TAKEN`: for register flow, propose 3 alternatives and retry with user choice.
- `429 IP_DAILY_REGISTRATION_LIMIT_REACHED`: stop and ask user to retry next day or use existing account.
- `429 OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED`: stop create attempts and ask user to retry later.
- `429 OWNER_MONTHLY_PERMANENT_PAGE_LIMIT_REACHED`: suggest shorter TTL or deleting/repurposing permanent pages.
- `NETWORK_ERROR`: check network connectivity/DNS and api-host reachability, then retry.
- `SERVER_ERROR`: keep request payload and retry later after checking server status / `--api-host`.
