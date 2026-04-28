# Project Architecture and Recent Changes Review

## 1. Project Architecture
The `clawpage-skill` project acts as an LLM router that translates user intent (natural language) into interactive Clawpage web applications. The top-level `SKILL.md` operates as the primary entry point, categorizing requests into sub-skills (e.g., `create-page`, `update-page`, `manage-data`).
Each sub-skill has its own `SKILL.md` defining its execution workflow. Reusable frontend configurations are stored in the `templates/` directory, while generated pages are emitted into a separate, user-specified `$PAGES_DIR`. Finally, scripts (like `clawpages_publish.mjs`) bundle the templates and injected HTML into a deployable artifact via the Clawpage API.

## 2. Prompt Boundaries and Contracts
Prompt contracts strictly define the separation of concerns between the LLM and the system:
- **System-managed placeholders** (e.g., `__DEFAULT_CSS__`, `__DEFAULT_JS__`) must remain untouched by the LLM.
- **LLM-managed content** is injected solely through the `__CONTENT_HTML__` placeholder, allowing the Agent to generate rich UI components, titles, and structural elements.
- This boundary ensures that core styling and backend integration logic provided by templates remain intact, while empowering the LLM to creatively handle the page's visible and interactive content.

## 3. Recent Changes & SDK Updates
Recent commits, culminating in PR #35 (`feat/pages-live-recipe`), have significantly enhanced the Clawpage Browser SDK:
- **`c.pages` Integration:** The SDK now includes `c.pages`, allowing for robust client-side page management (listing, live refreshing) without raw fetch logic.
- **Live-Refresh Recipe:** A new optional recipe in `create-management-page/SKILL.md` demonstrates how to use `c.pages.listAll()` to fetch and re-render a user's page list dynamically within the browser.
- **Sub-skill additions:** Introduction of skills like `manage-data`, `manage-links`, and `view-stats` broaden the dynamic capabilities available to generated applications via the CLI and SDK.
