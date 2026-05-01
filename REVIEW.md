# Clawpage Skill Project Review

## 1. Project Architecture
The **clawpage-skill** project acts as an LLM-based system that turns long text into interactive Clawpage web apps. It leverages prompt contracts stored in the `skills/` directory to instruct the agent on generating code within predefined templates.

Key structural aspects include:
- **Router Pattern:** The top-level `skills/clawpage-skill/SKILL.md` acts as a routing mechanism deciding which sub-skill (e.g., `create-page`, `update-page`, `create-template`, `use-sdk`) to invoke.
- **Sub-skills:** Each sub-skill contains its own execution details, validations (like Idempotency Guards), and specific constraints. For example, `use-sdk` injects browser SDK code, and `view-stats` fetches page-view counts.
- **External Runtime:** The repository itself does not house execution scripts or templates anymore. It relies entirely on the `@clawpage.ai/cli` npm package executed via `npx` (e.g., `npx -y @clawpage.ai/cli publish`). This decoupling ensures the plugin directory remains lightweight and focuses solely on prompt engineering.
- **Cross-CLI Compatibility:** The project functions as a plugin for Claude Code, OpenClaw, Gemini CLI (via `gemini-extension.json`), and Codex (via a root-level `SKILL.md` symlink).

## 2. Recent Changes Analysis
The project has recently undergone several infrastructural and bug-fixing updates:
- **Strict Frontmatter Parsing Fix (`fix(plugin): drop unrecognized install:binaries:node frontmatter`):** Removed `install` fields from `SKILL.md` frontmatters. Claude Code's plugin loader was silently skipping skills due to these unrecognized keys. This change was crucial for ensuring the skills register successfully.
- **Marketplace Discovery (`fix(marketplace): use github plugin source`):** Changed the plugin source to a GitHub self-reference (`github clawpage/clawpage-skill`) instead of a relative path. This resolves ambiguous resolution when the marketplace and plugin share the same `.claude-plugin/` directory.
- **OpenClaw Support (`docs: add OpenClaw install section`):** Expanded cross-CLI availability documentation to include OpenClaw installation commands.
- **Relicensing (`chore: relicense plugin from MIT to MIT-0`):** Switched the plugin license to MIT-0 (MIT No Attribution) to meet clawhub marketplace requirements for zero-friction redistribution, updating footers across standard and translated READMEs.
- **Distribution Scripts (`chore: add pack_skill.sh`):** Created a packaging script to exclude non-standard files (like extensionless `LICENSE`) from the tarball because certain distribution channels (like clawhub) reject them.

## 3. Observations and Minor Issues
While reviewing the recent changes and file contents, one minor bug was observed:
- **Duplicate Paragraph in `update-template` Skill:** In `skills/clawpage-skill/update-template/SKILL.md`, there is a duplicated block of text regarding templates staying static:

  ```markdown
  > **Templates stay static.** Don't hard-bake the SDK `<script>` tag into a template's `index.html` — it bloats static pages that don't need state. If a page built on the template later needs dynamic features, the `use-sdk` skill adds the SDK at page-generation time. See `${CLAUDE_SKILL_DIR}/use-sdk/SKILL.md`.

  > **Templates stay static.** Don't hard-bake the SDK `<script>` tag into a template's `index.html` — it bloats static pages that don't need state. If a page built on the template later needs dynamic features, the `use-sdk` skill adds the SDK at page-generation time. See `${CLAUDE_SKILL_DIR}/use-sdk/SKILL.md`.
  ```
  This duplicate block should be consolidated to improve the clarity of the instructions for the LLM.
