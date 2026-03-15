# clawpage-skill

English docs. Chinese version: [docs/README.zh-CN.md](docs/README.zh-CN.md).

`clawpage-skill` turns long text into interactive Clawpage web apps.  
You can ask for a page in natural language, and the skill routes to page/template create or update workflows, then publishes a URL.

Official website: `https://clawpage.ai`

## What you can do

- Convert long stock-market analysis text into a chart-driven dashboard
- Build insight hubs, utility tools, and interactive mini apps
- Update existing pages by `pageId` with new content/style/behavior
- Control TTL and access code during publish

## Quick start

1. Prepare local keys:

```bash
cp keys.local.example.json keys.local.json
```

2. Register (if you do not have a token yet):

```bash
curl -sS -X POST https://api.clawpage.ai/api/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"<username>"}'
```

Username rules:
- lowercase DNS-safe chars only: `a-z`, `0-9`, `-`
- length >= 6
- cannot start or end with `-`

If API returns `409 USERNAME_TAKEN`:
- propose 3 new usernames
- prefer suffixes like `-lab`, `-app`, or 2-4 digits
- let user pick one and retry

3. Save token:

```json
{
  "clawpage": {
    "token": "sk_replace_me",
    "apiHost": "https://api.clawpage.ai"
  }
}
```

## Example: long stock analysis -> visual page

User prompt:

```text
Use clawpage-skill to build a stock analysis dashboard from this long market note.
Requirements:
1) extract 5 key conclusions
2) include KPI cards and 7D/30D/90D trend switching
3) mobile-first layout
4) publish and return publicUrl, rootUrl, accessUrl, pageId, expiresAt
```

Typical workflow:
- choose `stock-analysis-terminal` template
- transform raw text into structured modules (summary, risks, observations)
- generate page files under `.pages/<page-name>/`
- publish via `scripts/clawpages_publish.mjs`
- return `publicUrl` (if available), preview/protected URLs, page protection state, and expiry info

## Template catalog

- `stock-analysis-terminal`
- `insight-collection-hub`
- `utility-workbench`
- `concept-animation-lab`
- `mini-game-arcade`
- `genernal_template`

## Direct CLI usage

Dry-run template bundle:

```bash
node scripts/clawpages_publish.mjs \
  --page-dir templates/genernal_template \
  --title "Template Preview" \
  --dry-run
```

Publish a page project:

```bash
node scripts/clawpages_publish.mjs \
  --page-dir .pages/<page-name> \
  --title "My Page" \
  --subtitle "Optional"
```

Common flags:
- `--page-id <id>` update existing page
- `--ttl-ms <number|null>` override TTL (`null` = permanent)
- `--pagecode <text|null>` set/remove access code
- `--page-name <text>` set page name (use with `--pagecode null` for stable `publicUrl`)
- `--dry-run` bundle only

## Localization placeholders

Use semantic placeholders for localized text, for example `[EXPIRE_AT]`, `[GENERATED_AT]`, `[SEARCH_PLACEHOLDER]`.  
Skill instructions require the LLM to fill these placeholders directly using the user's preferred language before publish.  
Do not use numeric key placeholders or maintain key-mapping tables.

## Security

- do not commit real credentials from `keys.local.json`
- keep `keys.local.example.json` as the committed baseline

## License

This project is licensed under the MIT License. See `LICENSE`.
