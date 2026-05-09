---
name: preview-flow
description: "Reference doc explaining the local preview UX shipped by `clawpage preview`. Linked from create-page and update-page when the user opts to preview before publishing. Not directly invoked — for documentation only."
---

# Preview Flow Reference

When `create-page` or `update-page` runs `npx -y @clawpage.ai/cli preview …` (because the user said yes to "preview before publishing?"), the user sees a localhost browser tab with the bundled page plus an injected overlay.

## What the user sees

- The page itself, exactly as it would render after publish (CSS/JS already bundled).
- **Two floating buttons** in the bottom-right corner:
  - **Chat** (chat-bubble icon) — opens a chat panel where the user can describe edits.
  - **Publish** (paper-plane icon) — directly below, the dominant action. Click triggers the actual upload.
- A small badge in the top-right: `Clawpage preview · localhost:<port>` (dismissible).

## Chat panel behavior

- Each user message spawns one local `claude -p` subprocess against the page directory. The chat session is **continued across messages** for one preview session — refinements like "actually a bit smaller" know what "the heading" referred to.
- Tool calls (Edit, Read, etc.) and assistant text stream into the transcript live as Claude works. When done, the page reloads to reflect the edits. Files in `[PAGE_DIR]` are mutated; **nothing is uploaded**.
- The chat panel header has a settings cog → **tools toggle**:
  - **Edits only** (default): file edits/reads only. Safe; a misinterpreted prompt cannot run shell commands or hit the network.
  - **Full Claude**: same as a regular Claude Code session — Bash, network, MCP enabled. One-time confirm required when switching. Resets to Edits only on next preview launch.

## Publish

- Click Publish → CLI runs the same upload as `clawpage publish` → on success, browser navigates to the live URL → CLI exits 0 with the standard success JSON.
- On API failure, the preview server stays up so the user can fix and retry from the same overlay.

## One-shot lifecycle

- One `preview` invocation = one preview session. After publish-click, the server exits; further iteration requires another `update-page` skill run with `--page-id`.
- Closing the browser tab or Ctrl-C in the CLI before publishing terminates the session and exits non-zero with `PREVIEW_ABORTED`. Local edits to `[PAGE_DIR]` are preserved.
