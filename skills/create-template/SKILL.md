---
name: create-template
description: Create a new reusable clawpage template (`index.html` / `default.css` / `default.js` / `meta.md`) that page projects can scaffold from. Trigger when user says "new template", "create a clawpage template", "模板搭建", or wants to author a stylistic foundation for future pages. Templates ship without the SDK script — pages that need dynamic features add it via the `use-sdk` skill.
---

# Clawpage Create Template

## When to use

- User wants a new template style/capability
- A reusable template directory must be created

> **Templates stay static.** Don't hard-bake the SDK `<script>` tag into a template's `index.html` — it bloats static pages that don't need state. If a page built on the template later needs dynamic features, the `use-sdk` skill adds the SDK at page-generation time. See `the `use-sdk` skill`.

> **Templates stay static.** Don't hard-bake the SDK `<script>` tag into a template's `index.html` — it bloats static pages that don't need state. If a page built on the template later needs dynamic features, the `use-sdk` skill adds the SDK at page-generation time. See `the `use-sdk` skill`.

## Template directory spec

Create: `./templates/[TEMPLATE_NAME]/`

Required files:
- `index.html`
- `default.css`
- `default.js`
- `meta.md`

## Required constraints

- **Design reference:** follow `references/design-guidelines.md` for visual quality expectations.
- `index.html` must include placeholders:
  - `__CONTENT_HTML__`
  - `__DEFAULT_CSS__`
  - `__DEFAULT_JS__`
- The LLM renders all visible content (title, subtitle, timestamps, etc.) directly within `__CONTENT_HTML__`; the publish script only inlines CSS/JS.
- `meta.md` must include metadata: `metadata.name`, `metadata.description`
- default structure should be WebApp-oriented, not article-only
- **Design system flexibility**: templates must provide CSS variable slots (`--font-display`, `--font-body`, `--primary`, `--accent`) so that page projects can customize fonts and colors without modifying template structure.

## Workflow

1. Create template directory and required files
2. Write `meta.md` (metadata + usage notes)
3. Write `index.html` structure
4. Write `default.css` visual system
5. Write `default.js` interactions/components
6. Ensure placeholders are semantic and can be filled directly by user-preferred language (no key mapping table)
7. Validate with dry-run:

**Note:** Always replace `[TEMPLATE_NAME]` in the following commands with the actual kebab-case name.

```bash
npx -y @clawpage.ai/cli publish \
  --page-dir ./templates/[TEMPLATE_NAME] \
  --title "Template Preview" \
  --dry-run
```
