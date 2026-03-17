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
5. All visible text (title, subtitle, timestamps, etc.) is rendered by the LLM directly; do not rely on script-managed placeholders.

6. Validate with dry-run:

**Note:** Always replace `[TEMPLATE_NAME]` with the actual kebab-case name.

```bash
node ./scripts/clawpages_publish.mjs \
  --page-dir ./templates/[TEMPLATE_NAME] \
  --title "Template Preview" \
  --dry-run
```

## Must preserve

- **Design reference:** follow `./references/design-guidelines.md` for visual quality expectations.
- `index.html` placeholders:
  - `__DEFAULT_CSS__`
  - `__DEFAULT_JS__`
  - `__CONTENT_HTML__`
- The LLM renders all visible content (title, subtitle, timestamps, etc.) directly within `__CONTENT_HTML__`
- Keep template suitable for WebApp scenarios, not article-only pages
- Preserve CSS variable slots (`--font-display`, `--font-body`, `--primary`, `--accent`) for page-level customization
