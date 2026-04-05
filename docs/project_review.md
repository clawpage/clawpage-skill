# Project Review: Clawpage Skill
**Date:** $(date)
**Role:** AI Prompt Expert Reviewer

## Overview & Architecture
The `clawpage-skill` project is an innovative LLM-driven router and page generation system. It leverages "prompt contracts" (defined in markdown files) to instruct an AI agent on how to translate natural language requests into fully functional, published web applications.

The architecture is cleanly separated into:
1. **Routing:** The root `SKILL.md` acts as an intention dispatcher, using priority rules and keyword hints to guide the LLM to the correct sub-skill.
2. **Sub-skills:** Located in `skills/`, these contain the actual operational logic for creating pages, updating pages, managing templates, etc. Each has its own strict prompt constraints.
3. **Contracts:** Centralized rules in `references/` (e.g., `prompt-contracts.md`, `design-guidelines.md`) enforce output schemas, placeholder management, and UI quality bars.
4. **Execution:** Node.js scripts (`scripts/clawpages_publish.mjs`) handle the deterministic bundling, API communication, and CLI interfaces.

## Review of Prompt Engineering Strategies

### 1. Strengths
* **Declarative Routing:** The root `SKILL.md` uses a highly effective "Routing Priority" ordered list. This is excellent for resolving ambiguous user intents (e.g., creating a new page vs. updating a management page).
* **Strict Placeholder Management:** The rule to "Never remove required HTML placeholders: `__CONTENT_HTML__`" is clearly stated and reinforced across multiple documents. By strictly separating system-managed tokens from LLM-rendered content zones, the system reduces generation errors.
* **Idempotency Guards:** Sub-skills like `update-page` have clear instructions on what to do if the publish script fails (e.g., checking for `metadata.page_id` to decide whether to switch to the `create-page` workflow). This makes the agent resilient.
* **Anti-Generic-AI Checklist:** This is a brilliant addition. Explicitly telling the LLM what *not* to do (e.g., "Same font on every page", "Cookie-cutter identical layout") often yields better aesthetic variety than purely positive constraints.

### 2. Areas for Improvement
* **Context Overload:** When executing a complex task like `create-page`, the LLM must synthesize rules from `skills/create-page/SKILL.md`, `references/prompt-contracts.md`, and `references/design-guidelines.md`. While comprehensive, this heavy context burden might degrade instruction following for smaller or less capable models. Consider condensing the most critical fail-path rules.
* **"Hard Checklist" Enforcement:** While the `prompt-contracts.md` dictates a "Pre-Publish Hard Checklist", LLMs sometimes hallucinate checklist completion. Forcing the LLM to output a structured JSON reasoning step *before* executing the publish script could force adherence to these checks.
* **Implicit State Management:** The prompt relies heavily on reading the local filesystem (e.g., `find ./.pages -mindepth 2...`) to determine state. Providing a dedicated tool or script for the LLM to query the local project state might be more reliable than raw bash commands.

## Review of Recent Changes

### Commit Analysis: `8aa8456 fix: typo`
**Critique:**
The recent commit `8aa8456` is highly problematic from a version control perspective.
* **Message:** `fix: typo`
* **Diff:** 44 files changed, 3813 insertions(+).
* **Impact:** This commit essentially initialized the entire repository architecture, including all templates (`general_template`, `stock-analysis-terminal`, etc.), sub-skills (`create-page`, `update-page`, etc.), core scripts (`clawpages_publish.mjs`), and comprehensive reference documents.

**Verdict:**
Labeling a 3800-line architectural foundation as a "typo" fix obscures the project's history and intent. It makes bisecting and code review exceedingly difficult.

**What actually changed in this commit:**
This commit established the *entire* prompt contract system. It laid down the critical laws that govern how the AI interacts with the filesystem, how it structures HTML within Tailwind templates, and how it handles API rate limits and token generation. It is the defining commit of the repository's current LLM-driven architecture.

## Conclusion
The `clawpage-skill` project employs advanced, highly structured prompt engineering. It treats markdown files not just as documentation, but as executable contracts for an AI agent. While the recent massive commit was severely mislabeled, the underlying prompt architecture it introduced is robust, defensive, and well-designed for autonomous code generation.