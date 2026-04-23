# Clawpage Project Review: Prompt Contracts & Recent Changes

As an AI prompt expert, I have reviewed the Clawpage project with a specific focus on its prompt contracts, sub-skill routing, and the recent massive PR #33 (`feat/sdk-cross-refs`).

## 1. Project Architecture & Prompting Strategy

Clawpage takes a fascinating approach: instead of a single massive monolithic prompt, it employs a routing system (`SKILL.md`) that acts as a dispatcher to specific sub-skills (e.g., `create-page`, `update-page`, `manage-data`). This is a highly robust architectural pattern for LLM applications.

**Strengths:**
*   **Separation of Concerns:** By isolating workflows (like creating a page vs. updating a template), the context window for the LLM is kept focused, significantly reducing hallucinations and instruction drift.
*   **Clear Contracts (`references/prompt-contracts.md`):** The system defines hard boundaries. I particularly like the `Placeholder Ownership & Localization Contract`. The explicit rule that the Agent MUST NOT touch `__DEFAULT_CSS__` or `__DEFAULT_JS__` but MUST replace `__CONTENT_HTML__` with rich UI components is exactly the kind of deterministic constraint an LLM needs to function reliably as a code generator.
*   **Idempotency Guards & Validation:** The inclusion of pre-publish checklists (e.g., the "Non-empty content gate") prevents the LLM from generating empty shells, a common failure mode in autonomous coding tasks.
*   **Error Handling Loop:** The `Error Code -> Action Mapping` provides the agent with a clear recovery path (e.g., how to handle `UNAUTHORIZED` or `409 USERNAME_TAKEN`).

## 2. Review of Recent Changes (Commit `9c47a13` - PR #33)

This commit is a major overhaul (+5557 insertions), fundamentally solidifying the project's structure and enforcing a critical paradigm shift in how the frontend interacts with the backend.

### Key Observations:

*   **Enforcing the Clawpage Browser SDK:** The most critical architectural change is the absolute prohibition of raw `fetch('/api/...')` calls in generated page-side HTML/JS. Instead, all pages MUST use the Clawpage Browser SDK (`https://clawpage.ai/sdk.js`).
    *   *Prompting Impact:* This drastically simplifies the instructions given to the LLM when generating page interactions. The LLM no longer needs to construct headers or handle token auth in the client; it just calls the SDK methods.
    *   *Security Impact:* Excellent. The new rule explicitly states that owner `sk_*` tokens must NEVER appear in public-page JS. This prevents the LLM from accidentally leaking API keys when generating a public page.
*   **Extensive Sub-skill Documentation:** The commit adds detailed `SKILL.md` files for every conceivable operation (`manage-data`, `manage-blobs`, `view-stats`, etc.). This means the routing agent has a much richer set of actions to delegate to.
*   **Template Ecosystem Expansion:** The introduction of specific, functional templates (`stock-analysis-terminal`, `utility-workbench`, `concept-animation-lab`) with pre-defined CSS variables (`--primary`, `--bg-0`) and structured `meta.md` gives the LLM high-quality starting points. The LLM doesn't have to invent a UI from scratch; it just populates the `__CONTENT_HTML__` slot within a robust, responsive shell.

## 3. Areas for Improvement (Prompt Expert Perspective)

While the structure is excellent, a few minor improvements could enhance LLM reliability:

1.  **JSON Schema Enforcement:** The `Output Schema` in `prompt-contracts.md` describes the expected JSON. Using strict JSON Schema (or even TypeScript interfaces) in the prompt might yield more reliable parsing than a Markdown table, especially for the `warnings` array or nested objects.
2.  **Few-Shot Examples:** While the rules are clear, the templates currently lack explicit "before and after" examples of what the LLM *should* generate for `__CONTENT_HTML__`. Providing one concrete example of a successful transformation (e.g., Raw Text -> Formatted Tailwind HTML) within the sub-skill prompts would boost zero-shot performance.
3.  **"Do Not" Constraints:** LLMs often struggle with negative constraints (e.g., "Do not show expiry time on the page"). A more effective strategy is a positive replacement constraint: "If you need to indicate expiry, do so ONLY in the post-publish chat message." (The current contract does this well, but it's worth re-emphasizing).

## Conclusion

The Clawpage skill architecture is highly sophisticated for an LLM-driven agent. The recent enforcement of the Browser SDK and the rigorous `SKILL.md` routing contracts demonstrate a deep understanding of how to constrain and guide LLMs to produce reliable, secure, and structurally sound code.
