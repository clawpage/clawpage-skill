# AI Prompt Expert Review: clawpage-skill

## Overview

The `clawpage-skill` project exhibits a sophisticated and robust architecture for an LLM-driven application. It effectively leverages a hierarchical prompting structure, separating high-level intent routing from detailed sub-skill execution. This review assesses the prompt architecture, instruction quality, constraint enforcement, error handling, and recent repository changes from the perspective of an AI prompt expert.

## 1. Prompt Architecture & Routing

### Strengths
- **Hierarchical Routing:** The top-level `SKILL.md` acts as a pure router, delegating tasks to specific sub-skills (`create-page`, `update-page`, etc.). This is an excellent pattern that prevents context bloat in the main prompt and keeps the AI focused on the immediate task.
- **Clear Intent Prioritization:** The "Routing Priority (Conflict Resolution)" section in the main `SKILL.md` is brilliant. Giving the LLM an explicit numbered list to resolve conflicting intents (e.g., Init > Management > Update > Create) eliminates ambiguity and ensures deterministic routing behavior.
- **Keyword Hints:** Providing explicit keyword hints (e.g., "管理页", "pages dashboard") helps the LLM reliably trigger the correct sub-skill even with varying user phrasing.

### Areas for Improvement
- None identified in the routing logic; it is exceptionally well-designed for a multi-agent or complex multi-step workflow.

## 2. Instruction Quality & Constraints

### Strengths
- **Prompt Contracts:** The use of `references/prompt-contracts.md` as a single source of truth for output schemas, shared constraints, and error mappings is highly effective. It ensures consistency across all sub-skills.
- **Non-Negotiable Constraints:** The instructions explicitly label critical rules (e.g., "Global Non-Negotiable Constraints", "Crucial for error recovery"). Emphasizing *what not to do* (e.g., "Never remove required HTML placeholders", "Do not fabricate pageId") is just as important as telling the AI what to do, and this project does it perfectly.
- **Design Guidelines Enforcement:** The `create-page/SKILL.md` explicitly references the "Quality Bar & UI Expectations" and mandates the use of modern UI elements (Tailwind, Mermaid.js). The "Anti-Generic-AI Checklist" is a particularly strong prompt engineering technique to prevent bland, repetitive outputs.

### Areas for Improvement
- **Placeholder Redundancy:** The instruction to not replace `__DEFAULT_CSS__` and `__DEFAULT_JS__` is repeated in multiple places (AGENTS.md, SKILL.md, prompt-contracts.md). While repetition can reinforce constraints, relying on the central `prompt-contracts.md` and keeping the sub-skills focused strictly on workflow might make the prompts slightly leaner, though this is a minor nitpick.

## 3. Error Handling & Idempotency

### Strengths
- **Concrete Action Mapping:** The "Error Code -> Action Mapping" is incredibly detailed. It doesn't just list errors; it tells the LLM exactly how to recover (e.g., `LOCAL_TOKEN_MISSING` -> auto-register, but "DO NOT create a Clawpage intro page").
- **Idempotency Guard:** The Idempotency Guard in `create-page/SKILL.md` is the standout feature of this repository's prompt engineering. Instructing the AI to check `meta.md` for `page_id` to determine if a remote page was created before a failure, and switching strategies to `update-page` if it was, prevents duplicate resources and demonstrates a deep understanding of how AI agents interact with stateful systems.

## 4. Review of Recent Changes (Commit 8b1bba6)

### Analysis
The recent commit (`8b1bba6`: "fix: quote descriptions in SKILL.md to resolve YAML parsing errors") addressed a critical infrastructure issue.

- **The Issue:** The `SKILL.md` files use YAML frontmatter to define metadata (name, description, install binaries). Previously, some descriptions contained characters (like colons, commas, or specific line breaks) that could cause standard YAML parsers to fail or interpret the structure incorrectly.
- **The Fix:** Wrapping the `description` fields in double quotes ensures that the YAML parser treats the entire block as a single string literal, preventing parsing errors.
- **AI Impact:** This is crucial. If the system routing the AI relies on parsing this YAML to understand the available tools or skills, a parsing error would break the entire workflow. The fix ensures the AI framework can reliably load and process the prompt definitions. I have verified via a local Node.js script that all `SKILL.md` files now parse successfully with a standard YAML library.

## Conclusion

The `clawpage-skill` project represents a best-in-class example of prompt engineering for complex, stateful applications. The use of routing, shared contracts, explicit anti-patterns, and robust idempotency guards provides the LLM with the exact boundaries and recovery strategies needed to operate autonomously and reliably.