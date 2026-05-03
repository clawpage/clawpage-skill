# Claude Code Notes

This is a Claude Code plugin. The user-facing README is in `README.md`; cross-platform contributor guide is in `AGENTS.md`. Read both first if you're touching code.

## How users install

```text
/plugin marketplace add https://github.com/clawpage/clawpage-skill
/plugin install clawpage
```

The `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` manifests at the repo root drive discovery. There is no per-machine local clone any more — Claude Code manages the plugin install via `/plugin install` and `/plugin update`.

## How skills are loaded

Each subdirectory under `skills/` containing a `SKILL.md` becomes one independently invocable skill, namespaced as `clawpage:<dirname>`. The plugin loader filters by `description` frontmatter — write descriptions that read like a contract: when to trigger, what default behavior to apply, what *not* to use it for.

There is no router. Earlier versions of this plugin had `skills/clawpage-skill/SKILL.md` as a top-level dispatcher; that pattern is gone. Each skill self-triggers.

## Slash commands

`commands/<name>.md` files become `/clawpage-init`, `/clawpage-publish`, `/clawpage-stats` (filename without extension is the slash). They wrap a target skill with a one-line frontmatter description and a body that says "run skill X".

## Cross-skill references

Inside a SKILL.md, refer to a sibling skill by its public name:

> See the `clawpage:use-sdk` skill for browser-side patterns.

Do **not** use `${CLAUDE_SKILL_DIR}/use-sdk/SKILL.md` — that path is brittle and obsolete in the flat layout.

## Reference docs

`references/api-quickref.md`, `references/prompt-contracts.md`, `references/design-guidelines.md` are shared markdown read by the LLM during a skill's workflow. They're not skills themselves (no SKILL.md, no frontmatter). Refer to them with the relative path `references/<file>.md`.

## When you make changes

1. Edit / add SKILL.md files directly. No build step.
2. Smoke-test by invoking the affected skill in Claude Code (the runtime is `@clawpage.ai/cli` from npm — `npx -y` will fetch it).
3. Bump `.claude-plugin/plugin.json` version following semver. Patch for prose-only edits, minor for new skills, major for breaking renames.
4. PR + merge → users get the new version on `/plugin update clawpage`.
