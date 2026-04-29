# clawpage-skill

English docs. Chinese version: [docs/README.zh-CN.md](docs/README.zh-CN.md).

`clawpage-skill` turns long text into interactive Clawpage web apps.
You can ask for a page in natural language, and the skill routes to page/template create or update workflows, then publishes a URL.

Official website: `https://clawpage.ai`

## What you can do

- Convert long stock-market analysis text into a chart-driven dashboard
- Build insight hubs, utility tools, and interactive mini apps
- Update existing pages by `pageId` with new content/style/behavior
- Control TTL and access code during publish

## Install

This repo is a **Claude Code plugin**. Sub-skills shell out to [`@clawpage.ai/cli`](https://www.npmjs.com/package/@clawpage.ai/cli) (the runtime), so you only need this plugin loaded — `npx` fetches the cli on demand.

### Claude Code

```text
/plugin marketplace add https://github.com/clawpage/clawpage-marketplace
/plugin install clawpage@clawpage-marketplace
```

(Or test locally before submitting to the official marketplace: `claude --plugin-dir /path/to/clawpage-skill`.)

### Codex / Gemini CLI

These don't natively read the Claude plugin manifest. Treat the skill files as a flat clone:

```bash
# Codex
git clone https://github.com/clawpage/clawpage-skill ~/.codex/skills/clawpage

# Gemini
gemini extensions install https://github.com/clawpage/clawpage-skill
```

(Note: a unified cross-CLI manifest is on the roadmap. Until then, the plugin layout is Claude-Code-first.)

## First-time auth

Once the skill is loaded, a one-time:

```text
Use clawpage-skill to init.
```

…will run `npx -y @clawpage.ai/cli init`, register a fresh account, and write your token to `~/.clawpage/keys.local.json`. After that, every subsequent invocation of the skill (from any directory) just works.

If you prefer to set the token manually, write it yourself:

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

User prompt:

```text
Use clawpage-skill to build a stock analysis dashboard from this long market note.
Requirements:
1) extract 5 key conclusions
2) include KPI cards and 7D/30D/90D trend switching
3) mobile-first layout
4) publish and return publicUrl, rootUrl, accessUrl, pageId, expiresAt
```

Typical workflow:
- choose `stock-analysis-terminal` template
- transform raw text into structured modules (summary, risks, observations)
- scaffold via `npx -y @clawpage.ai/cli scaffold stock-analysis-terminal <page-name>` → `~/.clawpage/pages/<page-name>/`
- publish via `npx -y @clawpage.ai/cli publish --page-dir <page-name> ...`
- return `publicUrl` (if available), preview/protected URLs, page protection state, and expiry info

## Template catalog

Shipped with `@clawpage.ai/cli`. List at runtime: `npx -y @clawpage.ai/cli scaffold --list`.

- `stock-analysis-terminal`
- `insight-collection-hub`
- `utility-workbench`
- `concept-animation-lab`
- `mini-game-arcade`
- `general_template`

## Direct CLI usage

Dry-run a template bundle (no publish, no auth required):

```bash
npx -y @clawpage.ai/cli scaffold general_template /tmp/preview
npx -y @clawpage.ai/cli publish --page-dir /tmp/preview --title "Preview" --dry-run
```

Publish a page project (default: `~/.clawpage/pages/<page-name>` for bare names; pass `./...` for cwd-relative project-scoped):

```bash
npx -y @clawpage.ai/cli publish \
  --page-dir my-dashboard \
  --title "My Page" \
  --subtitle "Optional"
```

Common flags:
- `--page-id <id>` update existing page
- `--ttl-ms <number|null>` override TTL (`null` = permanent)
- `--pagecode <text|null>` set/remove access code
- `--page-name <text>` set page name (use with `--pagecode null` for stable `publicUrl`)
- `--dry-run` bundle only

Subcommand reference: see [`@clawpage.ai/cli` README](https://www.npmjs.com/package/@clawpage.ai/cli).

## Localization placeholders

Use semantic placeholders for localized text, for example `[EXPIRE_AT]`, `[GENERATED_AT]`, `[SEARCH_PLACEHOLDER]`.
Skill instructions require the LLM to fill these placeholders directly using the user's preferred language before publish.
Do not use numeric key placeholders or maintain key-mapping tables.

## Security

- `~/.clawpage/keys.local.json` holds your `sk_*` owner token. Never commit it; never paste into a public Clawpage page (it would steal the whole account).
- Project-scoped `./keys.local.json` (cwd) takes precedence over the global one — handy for per-project accounts.

## License

This project is licensed under the MIT License. See `LICENSE`.
