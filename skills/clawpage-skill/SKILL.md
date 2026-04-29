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
- Path: `${CLAUDE_SKILL_DIR}/init/SKILL.md`
- Purpose: initialize the skill, automatically register a new user, and save configuration to keys.local.json

2. `create page`
- Path: `${CLAUDE_SKILL_DIR}/create-page/SKILL.md`
- Purpose: create a new page project and publish

3. `update page`
- Path: `${CLAUDE_SKILL_DIR}/update-page/SKILL.md`
- Purpose: update an existing page project and republish

4. `create management page`
- Path: `${CLAUDE_SKILL_DIR}/create-management-page/SKILL.md`
- Purpose: create or update the current read-only management page that lists user's pages

5. `create template`
- Path: `${CLAUDE_SKILL_DIR}/create-template/SKILL.md`
- Purpose: create a reusable template folder

6. `update template`
- Path: `${CLAUDE_SKILL_DIR}/update-template/SKILL.md`
- Purpose: update an existing template structure/style/interaction/docs

## Routing Priority (Conflict Resolution)

Apply this priority order when intent is mixed:

1. Initialization intent ("init", "setup", "初始化", "完成注册") -> `init`
2. Management-page intent ("管理页", "后台页", "列出我所有页面", "pages dashboard", "admin/read-only page list") -> `create management page`
3. Explicit `page-id` / `pageId` / "update existing page" signal -> `update page`
4. Existing local project intent (`.pages/<name>`, "基于旧页面", "沿用现有页面") -> `update page`
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

## References

- API semantics: `${CLAUDE_SKILL_DIR}/references/api-quickref.md`
- Shared prompt contracts (output/localization/checks/errors): `${CLAUDE_SKILL_DIR}/references/prompt-contracts.md`
- Publish entrypoint: `npx -y @clawpage.ai/cli publish` (npm package [@clawpage.ai/cli](https://www.npmjs.com/package/@clawpage.ai/cli))

## Path Conventions

- **Bash commands** — invoke runtime via `npx -y @clawpage.ai/cli <subcommand>`. The CLI ships scripts + templates from npm; no plugin-relative paths needed, no permission prompts on `~/.claude/...`.
- **Read-only references** — `${CLAUDE_SKILL_DIR}/references/...` for plugin-bundled docs (api / contracts / design guidelines). Read by Claude, not executed.
- **Pages** — `[PAGE_DIR]` resolved once per task. Default `~/.clawpage/pages/<name>/` (global workspace, since `@clawpage.ai/cli` 0.2.0). User may opt into project-scoped paths like `./.pages/<name>/` to check pages into a specific repo.
- **Auth** — `~/.clawpage/keys.local.json` (auto-created by `npx -y @clawpage.ai/cli init`). Project-scoped `./keys.local.json` in cwd takes precedence if present.
