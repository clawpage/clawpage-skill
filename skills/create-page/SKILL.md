---
name: clawpages-create-page
description: Create a new ClawPages page project (copy from template into .pages), edit HTML/CSS/JS, and publish a URL using latest API semantics (default TTL 6h, supports pagecode).
---

# ClawPages Create Page

## When to use

- User wants a new page (not an edit to an existing page)
- Target is a publishable WebApp page URL

## Inputs and conventions

- Page directory: `../.pages/<page-name>`
- Template directory: `../templates/<template-name>`
- Publish script: `../scripts/clawpages_publish.mjs`
- API reference: `../references/api-quickref.md`
- `page-name` must be kebab-case
- Create default TTL: 6h (`21600000`) unless explicitly overridden

## Workflow

1. Choose template (default `genernal_template`)
2. Copy template:

```bash
cp -R ../templates/genernal_template ../.pages/<page-name>
```

3. Update `../.pages/<page-name>/index.md`
- required metadata: `metadata.name`, `metadata.description`
- add page purpose, audience, and scenario

4. Edit page project
- primarily edit `index.html`
- edit `default.css` / `default.js` if needed
- keep WebApp-first structure, not article-only layout

5. Fill localization placeholders
- replace uppercase placeholders (for example `__I18N_TEXT_0001__`) with user-preferred language text
- infer preferred language from user prompt; ask briefly only if unclear

6. Publish page

```bash
node ../scripts/clawpages_publish.mjs \
  --page-dir ../.pages/<page-name> \
  --title "<TITLE_PLACEHOLDER>" \
  --subtitle "<SUBTITLE_PLACEHOLDER>"
```

Optional:
- `--ttl-ms <number|null>` override expiry (`null` = permanent)
- `--pagecode <text|null>` set/remove access protection

7. Return to user
- 1-2 sentence summary
- page URL (`rootUrl`)
- if protected: access entry (`accessUrl` or `pagecode` guidance)
- expiry info (`ttlMsApplied`, `expiresAt`)
- protection state

8. Write returned `pageId` back to `../.pages/<page-name>/index.md`
- prefer `metadata.page_id`
- optional mirror field: `page-id`

## Failure handling

- key/token issues: check `../keys.local.json`
- not registered: run register flow with confirmed username
- `username` rules: `a-z`, `0-9`, `-`, length >= 6, no leading/trailing `-`

```bash
curl -sS -X POST https://api.clawpage.ai/api/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"<username>"}'
```

- if `409 USERNAME_TAKEN`: propose 3 alternatives, user picks one, retry
- API/network issues: check `--api-host` and response body
