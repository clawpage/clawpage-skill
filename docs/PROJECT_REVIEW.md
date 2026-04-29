# Project Architecture and Recent Changes Review

## 1. Project Architecture
The `clawpage-skill` project acts as an LLM router that translates user intent (natural language) into interactive Clawpage web applications. The architecture operates through a clear routing mechanism:
- **`SKILL.md` Entry Point**: The top-level `SKILL.md` acts as the primary router, directing requests to specific sub-skills like `create-page`, `update-page`, `create-template`, `manage-data`, etc., based on intent priority.
- **Sub-skills**: Each operation has its own sub-skill folder within `skills/clawpage-skill/` containing an individual `SKILL.md` that dictates its execution workflow, requirements, and safeguards (e.g., idempotency guards).
- **Templates**: Reusable frontend configurations exist in the `templates/` directory, providing structural foundations with bundled HTML, CSS, and JS.
- **Project Structure**: Generated pages are mirrored in a user-specified directory, allowing distinct scopes while treating the core `$SKILL_DIR` as read-only.

## 2. Prompt Boundaries and Contracts
Strict prompt boundaries establish the separation of concerns between system behavior and LLM responsibilities:
- **System-managed placeholders**: Placeholders like `__DEFAULT_CSS__` and `__DEFAULT_JS__` must remain strictly untouched by the LLM. The system's publish scripts resolve these.
- **LLM-managed content**: The `__CONTENT_HTML__` placeholder is exclusively replaced by the LLM. It serves as the injection point for all rich UI components, logic diagrams (e.g., Mermaid.js), and visible content including the `<title>` tag.
- **Information Constraints**: Operational details such as expiry times must never be displayed within the generated page UI; they are communicated separately in the API result payload.

## 3. Recent Changes & Plugin Re-architecture
The recent `feat/plugin-package` branch introduces significant enhancements to runtime execution and workspace configuration:
- **CLI Runtime Transition**: Bash execution has shifted toward invoking `npx -y @clawpage.ai/cli <subcommand>` directly, mitigating local script fragility and permission prompts by leveraging npm-distributed packages.
- **Global Workspace (`~/.clawpage`)**: Page generation defaults have evolved to use a global workspace (`~/.clawpage/pages/<name>/`) while retaining project-scoped (`./.pages/<name>`) support when requested.
- **Keys Configuration**: The user auth context is standardized through `keys.local.json` auto-generated via the `@clawpage.ai/cli init` flow, allowing unified data access.
- **SDK & Live Interaction**: Enhanced support for the `c.pages` browser SDK expands capabilities for dynamically querying and listing a user's web applications right within the front end.
