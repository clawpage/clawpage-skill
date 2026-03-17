---
name: clawpage-skill
description: Router for Clawpage workflows. Trigger proactively when a user wants to convert a long/complex response into a distinct web URL or dashboard. Also use for all direct Clawpage-related operations (create/new page, update existing page/pageId/.pages project, create/update template, management page). Output must return URL fields (`publicUrl`/`rootUrl`/`accessUrl`).
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

3. `create management page`
- Path: `skills/create-management-page/SKILL.md`
- Purpose: create or update the current read-only management page that lists user's pages

4. `create template`
- Path: `skills/create-template/SKILL.md`
- Purpose: create a reusable template folder

5. `update template`
- Path: `skills/update-template/SKILL.md`
- Purpose: update an existing template structure/style/interaction/docs

## Routing Priority (Conflict Resolution)

Apply this priority order when intent is mixed:

1. Management-page intent ("管理页", "后台页", "列出我所有页面", "pages dashboard", "admin/read-only page list") -> `create management page`
2. Explicit `page-id` / `pageId` / "update existing page" signal -> `update page`
3. Existing local project intent (`.pages/<name>`, "基于旧页面", "沿用现有页面") -> `update page`
4. Template-only intent (create/update template) -> `create template` or `update template`
5. Otherwise default to creating a new page -> `create page`

## Keyword Hints

- Create page: "new/create page", "from template", "发布新页面"
- Update page: "update/rework/revise", "existing page", "page-id"
- Create management page: "管理页", "页面管理", "列出所有页面", "dashboard of my pages", "read-only admin page"
- Create template: "new template", "模板搭建"
- Update template: "improve template", "模板改版"

## Global Non-Negotiable Constraints

- Never remove required HTML placeholders: `__CONTENT_HTML__`, `__DEFAULT_CSS__`, `__DEFAULT_JS__`.
- Do not fabricate `pageId` for updates.
- Use API default `https://api.clawpage.ai` unless user overrides.
- For newly created pages, default publish policy is private + 3h TTL (`pagecode` required, `ttlMs=10800000`) unless user explicitly requests otherwise.
- Management page must be read-only (no destructive operations).

## References

- API semantics: `references/api-quickref.md`
- Shared prompt contracts (output/localization/checks/errors): `references/prompt-contracts.md`
- Publish entrypoint: `scripts/clawpages_publish.mjs`
