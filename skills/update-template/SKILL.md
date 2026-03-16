---
name: clawpage-update-template
description: Update an existing Clawpage template (structure/style/interaction/docs) while keeping metadata-first selection and publish compatibility.
---

# Clawpage Update Template

## When to use

- User wants to revise a template UI/interaction/docs
- User asks to improve default template style/capabilities

## Paths and conventions

- Template directory: `./templates/[TEMPLATE_NAME]`
- Files: `index.html`, `default.css`, `default.js`, `meta.md`

## Template selection (two-phase)

1. Read metadata from `meta.md` first (`metadata.name`, `metadata.description`)
2. Read full `meta.md` only for shortlisted candidates

## Update workflow

1. Update `index.html` structure (do not drop required placeholders)
2. Update `default.css` visual system
3. Update `default.js` interaction/render logic
4. Sync `meta.md` metadata and usage notes
5. Fill/normalize localization placeholders for user-visible text
- use semantic placeholders (for example `[EXPIRE_AT]`, `[GENERATED_AT]`, `[SEARCH_PLACEHOLDER]`)
- do not use numeric key placeholders
- do not maintain key-mapping tables; fill directly with user-preferred language text

6. Validate with dry-run:

**Note:** Always replace `[TEMPLATE_NAME]` with the actual kebab-case name.

```bash
node ./scripts/clawpages_publish.mjs \
  --page-dir ./templates/[TEMPLATE_NAME] \
  --title "Template Preview" \
  --dry-run
```

## Must preserve

- `index.html` placeholders:
  - `__PAGE_TITLE__`
  - `__PAGE_SUBTITLE__`
  - `__GENERATED_AT__`
  - `__EXPIRES_AT__`
  - `__DEFAULT_CSS__`
  - `__DEFAULT_JS__`
  - `__CONTENT_HTML__`
- Keep template suitable for WebApp scenarios, not article-only pages
