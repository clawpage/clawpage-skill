---
description: Initialize the clawpage cli on this machine — register an account and save the API token.
---

Run the `init` skill to set up clawpage on this machine. The cli is idempotent — if you're already initialized, it reports your current username and exits without re-registering. To switch accounts, pass a different username plus `--force` after explicit confirmation.
