# Clawpage Prompt Contracts

Use this file as the single source for shared prompt contracts across router/create/update skills.

## 1. Placeholder Ownership & Localization Contract

**A. System-Managed Placeholders (DO NOT REPLACE)**
- Format: `__UPPERCASE__` (e.g., `__DEFAULT_CSS__`, `__DEFAULT_JS__`).
- Rule: The Agent **must leave these untouched** in the HTML. The publish script will compute and replace them automatically.
- *Exception*: `__CONTENT_HTML__` MUST be replaced by the Agent with rich UI components (including page title, subtitle, timestamps, and any metadata the page needs).

**B. LLM-Rendered Content**
- The Agent renders **everything visible** on the page: title, subtitle, and all UI content.
- The Agent should write the page `<title>` tag directly with the actual title.
- **Do NOT show expiry time on the page.** Expiry is a hosting detail, not page content — communicate it to the user in the post-publish chat message using `expiresAt` from the JSON result.
- User-visible text must be localized to the user's language; infer language from prompt and ask only when unclear.

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

When calling `npx -y @clawpage.ai/cli publish`, this schema should be emitted as JSON even on failure (`ok: false` + non-zero exit code).

## 3. Sharing Contract (Human-readable responses)

- If `publicUrl` exists, recommend sharing `publicUrl`.
- If `publicUrl` is null and protection exists, you **MUST provide BOTH the `accessUrl` (for easy one-click access) AND the `rootUrl`** alongside the `pagecode`.
- Always provide the `pagecode` (访达码) as a separate clearly visible text block so the user can easily copy and input it.

## 4. Pre-Publish Hard Checklist

Run and pass all checks before publish:

1. `meta.md` metadata is complete (`metadata.name`, `metadata.description`; keep/update `metadata.page_id` when available).
2. Required HTML placeholders are preserved: `__CONTENT_HTML__`, `__DEFAULT_CSS__`, `__DEFAULT_JS__`.
3. Dry-run succeeds: `npx -y @clawpage.ai/cli publish --page-dir <dir> --dry-run`.
4. **Non-empty content gate (mandatory):** before returning links, verify published HTML is not an empty shell.
   - Ensure `index.html` does not leave `__CONTENT_HTML__` unresolved — it must be replaced with real content HTML before publish.
   - If this gate fails, do not send URL; fill in the content and republish first.

## 5. Error Code -> Action Mapping

- `LOCAL_KEYS_FILE_MISSING`: run `npx -y @clawpage.ai/cli init` to auto-register a new account (with a creative, AI-generated username based on the user's prompt or persona) and write `./keys.local.json` automatically. Gently inform the user that a default account was created for them and they can ask to re-register a specific username. **DO NOT create a Clawpage intro page; execute the user's original request immediately.**
- `LOCAL_TOKEN_MISSING`: auto-register a new account with a creative, AI-generated username, add `clawpage.token` into `keys.local.json`, and inform the user they can request a custom username. **DO NOT create a Clawpage intro page; execute the user's original request immediately.**
- `UNAUTHORIZED` (HTTP 401): verify `keys.local.json` token, then retry publish.
- `PAGE_NOT_FOUND` (HTTP 404): verify `pageId` ownership/existence; if local page has no binding, create first and write back `pageId`.
- `409 USERNAME_TAKEN`: for register flow, propose 3 alternatives and retry with user choice.
- `429 IP_DAILY_REGISTRATION_LIMIT_REACHED`: stop and ask user to retry next day or use existing account.
- `429 OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED`: stop create attempts and ask user to retry later.
- `429 OWNER_MONTHLY_PERMANENT_PAGE_LIMIT_REACHED`: suggest shorter TTL or deleting/repurposing permanent pages.
- `NETWORK_ERROR`: check network connectivity/DNS and api-host reachability, then retry.
- `SERVER_ERROR`: keep request payload and retry later after checking server status / `--api-host`.
