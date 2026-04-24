# Project Review: clawpage-skill

## 1. Project Architecture and Prompt Context Boundary
The `clawpage-skill` project architecture is thoughtfully designed around an LLM-first operational model. The usage of a top-level `SKILL.md` file as a primary router efficiently delegates context depending on the user's explicit intent. This keeps the LLM's working context small and specific by loading sub-skills (e.g., `create-page`, `update-page`, `create-management-page`) only when needed.

- **Strengths:**
  - **Idempotency and Modularity:** Each sub-skill outlines explicit pre-conditions and deterministic outputs, preventing the LLM from entering hallucination loops or destructive operations (e.g., the constraints against writing inside `$SKILL_DIR`).
  - **Single Source of Truth:** `references/prompt-contracts.md` acts as a strong guardrail, ensuring consistent output schemas, exact system placeholder conventions (`__CONTENT_HTML__`, `__DEFAULT_CSS__`), and uniform localization and sharing behaviors across all modules.
  - **Security by Design:** Enforcing the browser SDK (`use-sdk`) to handle all dynamic, persistent interactions on generated pages prevents users/agents from inadvertently embedding sensitive Owner API tokens (`sk_*`) within public HTML files.

## 2. Review of Recent Changes (feat/pages-live-recipe - PR #35)

The recent merge introduces a crucial functional capability: the `Live-refresh recipe` inside `skills/create-management-page/SKILL.md`.

- **Overview of Changes:**
  - Added `c.pages.listAll()` to the Clawpage SDK abstraction guidelines.
  - Provided a concrete implementation recipe in the management page skill that instructs the LLM on how to construct a live-updating dashboard for a user's page catalog.
  - Explicitly clarified the security boundary: embedding an owner token is **only** acceptable inside the management page because it is governed by a mandatory `pagecode` (password) protection policy.

- **Strengths of the Changes:**
  - **Enhanced Interactivity:** Moves the management page from a purely static, publish-time snapshot (via CLI `curl`) to a dynamic application utilizing the SDK, aligning with a more modern "dashboard" expectation.
  - **Clear Security Boundary Definition:** The documentation successfully threads the needle on token safety. It reiterates the absolute ban on placing `sk_*` tokens in public spaces but carves out a well-defined exception for pagecode-protected environments.

- **Potential Risks / Areas for Improvement:**
  - **Token Rotation/Revocation Context:** While the token is safely hidden behind a `pagecode`, if the management page is ever exposed (e.g., weak pagecode, or pagecode protection is accidentally dropped via manual publish), the `sk_*` token is compromised. Adding a prompt contract rule that automatically enforces/verifies `--pagecode` is present when the token is detected in the AST could serve as an additional safeguard.
  - **Error Handling Granularity:** The recipe in `SKILL.md` asks the agent to let `ClawpageError` bubble up to a toast. This relies on the LLM generating a robust error-handling UI. Providing a slightly more explicit fallback or default UI block for the toast within the recipe could improve consistency.

## 3. General Feedback and Conclusion
The prompt engineering and skill structure in `clawpage-skill` are robust. The use of strict variable resolution boundaries (`$SKILL_DIR` vs `$PAGES_DIR`) combined with clear mapping of Error Codes to Actions ensures the LLM is guided towards successful recovery states. The recent addition of live-data fetching for the management page significantly upgrades its utility while maintaining strict, well-documented security postures.
