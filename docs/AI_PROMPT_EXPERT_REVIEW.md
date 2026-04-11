# Prompt Engineering Expert Review: Clawpage Skill

## 1. Architecture & Routing Strategy
The repository implements an excellent **Master/Sub-skill architecture**. The top-level `SKILL.md` acts as a clear dispatcher, which is a highly effective pattern for managing complex AI agent workflows.
- **Strengths:** The routing priority (Conflict Resolution) is well-defined, preventing the LLM from getting confused when intents overlap (e.g., deciding between updating an existing page vs. creating a new one). The "Keyword Hints" section provides explicit triggers for the LLM.
- **Observations:** This keeps the context window lean, as the LLM only loads the specific sub-skill (`create-page/SKILL.md`, etc.) once the intent is resolved.

## 2. Prompt Contracts & Constraints (`references/prompt-contracts.md`)
The system enforces strict boundaries between what the LLM generates and what the system manages.
- **Strengths:**
  - **Placeholder Ownership:** Forcing the LLM to respect `__DEFAULT_CSS__` and `__DEFAULT_JS__` while only modifying `__CONTENT_HTML__` prevents syntax errors in the final HTML structure.
  - **Deterministic JSON Output:** The exact JSON schema with `required` vs. `nullable` fields ensures the downstream `clawpages_publish.mjs` script receives predictable data.
  - **Error Code Mapping:** Giving the LLM an exact action plan for specific error codes (e.g., `LOCAL_TOKEN_MISSING`, `429 OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED`) acts as a built-in self-correction loop.

## 3. Design Guardrails (`references/design-guidelines.md`)
One of the hardest challenges with code-generation LLMs is overcoming "generic AI design" (e.g., default Tailwind cards).
- **Strengths:** The **"Anti-Generic-AI Checklist"** is a brilliant addition. By explicitly banning "same font on every page" and "plain blue-on-white cards," and enforcing a "Design Thinking (Pre-Code Phase)," the prompt forces the LLM to synthesize a creative direction before generating code.

## 4. Review of Recent Changes (Commit 8aa8456)
The recent commit establishes the core of this system.
- **Template System:** The introduction of specific templates (`stock-analysis-terminal`, `utility-workbench`, etc.) with their own `meta.md` and default assets is very strong. It grounds the LLM by providing a scaffold, drastically reducing hallucination compared to generating from an empty HTML file.
- **Publish Script:** `scripts/clawpages_publish.mjs` effectively acts as a runtime validator for the LLM's output. The dry-run capabilities and placeholder checks are great safety nets.

## 5. Recommendations for Improvement
While the prompt structure is highly advanced, here are a few recommendations to achieve even greater reliability:
1. **Few-Shot Examples:** The current prompts are heavily instruction-based (Zero-Shot). Adding 1 or 2 concrete "Few-Shot" examples of a successful interaction—especially the exact JSON output expected—can significantly improve the LLM's formatting consistency.
2. **Iterative Reflection:** In the "Failure handling" sections, explicitly instruct the LLM to briefly explain *why* the failure occurred before executing the correction. (e.g., "Think step-by-step about what went wrong before retrying"). This activates Chain-of-Thought reasoning, reducing the chance of repeated failures.
3. **Context Truncation Awareness:** As `meta.md` and `SKILL.md` files grow, ensure that the system does not exceed the LLM's optimal attention window. If the context becomes too large, the LLM might "forget" constraints at the beginning of the prompt (like the `__CONTENT_HTML__` requirement).
