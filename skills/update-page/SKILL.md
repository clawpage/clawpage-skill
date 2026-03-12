---
name: clawpage-update-page
description: Update an existing .pages project, quickly match targets via index.md metadata first, then publish updates with optional TTL/pagecode changes.
---

# Clawpage Update Page

## When to use

- User wants to modify an existing page (structure, style, interaction, or content)
- User mentions reusing an existing page/project

## Paths and conventions

- Page directory: `../.pages/<page-name>`
- Page files: `index.md`, `index.html`, `default.css`, `default.js`
- Publish script: `../scripts/clawpages_publish.mjs`
- API reference: `../references/api-quickref.md` (`PATCH /api/pages/<pageId>`)

## Matching strategy (two-phase)

1. Read metadata only first:

```bash
find ../.pages -mindepth 2 -maxdepth 2 -name index.md | while read -r f; do
  echo "== $f ==";
  sed -n '1,24p' "$f";
done
```

2. Read full `index.md` only for shortlisted candidates

## Update workflow

1. Edit `index.html` first
2. Update `default.css` / `default.js` as required
3. Read `page-id` from `index.md` when available:

```bash
PAGE_ID=$(sed -n 's/^[[:space:]]*page_id:[[:space:]]*//p; s/^- page-id:[[:space:]]*//p' ../.pages/<page-name>/index.md | head -n 1 | tr -d '"')
```

4. If semantics changed, sync `index.md` metadata and notes
5. Fill localization placeholders
- replace uppercase placeholders (for example `__I18N_TEXT_0001__`) using user-preferred language
- infer language from user prompt; ask only if unclear

6. Publish update (PATCH when `page-id` exists):

```bash
node ../scripts/clawpages_publish.mjs \
  --page-dir ../.pages/<page-name> \
  --page-id "$PAGE_ID" \
  --title "<TITLE_PLACEHOLDER>" \
  --subtitle "<SUBTITLE_PLACEHOLDER>"
```

Optional:
- `--ttl-ms <number|null>` modify expiry (`null` = permanent, omitted = unchanged)
- `--pagecode <text|null>` set/remove access protection

7. Return to user
- 1-2 sentence summary
- return two URLs:
  - URL without `pagecode` (`rootUrl` / `pageUrlNoPagecode`)
  - URL with `pagecode` (`accessUrl` / `pageUrlWithPagecode`) when protected
- add sharing caution:
  - for cautious external sharing, prefer URL without `pagecode`
  - share `pagecode` separately and only to intended recipients
- expiry info (`ttlMsApplied`, `expiresAt`) and whether changed this run
- protection status and whether changed this run
- if pagecode set this run, return current code/access method

## If `page-id` is missing

- tell user the local page is not yet bound to a remote `pageId`
- optionally create once, write back `pageId`, then continue update workflow

## Quality bar

- keep WebApp behavior, do not regress to article-only page
- prioritize modular panels, state areas, and interaction blocks
