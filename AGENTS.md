# Repository Guidelines

> **For coding agents working on this repo.** Per-platform notes also live in `CLAUDE.md` (Claude Code) and `GEMINI.md` (Gemini CLI).

## What this repo is

A coding-agent **plugin** for [Clawpage](https://clawpage.ai). It contains only LLM-facing instructions (SKILL.md files); the executable runtime ships separately as the [`@clawpage.ai/cli`](https://www.npmjs.com/package/@clawpage.ai/cli) npm package.

## Project structure

```
.claude-plugin/plugin.json        Claude Code manifest
.claude-plugin/marketplace.json   Claude Code marketplace entry
.codex-plugin/plugin.json         Codex manifest
gemini-extension.json             Gemini CLI extension manifest
skills/                           FLAT — each subdirectory is one skill
├── init/SKILL.md
├── create-page/SKILL.md
├── update-page/SKILL.md
├── create-management-page/SKILL.md
├── create-template/SKILL.md
├── update-template/SKILL.md
├── manage-data/SKILL.md
├── manage-links/SKILL.md
├── manage-blobs/SKILL.md
├── view-stats/SKILL.md
└── use-sdk/SKILL.md
references/                       shared docs (API quickref, prompt contracts, design guidelines) — read-only
commands/                         slash-command entrypoints (clawpage-init, clawpage-publish, clawpage-stats)
docs/                             additional docs (e.g. README.zh-CN.md)
```

There is **no router**. Each skill is independently invocable by name (`clawpage:init`, `clawpage:create-page`, etc.) — coding agents pick the right one based on the SKILL.md `description` frontmatter.

**No `scripts/` or `templates/` here**. Those live in the `@clawpage.ai/cli` npm package and are invoked via `npx -y @clawpage.ai/cli ...`. Never reintroduce them.

## Path conventions

- **Auth** — `~/.clawpage/keys.local.json` (auto-created by `npx -y @clawpage.ai/cli init`). Project-scoped `./keys.local.json` in cwd takes precedence.
- **Pages** — default `~/.clawpage/pages/<page-name>/` (bare-name input to `--page-dir`). Path-like input (`./...`, `~/...`, absolute) is honored as-is.
- **Plugin install dir** — read-only. The plugin must never be configured to write into `~/.claude/plugins/...` or any other install path. All page projects belong under `~/.clawpage/pages/` or user CWD.
- **References** — skills refer to shared docs as `references/<file>.md` (relative to plugin root). Never use `${CLAUDE_SKILL_DIR}/...` (legacy) or `~/.claude/...` absolute paths.

## Build / test / development

```bash
# Dry-run a template bundle (no auth required):
npx -y @clawpage.ai/cli scaffold general_template /tmp/preview
npx -y @clawpage.ai/cli publish --page-dir /tmp/preview --title "Preview" --dry-run

# Publish a real page:
npx -y @clawpage.ai/cli publish --page-dir <page-name> --title "My Page"

# One-time auth setup:
npx -y @clawpage.ai/cli init
```

## SKILL.md authoring rules

- Each `skills/<name>/SKILL.md` has YAML frontmatter with `name` (short, no `clawpage-` prefix — namespace is automatic) and `description` (the trigger contract).
- Skill directory names are `kebab-case`. They define the public skill name (`clawpage:<dirname>`).
- Cross-skill references use the skill name: "see the `clawpage:use-sdk` skill", not `${CLAUDE_SKILL_DIR}/use-sdk/SKILL.md`.
- Runtime invocations are `npx -y @clawpage.ai/cli <subcommand>` exclusively. Never `node scripts/...` or any plugin-relative executable path.
- Frontmatter `description` is what triggers the skill — write it for an LLM that has no other context. Lead with a verb, list trigger keywords, name the default policy in one clause.

## Clawpage Browser SDK (page-side JS)

- All page-side JS that hits Clawpage APIs (data tables, atomic incr, short links, stats, blobs, `/api/me`) MUST use the Browser SDK: `https://clawpage.ai/sdk.js` (IIFE) or `https://clawpage.ai/sdk.mjs` (ESM). Raw `fetch('/api/...')` in page HTML/JS is forbidden.
- CLI scope (`@clawpage.ai/cli`'s Node scripts) may keep using raw `fetch`/`curl` — the SDK is browser-targeted.
- Owner `sk_*` tokens must NEVER appear in **any** browser-shipped page JS — including pagecode-protected pages. Pagecodes are not a token container: they can be shared, the page source can be inspected via DevTools, and browser caches persist. The only acceptable contexts for an `sk_*` token are CLI invocations and server-side processes you control.
- See the `clawpage:use-sdk` skill.

## Testing

- No automated test framework. Use the cli's `--dry-run` for bundle validation.
- For SKILL.md changes, smoke-test by triggering the skill on a real prompt in your coding agent.

## Commit & PR

- Conventional Commits: `feat`, `fix`, `chore`, `docs`, `refactor`, etc.
- Scope per skill or cross-cutting concern (`feat(skills/manage-data): ...`, `chore(plugin): ...`).
- PRs include purpose, changed paths, and verification commands run.

## Security & configuration

- Never commit `keys.local.json`.
- The runtime (`@clawpage.ai/cli`) handles token discovery; SKILL.md files refer to it abstractly (`run npx -y @clawpage.ai/cli init` for first-time auth) rather than instructing the LLM to construct the token file by hand.
- The `init` skill is **idempotent**: calling it when already initialized is a no-op (exit 0). Switching accounts requires `--force` and explicit user confirmation.
