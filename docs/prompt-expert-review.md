# AI Prompt Expert Review: Project Architecture & Recent Changes

This document provides a comprehensive review of the `clawpage-skill` project's prompt architecture, routing logic, prompt contracts, and an analysis of the recent commit (82c9ea9) from a prompt engineering and system design perspective.

## 1. Project Prompt Architecture Review

The project relies on a highly structured, LLM-based system that treats natural language requests as inputs to generate or update entire WebApps. The architecture separates routing logic (`SKILL.md`) from operational details (`skills/*/SKILL.md`).

### Strengths

*   **Explicit Routing via `SKILL.md`**: The top-level `SKILL.md` provides clear "Routing Priority (Conflict Resolution)" and "Keyword Hints". This deterministic fallback (e.g., checking for `pageId` first before defaulting to `create page`) minimizes ambiguity for the routing model.
*   **Centralized Prompt Contracts (`references/prompt-contracts.md`)**: Moving shared constraints (like placeholder handling `__CONTENT_HTML__`, output schema, and the "Pre-Publish Hard Checklist") into a central contract is an excellent architectural choice. It prevents drift across the various sub-skills.
*   **Idempotency Guards**: In both `create-page` and `update-page`, the instructions include clear idempotency steps. If a network request fails, the model is instructed to check `meta.md` to see if `page_id` exists before deciding whether to retry as a `create` or fall back to an `update`. This makes the LLM interaction stateful and robust.
*   **Anti-Generic-AI Checklist**: The explicit checklist (e.g., forbidding dark background classes like `bg-gray-800` on a light template) directly targets common LLM "hallucination" or default-behavior patterns, significantly raising the baseline quality.
*   **Firm Content Gate**: Requiring the Agent to verify that `__CONTENT_HTML__` has been correctly replaced before publishing acts as a final fail-safe to prevent blank page generation.

### Areas for Improvement

*   **Handling `pagecode` Generation**: The instruction says: "generate a random 6-digit number (e.g., '123456'). Do not use fragile shell scripts for generation". While LLMs can output arbitrary strings, they are technically pseudo-random and may suffer from low entropy depending on the model's temperature. It might be safer long-term to have the system auto-generate this on the backend if not provided.
*   **JSON Schema Enforcement**: `prompt-contracts.md` specifies a table for JSON output. To guarantee the LLM perfectly follows the schema, adopting JSON Schema format or TypeScript interface definitions within the prompt contract might yield stronger adherence than a markdown table.
*   **Token Management Auto-Registration**: The prompt instructs the LLM to automatically register a user if a token is missing. This requires the LLM to generate a username. While creative, this could lead to loop-retries if the LLM keeps picking common names and hitting `409 USERNAME_TAKEN`. The prompt could provide a more rigid format for the AI-generated name to guarantee uniqueness on the first try (e.g., appending a timestamp or UUID snippet).

## 2. Review of Recent Changes (Commit 82c9ea9)

The recent commit (`feat: chart theme matching + click-to-zoom for mobile`) introduces significant UI improvements across multiple template files.

### Analysis of Changes

*   **Chart Click-to-Zoom (`initChartZoom` in `default.js` & `.claw-zoom-overlay` in `default.css`)**:
    *   **Impact**: Excellent for mobile responsiveness. Complex Mermaid.js charts are often unreadable on small screens. Adding a click listener that clones the SVG into an overlay (`max-width: 95vw`) solves this elegantly.
    *   **Prompt Impact**: The prompt templates (`SKILL.md` files) were updated to document this new capability: "Zoom: Chart containers... have built-in click-to-zoom — users can tap any chart on mobile to see it fullscreen. No extra markup needed; the template JS handles it automatically." This is a crucial update because it tells the LLM *not* to try and invent its own zooming logic or complex modal HTML, saving token output and preventing conflicting scripts.
*   **Theme Matching (`isDarkTheme` function)**:
    *   **Impact**: Dynamically determining the background luminance to initialize Mermaid.js with the correct theme (`default` or `dark`) prevents illegible diagrams.
    *   **Prompt Impact**: This reinforces the "Anti-Generic-AI Checklist" rule against mismatched colors. The LLM can now confidently generate diagrams knowing the template will handle the contrast automatically based on the CSS variables the LLM chooses.

### Conclusion

The project demonstrates a very mature approach to prompt engineering by treating prompts as code (routing, shared libraries, explicit error handling boundaries). The recent UI enhancements are correctly accompanied by prompt updates to ensure the LLM understands and leverages the new capabilities without hallucinating redundant logic.