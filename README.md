# clawpage

A coding-agent plugin for [Clawpage](https://clawpage.ai) — generative UI hosting that turns single-file HTML pages into public URLs. Use it from Claude Code, Codex, or Gemini CLI.

> **v1.0.0**: skills are now flat and independently invocable (one router was previously the entry point; that pattern has been replaced). Each skill self-describes when to trigger.

## What you can do

- Convert long stock-market analysis text into a chart-driven dashboard
- Build insight hubs, utility tools, and interactive mini apps
- Update existing pages by `pageId` with new content / style / behavior
- Add server-side state to a page: comments, counters, KV data, short links, blob storage
- Track view counts per page / homepage / short link
- Author and update reusable templates

## Skills

Each skill is independently invocable by name. Coding agents auto-pick the right one based on user intent; you can also reference them directly (e.g. `clawpage:create-page`).

| Skill | Use when |
|---|---|
| `clawpage:init` | First-time setup on a machine — register an account + save token. Idempotent. |
| `clawpage:create-page` | Brand-new page. Default: private + 3h TTL. |
| `clawpage:update-page` | Republish an existing page (you have its `pageId` or local project). |
| `clawpage:create-management-page` | Read-only dashboard listing all your pages. |
| `clawpage:create-template` / `clawpage:update-template` | Author or evolve a reusable template. |
| `clawpage:manage-data` | Per-user KV data tables (comments, counters, configs, lightweight CMS). |
| `clawpage:manage-links` | Short links `clawpage.ai/s/<slug>` → `*.clawpage.ai`. |
| `clawpage:manage-blobs` | Upload images / files to R2, get public `blob.clawpage.ai/<id>` URLs. |
| `clawpage:view-stats` | Page-view counts and per-day series. |
| `clawpage:use-sdk` | Embed the Browser SDK so a page can call clawpage APIs without exposing tokens. |

## Slash commands

- `/clawpage-init` — initialize on this machine
- `/clawpage-publish` — convert current response into a hosted clawpage page
- `/clawpage-stats` — show traffic for your pages

## Install

The plugin shells out to [`@clawpage.ai/cli`](https://www.npmjs.com/package/@clawpage.ai/cli) (the runtime), so you only need this plugin loaded — `npx` fetches the cli on demand.

### Claude Code

```text
/plugin marketplace add https://github.com/clawpage/clawpage-skill
/plugin install clawpage
```

Updates: `/plugin update clawpage`.

### Codex

```text
codex plugins add https://github.com/clawpage/clawpage-skill
```

The plugin manifest lives at `.codex-plugin/plugin.json`.

### Gemini CLI

```bash
gemini extensions install https://github.com/clawpage/clawpage-skill
```

The repo ships `gemini-extension.json` at the root.

## Supply-chain note

The plugin invokes `npx -y @clawpage.ai/cli@<latest>` by default. **npm package code from `@clawpage.ai/cli` will execute on your machine** the first time you trigger any skill. Three layers of trust:

1. **Source**: cli source at [github.com/clawpage/clawpage-cli](https://github.com/clawpage/clawpage-cli), MIT licensed. Audit before first run if you want.
2. **Provenance**: every npm release ≥ `0.3.0` ships [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestations linking the tarball to the GitHub commit it was built from. `npm view @clawpage.ai/cli@<version>` shows the link.
3. **Pin a version**: in your local copy of any SKILL.md, replace `npx -y @clawpage.ai/cli` with `npx -y @clawpage.ai/cli@0.5.0` (or whichever you've audited). Updates become opt-in.

If you'd rather avoid `npx` entirely: `npm install -g @clawpage.ai/cli@0.5.0` once, then change SKILL.md commands from `npx -y @clawpage.ai/cli ...` to `clawpage ...`.

## First-time auth

Trigger the `init` skill once:

```text
Init clawpage.
```

This runs `npx -y @clawpage.ai/cli init`, registers a fresh account, and writes your API token to `~/.clawpage/keys.local.json`. After that, every subsequent skill invocation works from any directory.

To set the token manually instead:

```bash
mkdir -p ~/.clawpage
cat > ~/.clawpage/keys.local.json <<'EOF'
{
  "clawpage": {
    "token": "sk_xxx",
    "apiHost": "https://api.clawpage.ai"
  }
}
EOF
```

## Example: long stock analysis → visual page

```text
Build a clawpage dashboard from this market note. Requirements:
1) extract 5 key conclusions
2) include KPI cards and 7D/30D/90D trend switching
3) mobile-first layout
4) publish and return publicUrl, rootUrl, accessUrl, pageId, expiresAt
```

Workflow:
- skill picks `stock-analysis-terminal` template
- transforms raw text into structured modules (summary, risks, observations)
- `npx -y @clawpage.ai/cli scaffold stock-analysis-terminal <page-name>` → `~/.clawpage/pages/<page-name>/`
- `npx -y @clawpage.ai/cli publish --page-dir <page-name> ...`
- returns the URL set + expiry info

## Template catalog

Shipped with `@clawpage.ai/cli`. List at runtime: `npx -y @clawpage.ai/cli scaffold --list`.

- `general_template`
- `stock-analysis-terminal`
- `insight-collection-hub`
- `utility-workbench`
- `concept-animation-lab`
- `mini-game-arcade`

## Direct CLI usage

Dry-run a template bundle (no publish, no auth required):

```bash
npx -y @clawpage.ai/cli scaffold general_template /tmp/preview
npx -y @clawpage.ai/cli publish --page-dir /tmp/preview --title "Preview" --dry-run
```

Publish a page project:

```bash
npx -y @clawpage.ai/cli publish \
  --page-dir my-dashboard \
  --title "My Page" \
  --subtitle "Optional"
```

Common flags: `--page-id <id>`, `--ttl-ms <n|null>`, `--pagecode <text|null>`, `--page-name <text>`, `--dry-run`.

## Security

- `~/.clawpage/keys.local.json` holds your `sk_*` owner token. Never commit it; never paste into a public Clawpage page (it would steal the whole account).
- Project-scoped `./keys.local.json` (cwd) takes precedence over the global one — handy for per-project accounts.
- The `init` skill is **idempotent**: calling it when already initialized is a no-op. Switching accounts requires `--force` and explicit user confirmation; pages owned by the previous account are not deleted but become unreachable from this machine.

## License

MIT-0 (MIT No Attribution). See `LICENSE`.
