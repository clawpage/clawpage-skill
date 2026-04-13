# AI Prompt Expert Review Report

## 1. Project Architecture & Prompt Routing
The project correctly employs a **routing architecture** via the top-level `SKILL.md`, which routes requests to more specialized sub-skills (e.g., `create-page`, `update-page`, `create-template`). This is a highly recommended practice for complex LLM-based applications:
- **Context Isolation:** By delegating tasks to sub-skills, the system ensures that the LLM is only loaded with the context it strictly needs for the current task, reducing prompt bloat and hallucination risks.
- **Conflict Resolution:** The routing mechanism provides clear, prioritized rules for intent matching, ensuring that ambiguous user requests fallback predictably (e.g., defaulting to "create page" if no explicit update signal is found).

## 2. Review of Prompt Contracts
The `references/prompt-contracts.md` acts as a strong foundation for the system's operational stability:
- **Placeholder Management:** The distinction between System-Managed Placeholders (e.g., `__DEFAULT_CSS__`) and LLM-Rendered Content (`__CONTENT_HTML__`) is a robust constraint. By explicitly instructing the LLM to leave system placeholders untouched, the prompt minimizes the risk of breaking downstream build steps (`scripts/clawpages_publish.mjs`).
- **Data Schemas & Constraints:** Providing a rigid JSON schema for outputs and mapping specific error codes to concrete next actions prevents the LLM from getting stuck in generic error loops.
- **Pre-Publish Hard Checklist:** Implementing a self-verification gate ("Non-empty content gate") forces the LLM to verify its own work before claiming completion. This is a best-in-class prompt engineering technique to reduce empty or malformed outputs.
- **Negative Constraints:** Rules like "Do NOT show expiry time on the page" are explicitly stated, which is necessary to override common LLM tendencies to over-explain or expose internal metadata.

## 3. Review of Recent Changes
- **YAML Frontmatter Fix (Commit 8b1bba6):** Quoting descriptions in `SKILL.md` to resolve YAML parsing errors. This is a critical fix. LLM systems often consume configuration files via strict YAML/JSON parsers. Unquoted strings containing colons or special characters can crash the pipeline before the LLM even sees the prompt.
- **Template Expansion:** The addition of localized templates (e.g., `utility-workbench`, `stock-analysis-terminal`) with structured metadata (`meta.md`) ensures that the LLM has strong, declarative starting points for generating new pages.

## 4. Recommendations for Future Prompt Improvements
- **Dictionary/Glossary:** Consider establishing a unified glossary (`cspell.json` or similar) and injecting key terms directly into the prompt contracts to ensure consistent terminology (e.g., always using specific phrasing for UI elements).
- **Few-Shot Examples:** While the prompt contracts are highly descriptive, adding more concrete *Few-Shot Examples* (input prompt -> expected JSON output) in the sub-skills can further improve the deterministic nature of the routing and output generation.
- **Idempotency Reinforcement:** For `update-page`, continue emphasizing that the LLM should not hallucinate new `pageId` values. Providing an explicit negative example (e.g., "BAD: returning a random 6-digit pageId when none existed") can reduce edge-case failures.
