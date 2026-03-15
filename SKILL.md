---
name: clawpage-skill
description: Router for Clawpage workflows. Trigger on intents like create/new page, update existing page/pageId/.pages project, create/update template, publish and return URL fields (`publicUrl`/`rootUrl`/`accessUrl`). Do not use for unrelated coding tasks outside Clawpage page/template lifecycle.
---

# Clawpage Skill (Router)

## Purpose

This router only decides which sub-skill to invoke.
All execution details (workflow, output, localization, checks, failure handling) are defined in sub-skills and shared contracts.

## Sub-skills

1. `create page`
- Path: `skills/create-page/SKILL.md`
- Purpose: create a new page project and publish

2. `update page`
- Path: `skills/update-page/SKILL.md`
- Purpose: update an existing page project and republish

3. `create template`
- Path: `skills/create-template/SKILL.md`
- Purpose: create a reusable template folder

4. `update template`
- Path: `skills/update-template/SKILL.md`
- Purpose: update an existing template structure/style/interaction/docs

## Routing Priority (Conflict Resolution)

Apply this priority order when intent is mixed:

1. Explicit `page-id` / `pageId` / "update existing page" signal -> `update page`
2. Existing local project intent (`.pages/<name>`, "基于旧页面", "沿用现有页面") -> `update page`
3. Template-only intent (create/update template) -> `create template` or `update template`
4. Otherwise default to creating a new page -> `create page`

## Keyword Hints

- Create page: "new/create page", "from template", "发布新页面"
- Update page: "update/rework/revise", "existing page", "page-id"
- Create template: "new template", "模板搭建"
- Update template: "improve template", "模板改版"

## Global Non-Negotiable Constraints

- Never remove required HTML placeholders: `__CONTENT_HTML__`, `__DEFAULT_CSS__`, `__DEFAULT_JS__`, `__PAGE_TITLE__`, `__PAGE_SUBTITLE__`, `__GENERATED_AT__`, `__EXPIRES_AT__`.
- Do not fabricate `pageId` for updates.
- Use API default `https://api.clawpage.ai` unless user overrides.

## References

- API semantics: `references/api-quickref.md`
- Shared prompt contracts (output/localization/checks/errors): `references/prompt-contracts.md`
- Publish entrypoint: `scripts/clawpages_publish.mjs`
