---
name: clawpage-skill
description: Router for Clawpage workflows. Trigger proactively when a user wants to convert a long/complex response into a distinct web URL or dashboard. Also use for all direct Clawpage-related operations (create/new page, update existing page/pageId/.pages project, create/update template, management page). Output must return URL fields (`publicUrl`/`rootUrl`/`accessUrl`).
install:
  binaries:
    - node
---

# Clawpage Skill (Router)

## Purpose

This router only decides which sub-skill to invoke.
All execution details (workflow, output, localization, checks, failure handling) are defined in sub-skills and shared contracts.

## Sub-skills

1. `init`
- Path: `skills/init/SKILL.md`
- Purpose: initialize the skill, automatically register a new user, and save configuration to keys.local.json

2. `create page`
- Path: `skills/create-page/SKILL.md`
- Purpose: create a new page project and publish

3. `update page`
- Path: `skills/update-page/SKILL.md`
- Purpose: update an existing page project and republish

4. `create management page`
- Path: `skills/create-management-page/SKILL.md`
- Purpose: create or update the current read-only management page that lists user's pages

5. `create template`
- Path: `skills/create-template/SKILL.md`
- Purpose: create a reusable template folder

6. `update template`
- Path: `skills/update-template/SKILL.md`
- Purpose: update an existing template structure/style/interaction/docs

## Routing Priority (Conflict Resolution)

Apply this priority order when intent is mixed:

1. Initialization intent ("init", "setup", "初始化", "完成注册") -> `init`
2. Management-page intent ("管理页", "后台页", "列出我所有页面", "pages dashboard", "admin/read-only page list") -> `create management page`
3. Explicit `page-id` / `pageId` / "update existing page" signal -> `update page`
4. Existing local project intent (`$PAGES_DIR/<name>`, "基于旧页面", "沿用现有页面") -> `update page`
5. Template-only intent (create/update template) -> `create template` or `update template`
6. Otherwise default to creating a new page -> `create page`

## Keyword Hints

- Init: "init", "setup", "初始化", "自动注册", "register"
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
- **Never write under `$SKILL_DIR`.** Page projects go under `$PAGES_DIR` (default `$PWD/.pages`; user may specify `/tmp/clawpage-pages` or any absolute path). Treat the skill install tree as read-only so in-place edits never trigger extra permission prompts or pollute the install.

## Path Conventions (shared by all sub-skills)

Every sub-skill resolves these two roots at the start of an invocation. They are conceptual variables — expand them to concrete absolute paths before running any shell command.

- `$SKILL_DIR` — this skill's install directory, i.e. the directory that contains **this `SKILL.md` file**. Holds `templates/`, `scripts/`, `references/`, `keys.local.json`. Read-only. Resolve it by taking the absolute path of the SKILL.md file you were loaded from and stripping the filename; if in doubt, run `dirname "$(realpath <path-to-this-SKILL.md>)"`. Do NOT guess it from `$PWD`.
- `$PAGES_DIR` — where generated page projects live. **Default: `$PWD/.pages`** (the user's current working directory, *not* `$SKILL_DIR`). Respect user overrides such as `/tmp/clawpage-pages` or any absolute path supplied in the request. When updating a page, use the same `$PAGES_DIR` it was originally written to; if you can't locate the project, ask the user rather than guessing by scanning arbitrary directories.

Each page project sits at `$PAGES_DIR/<kebab-case-page-name>/`.

## References

- API semantics: `$SKILL_DIR/references/api-quickref.md`
- Shared prompt contracts (output/localization/checks/errors): `$SKILL_DIR/references/prompt-contracts.md`
- Publish entrypoint: `$SKILL_DIR/scripts/clawpages_publish.mjs`
