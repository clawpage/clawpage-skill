# Clawpage AI Prompt Review

## Overview
A comprehensive review of the `clawpage-skill` project and its recent changes, specifically the additions of `stock-analysis-terminal` and `utility-workbench` templates, as well as the prompt engineering in `skills/` and `references/`.

## 1. Project Prompt Contracts & Architecture
The system relies on solid prompt contracts, primarily defined in `references/prompt-contracts.md` and `skills/create-page/SKILL.md`.

**Strengths:**
- **Strict output schemas:** The JSON output format for successful creation/updates (`summary`, `mode`, `pageId`, `publicUrl`, etc.) is robust and strongly typed.
- **Idempotency guards:** Detailed rules around `page_id` ensure that failed network requests don't result in duplicate pages being created, effectively falling back to the `update-page` skill.
- **Quality & UI guidelines:** `references/design-guidelines.md` explicitly calls out "Anti-Generic-AI Checklist" items, providing necessary guardrails against generic tailwind outputs.

## 2. Recent Additions (`stock-analysis-terminal` & `utility-workbench`)
**Review:**
- Both templates correctly include a `meta.md` with fully localized bracketed placeholders (e.g., `[TEMPLATE_NAME_LABEL]`, `[TARGET_AUDIENCE_LABEL]`). This adheres to the standard that the LLM agent handles localization seamlessly before publish.
- The templates respect the `__CONTENT_HTML__`, `__DEFAULT_CSS__`, and `__DEFAULT_JS__` system-managed placeholders.
- The `utility-workbench` includes a working `default.js` script with lightweight operations (trim, upper, lower, count check) which is a solid base for LLM-extended utility tools.

## 3. Recommendations & Observations
- **Design Guidelines Enforcement:** Since AI models might occasionally ignore `design-guidelines.md` when rendering HTML, it's crucial that `skills/create-page/SKILL.md` directly embeds the core constraints (which it already does in the "Quality Bar & UI Expectations" section).
- **Template Scalability:** The prompt guidelines enforce a "mobile-first" and "non-empty content gate". The current placeholders ensure the agent will fully replace `__CONTENT_HTML__` with rich content.

**Conclusion:** The recent changes seamlessly integrate with the Clawpage prompt constraints. The placeholder logic remains intact, and the instructions to the LLM are unambiguous about rendering visible text directly while leaving system placeholders alone.
