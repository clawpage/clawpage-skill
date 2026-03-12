---
name: clawpages-create-template
description: Create a new ClawPages template (index.html/default.css/default.js/index.md) that is reusable in page projects and compatible with publish bundling.
---

# ClawPages Create Template

## When to use

- User wants a new template style/capability
- A reusable template directory must be created

## Template directory spec

Create: `../templates/<template-name>/`

Required files:
- `index.html`
- `default.css`
- `default.js`
- `index.md`

## Required constraints

- `index.html` must include placeholders:
  - `__PAGE_TITLE__`
  - `__PAGE_SUBTITLE__`
  - `__GENERATED_AT__`
  - `__EXPIRES_AT__`
  - `__CONTENT_HTML__`
  - `__DEFAULT_CSS__`
  - `__DEFAULT_JS__`
- `index.md` must include metadata: `metadata.name`, `metadata.description`
- default structure should be WebApp-oriented, not article-only
- user-visible text should use uppercase localization placeholders when required by project conventions

## Workflow

1. Create template directory and required files
2. Write `index.md` (metadata + usage notes)
3. Write `index.html` structure
4. Write `default.css` visual system
5. Write `default.js` interactions/components
6. Ensure placeholders are designed to be filled by user-preferred language
7. Validate with dry-run:

```bash
node ../scripts/clawpages_publish.mjs \
  --page-dir ../templates/<template-name> \
  --title "Template Preview" \
  --dry-run
```
