# Code Review Report: clawpage Skill

## Overview

The `clawpage-skill` acts as a routing mechanism and prompt framework allowing an AI to effectively construct and update interactive clawpage web apps based on user requests. Recent changes in the repository (`commit 965c662`) have introduced several new templates, a routing mechanism (`SKILL.md` file), new browser SDK integrations, and detailed prompt contracts for predictable AI behavior.

## Architectural Analysis

The system is cleverly structured as a set of nested "skills" where a top level `SKILL.md` router delegates to sub-skills (e.g. `create-page`, `update-page`, `use-sdk`). This limits prompt size and ensures context stays relevant to the user's specific request. The architecture relies heavily on specific variables being present to handle template generation (`__CONTENT_HTML__`, `__DEFAULT_CSS__`, `__DEFAULT_JS__`), which are rigorously tested via the dry run script logic (`scripts/clawpages_publish.mjs --dry-run`).

## Review of Recent Changes

### 1. New Templates (`stock-analysis-terminal`, `utility-workbench`, etc.)

**Positives:**
- The newly introduced templates expand the AI's ability to satisfy a range of specific requests like dashboards and analytical text tools without having to instruct the AI to write complex styling or logic from scratch.
- The use of `meta.md` per template successfully specifies explicit "slots" to be filled (e.g., `[TEMPLATE_DESCRIPTION]`, `[TARGET_AUDIENCE_LABEL]`), making it easy for the AI to localize the template without losing the structural metadata.
- Pre-made CSS properties allow the AI to follow design constraints (like avoiding dark mode text on dark templates) while still making adjustments using specific `--font-display` and standard color variables.

**Potential Risks:**
- While `meta.md` lists placeholder requirements well, there's always a risk the AI may hallucinate or fail to map all labels (like `[TEXT_PROCESSING]`). The rigid check in `clawpages_publish.mjs` against unresolved `__CONTENT_HTML__` ensures the page won't be blank, but it does not test if the localized variables were successfully resolved inside `__CONTENT_HTML__`.

### 2. Prompt Contracts (`references/prompt-contracts.md`)

**Positives:**
- The prompt contract gives a single source of truth for constraints. The explicit instructions not to remove system placeholders and the requirement to return a consistent JSON schema greatly improve parse-ability.
- Setting clear error handling expectations (e.g., handling HTTP `429` with specific user instructions instead of failing silently) makes the AI more resilient when interacting with the API.
- Creating specific "Hard Checklists" that the AI must verify prior to publishing significantly reduces the error rate of incomplete operations.

**Areas for Improvement:**
- The error mapping for `LOCAL_KEYS_FILE_MISSING` correctly tells the AI to create a default user. However, providing the AI with rules regarding exactly what constitutes a "DNS-safe, creative username" directly in the contract might reduce API rejections. Currently, the rules are found in the `README.md` but might be missed when only reading the contract.

### 3. The Browser SDK Integration (`skills/use-sdk/SKILL.md`)

**Positives:**
- Moving from raw `fetch` calls to an encapsulated `window.clawpage` API ensures the AI generated code will be far more stable, have proper error handling, and be less vulnerable to logic mistakes.
- Explicitly separating server-side logic from the Browser SDK (i.e. strictly prohibiting owner tokens (`sk_*`) from appearing in public-page JS) directly mitigates serious security risks.

## Final Summary

The prompt design and architecture is highly robust. By utilizing explicit error handling, well defined JSON output schemas, and multi-step verification checks ("non-empty content gate"), the system minimizes hallucination and API failure states while keeping the AI focused on design and structural logic.
