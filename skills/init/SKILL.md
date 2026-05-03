---
name: init
description: Initialize the clawpage cli on this machine — register a clawpage.ai account and save the API token to ~/.clawpage/keys.local.json. Trigger when the user says "init clawpage", "setup clawpage", "初始化", or starts a clawpage workflow without an existing token. Idempotent — safe to call when already initialized; exit code 2 means the user explicitly opted into --force to switch accounts.
---

# Init

## When to use

- User explicitly asks to initialize or setup the skill (e.g., "init", "setup", "初始化").
- User wants to register a new Clawpage account automatically.

## Workflow

1. Run init (idempotent — safe to call even if the user is already initialized):
   ```bash
   npx -y @clawpage.ai/cli init
   ```
   *(Optional)* If the user requests a specific username:
   ```bash
   npx -y @clawpage.ai/cli init "preferred-username"
   ```

2. Read the exit code and branch:

   - **Exit 0** — initialized OR already in target state. Report the username back to the user (the cli prints it on stdout). Done.

   - **Exit 2** — already initialized as a *different* account than what the user asked for. **STOP. Do not retry with `--force` automatically.** Tell the user:

     > "This machine is already initialized as `<currentUser>` (per `~/.clawpage/keys.local.json`). You asked to register as `<requestedUser>`. Re-running with `--force` will replace `<currentUser>`'s token on this machine. Pages owned by `<currentUser>` remain on the server but become unreachable from here. Do you want to proceed?"

     Only run `npx -y @clawpage.ai/cli init <requestedUser> --force` after the user explicitly confirms.

   - **Exit 1** — generic failure. Surface the cli's stderr to the user and stop. Common cases:
     - Network / DNS failure → ask user to check connectivity, retry.
     - `IP_DAILY_REGISTRATION_LIMIT_REACHED` → suggest waiting or using an existing account.
     - Exact-username taken when user asked for one specifically → propose alternatives, ask user to pick one.

3. Once the cli reports success, report back: `Clawpage is initialized as <username>`.

## Idempotency contract

The cli verifies the existing token via `/api/me` before deciding whether to register. So:

- Calling `init` twice in a row when already logged in is **safe** — the second call is a no-op (exit 0, no server-side change).
- Calling `init alice` while already logged in as alice is **safe** — no-op.
- Calling `init bob` while logged in as alice **does not silently swap accounts** — it exits 2 and requires `--force`.

This means you can call `init` proactively at the start of a session to confirm initialization without worrying about side effects.

## What `--force` does

`--force` discards the existing token from `~/.clawpage/keys.local.json` and registers a brand-new account. The previous account's data is **not deleted server-side** — it just becomes inaccessible from this machine because the API token is gone. Only suggest `--force` after the user has been made aware of this and has explicitly opted in.

## Failure handling (exit code → action)

- `0` → report success/no-op to user.
- `1` → surface stderr, do not auto-retry.
- `2` → ask user before re-running with `--force`.
