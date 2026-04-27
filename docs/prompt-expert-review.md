# Clawpage Project Prompt Architecture Review

## Overview

The `clawpage-skill` project has evolved significantly, turning long text inputs into interactive Clawpage web apps. The architecture cleverly uses a Router-Delegator pattern to manage the complexity of generating, updating, and publishing web pages via AI.

This document serves as an expert review of the project's prompt architecture, focusing on the routing logic, prompt contracts, and the recent introduction of the Clawpage Browser SDK.

## Architecture Analysis

### Router-Delegator Pattern (`SKILL.md`)

The top-level `SKILL.md` acts as an excellent router. By defining explicit sub-skills (`create-page`, `update-page`, `create-template`, `manage-data`, etc.) and establishing a clear "Routing Priority," it prevents intent confusion.

**Strengths:**
- **Explicit Keyword Hints:** Mapping keywords like "自动注册" to `init` or "page-id" to `update-page` helps LLMs confidently select the right sub-skill.
- **Global Constraints:** The inclusion of non-negotiable rules directly in the router (e.g., "Never remove required HTML placeholders", "Management page must be read-only") sets a strong baseline behavior before delegation even occurs.
- **Path Isolation:** Explicitly defining `$SKILL_DIR` (read-only) vs `$PAGES_DIR` ensures the agent doesn't pollute the installation directory.

### Prompt Contracts (`references/prompt-contracts.md`)

The `prompt-contracts.md` file is a standout feature of this repository. It establishes firm rules that all sub-skills must follow.

**Strengths:**
- **System vs. LLM Placeholders:** Clearly delineating `__DEFAULT_CSS__` (system-managed, do not touch) from `__CONTENT_HTML__` (LLM-managed) is crucial for preventing broken builds.
- **Strict Output Schema:** Mandating a stable JSON output schema (`summary`, `pageId`, `publicUrl`, etc.) ensures the CLI and subsequent workflows can rely on the AI's output.
- **Pre-Publish Checklist:** The inclusion of a mandatory non-empty content gate (checking that `__CONTENT_HTML__` is actually resolved) prevents the publication of empty shells.
- **Actionable Error Handling:** Mapping specific error codes (e.g., `LOCAL_TOKEN_MISSING`) to concrete actions (auto-register a new account, do not create an intro page) prevents the agent from getting stuck or hallucinating recovery steps.

### Design Guidelines (`references/design-guidelines.md`)

The design guidelines push the AI beyond generic outputs.

**Strengths:**
- **Anti-Pattern Checklist:** Explicitly forbidding generic purple/blue palettes, cookie-cutter layouts, and the reuse of the same font (e.g., Space Grotesk everywhere) forces the AI to be creative.
- **Pre-Code Phase:** Encouraging "Design Thinking" (Purpose, Tone, Constraints, Differentiation) before generating HTML ensures intentionality.

## Review of Recent Changes

### Introduction of the Clawpage Browser SDK

The recent push to enforce the Clawpage Browser SDK (`c.pages`, `https://clawpage.ai/sdk.js`) for all page-side JavaScript is a major architectural improvement.

**Analysis:**
- **Security:** Moving away from raw `fetch('/api/...')` and forbidding owner `sk_*` tokens in public-page JS drastically improves the security posture of the generated pages.
- **Developer Experience:** Utilizing `c.pages` for live page listing and live-refresh capabilities simplifies the generated code and provides a more robust user experience.
- **Sub-skill Integration:** The creation of the `use-sdk` sub-skill (`skills/use-sdk/SKILL.md`) appropriately encapsulates the SDK rules, though the router must ensure it is correctly cross-referenced when generating interactive pages.

### Data Management Enhancements

The recent `manage-data` CLI additions and the corresponding AI-optimized `SKILL.md` update demonstrate a mature approach to expanding functionality.

**Analysis:**
- **Idempotency and Safety:** Features like `--patch` for deep-merge updates and explicit permission decision trees in the prompt contract protect user data from accidental overwrites.
- **Recipes:** Providing canonical scenarios (comments board, read-public CMS) directly in the prompt contract gives the LLM clear, proven patterns to follow.

## Recommendations for Improvement

1. **Test Coverage for SDK Integration:** While the prompt contracts are strong, relying solely on a "publish-script validation" test gate might miss runtime JS errors if the SDK is used incorrectly. Adding a basic headless browser check (e.g., via Playwright) to verify the page loads without console errors would be beneficial.
2. **Template Validation:** Ensure that new templates adhere strictly to the `__CONTENT_HTML__` placeholder rule automatically, perhaps via a pre-commit hook, rather than relying only on the AI's adherence to the prompt contract.
3. **Localization Enforcement:** The prompt contract mentions inferring language, but explicit instructions on how to handle multi-lingual layouts (e.g., setting the correct `<html lang="...">`) could be strengthened.

## Conclusion

The `clawpage-skill` project exhibits a highly sophisticated and effective prompt engineering architecture. The clear separation of concerns (Router vs. Sub-skills) and the rigorous prompt contracts ensure reliable and high-quality outputs from the LLM. The recent shift towards a standardized Browser SDK further solidifies the project's technical foundation.
