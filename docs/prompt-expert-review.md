# AI Prompt Expert Review: Project Architecture & Recent Changes

This document provides a comprehensive review of the `clawpage-skill` project's prompt architecture, routing logic, prompt contracts, and an analysis of the recent commits (`feat: complete manage-data CLI + AI-optimized SKILL.md` and `feat: integrate manage-data sub-skill into SKILL.md router`) from a prompt engineering and system design perspective.

## 1. Project Prompt Architecture Review

The `clawpage-skill` relies on a highly structured, LLM-based system that turns natural language requests into WebApps and handles data operations. The architecture cleanly separates routing logic (`SKILL.md`) from operational details (`skills/*/SKILL.md`).

### Strengths

*   **Explicit Routing via `SKILL.md`**: The top-level `SKILL.md` provides clear "Routing Priority (Conflict Resolution)" and "Keyword Hints". The recent addition of `manage-data` seamlessly integrates with this, adding clear hints like "data", "table", and "store" to trigger the `manage-data` flow without conflicting with page generation.
*   **Centralized Prompt Contracts (`references/prompt-contracts.md`)**: Shared constraints and checks are centrally located, establishing a robust baseline for all sub-skills.
*   **Anti-Generic-AI Checklist**: An explicit checklist actively targets common LLM default behaviors (e.g., using dark themes that clash with the UI or making up tools), maintaining high output quality.
*   **Idempotency Guards**: Workflows are structured to handle failures gracefully and retry intelligently, providing stateful and reliable interactions.

### Areas for Improvement

*   **Handling Random Generation**: The instructions often require generating random identifiers (like 6-digit `pagecode`s). LLMs can sometimes exhibit low entropy in pseudo-random generation depending on temperature settings. Long-term, deferring this to a robust backend generation could be safer.
*   **Output Schema Adherence**: While Markdown tables are used for defining JSON schemas, adopting JSON Schema or TypeScript interfaces within the prompt contracts could yield stronger adherence from the LLM.
*   **Username Generation**: The `init` skill handles registration by generating a username if none exists. To avoid loops on `USERNAME_TAKEN` errors, the prompt could be updated to append higher-entropy elements like short UUIDs or timestamps to the generated names.

## 2. Review of Recent Changes: `manage-data` Skill

The recent addition of the `manage-data` skill and the `scripts/clawpages_data.mjs` script significantly expands the project's capabilities from static/stateless apps to full-stack, data-driven applications.

### Analysis of Changes

*   **Data API Integration (`manage-data/SKILL.md`)**:
    *   **Impact**: The skill now has the ability to understand and fulfill requests for persistent data, state, and counters.
    *   **Prompt Impact**: The `SKILL.md` for `manage-data` is exceptionally well-structured. It acts as an "AI-optimized" contract, explicitly mapping out concepts like Quotas, Rate Limits, and schema design rules. By providing the LLM with a "Prompt-level checklist for AI" (Step 10), it forces a structured chain-of-thought, making the LLM evaluate whether data is even needed before designing the schema and picking write methods (`PUT` vs `POST` vs `PATCH`).
*   **The CLI Interface (`clawpages_data.mjs`)**:
    *   **Impact**: It provides the Agent with an immediate, executable interface for managing tables, testing data access, and performing migrations.
    *   **Prompt Impact**: By exposing standard CRUD operations mapped cleanly to REST methods and clearly explaining the nuances (e.g., the difference between `--patch` and `--put`), the prompt contract ensures the LLM uses the correct tool for the job. The error mapping table (Section 6) empowers the LLM to autonomously debug issues like `TABLE_NOT_FOUND` or `VALUE_TOO_LARGE`.
*   **Security & Quota Constraints**:
    *   **Impact**: Highlighting the risks of shipping `sk_` tokens to the browser and detailing rate limits ensures the LLM designs secure architectures.
    *   **Prompt Impact**: The guidelines actively discourage bad practices like embedding tokens in frontend code or building unbounded arrays inside a single record, steering the LLM towards scalable, one-record-per-item designs.

### Conclusion

The addition of the `manage-data` workflow is robustly integrated. The prompt contracts accompanying the new capability are meticulous, treating the LLM as an active developer by providing explicit limits, error resolutions, and security playbooks. This structure prevents hallucinated capabilities and ensures the generated web applications use the data store correctly and efficiently.
