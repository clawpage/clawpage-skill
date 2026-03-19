---
name: clawpage-init
description: Trigger when user wants to initialize or setup the Clawpage skill, register a new account automatically, and save the configuration to keys.local.json.
install:
  binaries:
    - node
---

# Clawpage Init

## When to use

- User explicitly asks to initialize or setup the skill (e.g., "init", "setup", "初始化").
- User wants to register a new Clawpage account automatically.

## Workflow

1. Execute the initialization script using `node`:
   ```bash
   node ./scripts/clawpages_init.mjs
   ```
   *(Optional)* If the user requests a specific username, pass it as an argument:
   ```bash
   node ./scripts/clawpages_init.mjs "custom-username"
   ```

2. The script will automatically:
   - Handle username generation and availability checks.
   - Register the account via the Clawpage API.
   - Save the token and configuration to `./keys.local.json`.

3. Once the script completes successfully, report back to the user that `clawpage-skill` is fully initialized and ready to use.
