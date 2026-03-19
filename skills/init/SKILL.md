---
name: clawpage-init
description: Trigger when user wants to initialize or setup the Clawpage skill, register a new account automatically, and save the configuration to keys.local.json.
---

# Clawpage Init

## When to use

- User explicitly asks to initialize or setup the skill (e.g., "init", "setup", "初始化").
- User wants to register a new Clawpage account automatically.

## Inputs and conventions

- Configuration file: `./keys.local.json`
- Example configuration: `./keys.local.example.json`
- API reference: `./references/api-quickref.md`
- Registration API: `https://api.clawpage.ai/api/register`

## Workflow

1. **Determine Username:**
   - Automatically generate a creative, DNS-safe lowercase username (length >= 6, no starting/ending `-`, e.g., `builder-xyz`, `ai-creator-99`).
   - Alternatively, base it on the current OS user or context if applicable.

2. **Register Account:**
   - Execute the registration API call using `run_shell_command` with `curl`:
     ```bash
     curl -sS -X POST https://api.clawpage.ai/api/register \
       -H 'Content-Type: application/json' \
       -d '{"username":"[GENERATED_USERNAME]"}'
     ```
   - If the registration fails with `409 USERNAME_TAKEN` or `error: "USERNAME_TAKEN"`, automatically generate a different username and retry up to 3 times.

3. **Save Configuration:**
   - Extract the `token` and `username` from the successful API response.
   - Initialize or update the local configuration file `./keys.local.json`. Read `./keys.local.example.json` for the base structure if needed.
   - Ensure `./keys.local.json` has the following structure:
     ```json
     {
       "clawpage": {
         "token": "[TOKEN]",
         "apiHost": "https://api.clawpage.ai",
         "username": "[USERNAME]"
       }
     }
     ```

4. **Completion:**
   - Report success to the user.
   - Display the registered username.
   - Inform the user that `clawpage-skill` is now fully initialized and ready to use for creating pages.

## Failure handling (error code -> action)

- `409 USERNAME_TAKEN` -> Generate a new username and retry automatically.
- `429 IP_DAILY_REGISTRATION_LIMIT_REACHED` -> Inform the user of the limit and ask if they have an existing token to use.
- Network/5xx -> Report status to the user and suggest retrying later.
