# AI Prompt Expert Review: Clawpage-Skill

## 1. Project Architecture & Prompting Model Overview

**Clawpage-Skill** is a tool that transforms text instructions into fully functional, interactive web applications (Clawpages) by routing user requests to specialized prompt contracts (Sub-skills) and compiling them using a Node.js build script.

The prompting architecture follows a **Router-Delegator Pattern**:
- **Router (`SKILL.md`)**: Analyzes the user's initial intent and routes it to one of the specialized sub-skills (`create-page`, `update-page`, `create-template`, etc.).
- **Sub-skills (`skills/*/SKILL.md`)**: Act as localized system prompts containing specific constraints, workflows, and "Anti-Generic-AI" checklists for the LLM to follow.
- **Shared Contracts (`references/`)**: `prompt-contracts.md` and `design-guidelines.md` serve as global laws for the LLM to govern the output schema, placeholder handling, and visual quality.

### Strengths of the Current Architecture
1. **Idempotency & Failure Recovery**: The inclusion of "Idempotency Guards" in `create-page` and `update-page` is excellent. Telling the AI exactly how to recover (e.g., "switch to update-page if metadata.page_id exists but publish failed") prevents duplicate resource creation.
2. **Strict Output Schema Enforcement**: Explicitly mapping out the required JSON fields (`summary`, `mode`, `pageId`, etc.) and failure formats in `prompt-contracts.md` ensures predictable downstream parsing by the host application.
3. **Anti-Generic-AI Constraints**: The design guidelines explicitly tell the AI what *not* to do (e.g., "no generic purple-on-white cards", "no basic Inter/Roboto fonts"). This is a highly advanced technique to elevate generative UI quality.
4. **Placeholder Isolation**: The strict separation of `__CONTENT_HTML__` (which the LLM handles) from `__DEFAULT_CSS__`/`__DEFAULT_JS__` (which the script handles) creates a clean contract boundaries.

### Areas for Improvement in the Prompting Framework
1. **Context Window Optimization**: The sub-skills reference the shared guidelines (`design-guidelines.md` and `prompt-contracts.md`) by file path. If the executing AI environment doesn't automatically inject these referenced files into context, the AI might hallucinate or ignore the global constraints.
2. **Conflict Resolution Overload**: The top-level `SKILL.md` router has many constraints (e.g., "Global Non-Negotiable Constraints") that are *also* duplicated in the sub-skills or shared references. This redundancy can dilute the AI's attention.
3. **Handling Empty `__CONTENT_HTML__`**: While the prompt warns the LLM to replace `__CONTENT_HTML__`, LLMs sometimes just output the `<main>__CONTENT_HTML__</main>` tag in their response if they are feeling lazy. The "Non-empty content gate" check is manual right now; it should ideally be enforced by an automated script step.

---

## 2. Review of Recent Changes

### Initial Setup & "fix: typo" commit (8aa8456)
Looking closely at the recent major foundational commit (which was committed with the message "fix: typo" but actually contained the entire initial project scaffold):

- **The addition of Templates (`stock-analysis-terminal`, `utility-workbench`, etc.)**:
  - The templates are well-structured. Each contains its own scoped CSS with CSS variables (`--primary`, `--accent`) which nicely aligns with the `design-guidelines.md`.
  - The `utility-workbench` introduces JS-based interactivity (e.g., `trim`, `upper`, `lower` text transforms) right out of the box, giving the LLM a great foundation to build tools upon rather than static pages.
- **The Publish Script (`clawpages_publish.mjs`)**:
  - The script does robust error parsing (translating HTTP codes to standard errors like `OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED`).
  - It handles the template interpolation `html.replaceAll("__DEFAULT_CSS__", css)` correctly.
- **The "Hosted by" Footer Addition**:
  - The recent changes added an injected `<script>` in the templates to render a "Hosted by Clawpage.ai" footer. It uses native JS and dynamically adapts to the user's language (`isChinese`). This is a smart way to ensure attribution without relying on the LLM to remember to generate it.

---

## 3. Actionable Recommendations for Prompt Optimization

1. **Unify the Persona Definition**:
   - Start the top-level `SKILL.md` with a strong Persona definition: "You are an elite frontend engineering and product design AI." Setting a high-agency persona improves the qualitative output of LLMs when generating UI.

2. **Harden the "Zero-Code" Hallucination Guards**:
   - In `create-page/SKILL.md`, add a rule: "DO NOT output raw HTML in code blocks in the chat response unless asked. Write directly to the file system using the provided file writing tools."

3. **Improve Template Routing Context**:
   - The LLM is told to "Choose template (default general_template)". It would be beneficial to add a small manifest mapping in `SKILL.md` describing *when* to use which template (e.g., `Use stock-analysis-terminal for data-heavy requests, use utility-workbench for text/data transformation tools`). Currently, the LLM has to guess based on folder names.

4. **Address the "Fix: Typo" Commit Strategy**:
   - The commit `8aa8456 fix: typo` contained massive structural additions (entire directories and core scripts). As an engineering best practice, ensure future commits follow the Conventional Commits format more strictly (`feat: add template engine`, `refactor: extract publish script`) to maintain a readable git history.