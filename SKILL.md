---
name: clawpage-skill
description: Clawpage router skill that dispatches to create page / update page / create template / update template workflows. Use when a user wants to build, revise, or publish a Clawpage web page/template and get a URL.
---

# Clawpage Skill (Router)

## When to use

- User wants a new Clawpage web page
- User wants to revise an existing page
- User wants a new template or template update
- User wants publish output with URL / pageId / expiry / access-code status

## Sub-skills

1. `create page`
- Path: `skills/create-page/SKILL.md`
- Purpose: create a page project and publish (create default TTL 6h, supports `pagecode`)

2. `update page`
- Path: `skills/update-page/SKILL.md`
- Purpose: update an existing page project and publish (prefer `page-id` from `index.md`, supports TTL/pagecode updates)

3. `create template`
- Path: `skills/create-template/SKILL.md`
- Purpose: create a reusable template folder

4. `update template`
- Path: `skills/update-template/SKILL.md`
- Purpose: update an existing template structure/style/interaction/docs

## Routing rules

- "create/new page" -> `create page`
- "update/rework existing page" -> `update page`
- "create/new template" -> `create template`
- "update/improve template" -> `update template`

## Global conventions

- API default: `https://api.clawpage.ai`
- Preview URL pattern: `https://u-[username].clawpage.ai/pages/[pageId]`
- Key file: `keys.local.json`
- Page folder: `.pages/<page-name>`
- Template folder: `templates/<template-name>`
- Publish script: `scripts/clawpages_publish.mjs`
- API reference: `references/api-quickref.md`

## Registration workflow

If `keys.local.json` does not exist, register first (`username` required):

- Do not pick a username on behalf of the user without confirmation.
- If user does not provide one, propose 3 options based on user context.
- Prefer `semantic-word + hyphen + short-digits` (example: `builder-lab-27`).

Username rules:

- lowercase letters, digits, hyphen only (`a-z`, `0-9`, `-`)
- length >= 6
- cannot start or end with `-`

```bash
curl -sS -X POST https://api.clawpage.ai/api/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"<username>"}'
```

If API returns `409 USERNAME_TAKEN`:

- explicitly tell user the name is already taken
- provide 3 new candidates based on the original candidate
- prefer adding 2-4 digits or suffixes like `-lab`, `-app`
- retry registration after user selection

Save token to `keys.local.json`:

```json
{
  "clawpage": {
    "token": "sk_replace_me",
    "apiHost": "https://api.clawpage.ai"
  }
}
```

## Localization placeholders policy

- Use semantic placeholders for localized text (for example `[EXPIRE_AT]`, `[GENERATED_AT]`, `[SEARCH_PLACEHOLDER]`).
- Do not use numeric key placeholders.
- Do not maintain any key-mapping table; fill placeholders directly in user-preferred language.
- Infer preferred language from the user's prompt; if unclear, ask briefly.
- Apply this rule to page/template content and user-visible labels.

## Common publish command

```bash
node scripts/clawpages_publish.mjs \
  --page-dir .pages/<page-name> \
  --title "<TITLE_PLACEHOLDER>" \
  --subtitle "<SUBTITLE_PLACEHOLDER>"
```

Create mode default TTL is 6h (`21600000`) unless `--ttl-ms` overrides it.

## Output contract

- Return a short 1-2 sentence summary
- Return two page URLs:
  - URL without `pagecode` (`rootUrl` / `pageUrlNoPagecode`)
  - URL with `pagecode` (`accessUrl` / `pageUrlWithPagecode`) when protection is enabled
- Always include sharing guidance:
  - for cautious external sharing, prefer the URL without `pagecode`
  - share `pagecode` only with intended recipients
- Return expiry info and protection status for both create/update
- If this run sets `pagecode`, return the current code
- On failure, return explicit cause and actionable fix
