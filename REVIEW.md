# Clawpage Project & Recent Changes Review

## Overview

As an AI prompt expert and engineer, I have conducted a thorough review of the `clawpage-skill` repository, its architectural decisions, prompt contracts, and the recent changes introduced in the `#28 feat/analytics` PR.

The project leverages a well-structured approach to converting natural language descriptions into fully-fledged, styled, and interactive web applications via an AI agent router.

### Strengths
- **Clear Routing Mechanism**: `SKILL.md` acts as a solid router to determine intent (`create-page`, `manage-data`, `view-stats`, etc.) with prioritized fallback logic.
- **Strict Prompt Contracts**: `references/prompt-contracts.md` strictly scopes the LLM's boundary, ensuring critical variables (`__DEFAULT_CSS__`, `__DEFAULT_JS__`, `__CONTENT_HTML__`) are maintained.
- **Design Intent**: `references/design-guidelines.md` actively fights "generic AI design" by forcing distinct typography combinations, color palettes, and asymmetrical layouts rather than defaulting to generic cards.
- **Idempotency & Failure Recovery**: The workflows handle limits gracefully (e.g., `429` errors) and correctly instruct the agent not to wipe out local data if the publish script fails, maintaining continuity via `metadata.page_id`.

## Review of Recent Changes (`feat/analytics`)

The recent changes introduced a new sub-skill (`view-stats`) and an analytics script (`clawpages_stats.mjs`).

### Architecture & Privacy
The implementation follows a privacy-respecting "L1" tracking approach (storing only timestamp and pageKey) deliberately avoiding IP, UA, or geolocation tracking. This significantly simplifies GDPR compliance and is an excellent architectural decision for the project's scale.

### CLI Usability & Edge Cases
1. The `scripts/clawpages_stats.mjs` elegantly wraps the Clawpage stats API.
2. **Missing usage output edge-case**: If a user runs `node scripts/clawpages_stats.mjs --help` *without* a `keys.local.json` file, the script throws an unhandled `Error: keys.local.json not found` inside `keysPath()` before it even processes the args. It's a minor UX issue, but typical of CLI scripts that eagerly load configurations.

## Recommended Prompt Tuning

1. **Localization Clarification**: While `prompt-contracts.md` states "infer language from prompt", it could be improved by strictly forbidding the agent from outputting JSON in one language and HTML in another, preventing mismatched localization between the UI and the post-publish chat message.
2. **Placeholder Discipline**: The requirement to replace `__CONTENT_HTML__` is clear, but occasionally AI models leave partial markdown wrapping (e.g., ````html...````) in the final output. The contracts should explicitly forbid markdown code blocks when writing directly into `index.html`.

## Codebase Maintenance

- I've resolved the documentation spelling errors by generating an appropriate `cspell.json` file with project-specific terminology (e.g., `clawpage`, `clawpages`, `frontmatter`, `glassmorphism`, `inlines`, etc.). This ensures future contributions remain clean and consistent.

## Summary
The system is robust and handles the orchestration between local file generation and remote API publication exceptionally well. The analytics module is a lightweight, sensible addition that respects the existing design paradigm.
