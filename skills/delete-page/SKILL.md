---
name: delete-page
description: Permanently delete a clawpage page by its `pageId` via DELETE /api/pages/<pageId>. Trigger when the user explicitly asks to delete / remove / take down / destroy / 删除 / 下线 a specific page they own and a `pageId` (or a clearly identifiable single page) is in scope. Deletion is irreversible — there is no soft-delete or trash. NEVER fabricate a `pageId`. Do NOT use for removing a local page project only (just `rm -rf` the directory), do NOT use for unpublishing temporarily (use `update-page` to set a short TTL or `pagecode` instead), do NOT use for sub-resources like short links / KV records / blobs (use `manage-links` / `manage-data` / `manage-blobs` respectively).
---

# Clawpage Delete Page

## When to use

- User wants to permanently take down a published page
- A specific `pageId` is identified — either provided by the user, found in `[PAGE_DIR]/meta.md` `metadata.page_id`, or unambiguously matched from `pages --list`

**Do not use** when:

- The user wants to update / rework / republish — that's `update-page`
- The user wants to hide the page temporarily — propose `update-page` with `--pagecode` set or a short `--ttl-ms` instead
- The user wants to remove a local project directory only — that's a plain `rm -rf [PAGE_DIR]`, no API call needed
- The user wants to delete sub-resources — use `manage-links` (short links), `manage-data` (KV tables/records), `manage-blobs` (R2 objects)
- The intent is ambiguous or only a page *name* (not `pageId`) is in scope — list first, confirm the match, then proceed

## Irreversibility

The backend has no trash / restore. Once `DELETE /api/pages/<pageId>` returns `204`, the page record, all versions, the public URL, and the access URL are gone. The CLI requires an explicit `--yes` flag for this reason — do not auto-add it without user confirmation.

## Workflow

1. **Identify the `pageId`.** In order of preference:
   - User provided it directly.
   - Read `[PAGE_DIR]/meta.md` and extract `metadata.page_id` from the YAML frontmatter (use `read_file`, not fragile shell).
   - Run `npx -y @clawpage.ai/cli pages --list` and shortlist by page name / URL. If more than one candidate, ask the user which.

2. **Show what's about to be deleted.** Always run `--get` first so the user (and you) can confirm it's the right page:

   ```bash
   npx -y @clawpage.ai/cli pages --get [PAGE_ID]
   ```

   Surface to the user: `pageId`, `pageName`, `rootUrl` / `publicUrl`, `createdAt`, and (if present) `versionCount`.

3. **Get explicit user confirmation.** Even if the user already said "delete X", restate what you're about to do and ask. Sample:

   > About to permanently delete `claw-xxxxxxxxxx` ("My Dashboard", created 2026-04-12, 3 versions). This cannot be undone. Confirm?

   Wait for an affirmative reply before proceeding. If the user previously gave an explicit batch authorization in the same turn (e.g. "delete all 5 of these, I'm sure"), you may skip per-page reconfirmation but still display each `--get` result.

4. **Delete:**

   ```bash
   npx -y @clawpage.ai/cli pages --delete [PAGE_ID] --yes
   ```

   On success the CLI prints:

   ```json
   { "deleted": "claw-xxxxxxxxxx", "dataFetchedAt": "2026-..." }
   ```

5. **Local cleanup (optional, ask first).** If a local `[PAGE_DIR]` exists (`~/.clawpage/pages/<name>` or `./.pages/<name>`), ask the user whether to also remove it. Default to **keeping** it — the user may want to republish later as a new page.

## Output

Return to the user (Chinese-first if `prompt-contracts.md` localization rule applies, otherwise match the user's language):

- `deleted`: the deleted `pageId`
- `wasNamed`: `pageName` from the pre-delete `--get` response
- `wasAccessibleAt`: `rootUrl` (and `publicUrl` if present) — now broken
- `localProjectPath`: present iff a local `[PAGE_DIR]` was found (note: **not** auto-deleted)
- `note`: one short line reminding deletion is irreversible

## Failure handling (error code → action)

- `404 PAGE_NOT_FOUND` → already deleted, or `pageId` belongs to another account, or typo. Run `pages --list` to verify; do not retry blindly.
- `401 UNAUTHORIZED` / `LOCAL_KEYS_FILE_MISSING` → the user has no token on this machine. Stop and ask: register (`init`), point at a different keys file (`--keys-file`), or cancel. **Never** auto-register here — delete is destructive and the wrong account would silently target nothing.
- `403 PERMISSION_DENIED` → token doesn't own this page. Stop, surface the username from `keys.local.json`, ask the user whether they meant a different account.
- network / 5xx → report status + body verbatim, retry at most once. Do not retry on 2xx-after-DELETE-then-disconnect cases — the server may have already deleted.

## API reference

`DELETE /api/pages/<pageId>` — see `references/api-quickref.md §3.5`. Successful response is `204 No Content` (the CLI surfaces it as a `{ deleted, dataFetchedAt }` JSON line).

## Token cascade

The CLI resolves the token via `--keys-file` → `./keys.local.json` → `~/.clawpage/keys.local.json` (default). Pick the matching account before deleting; a delete against the wrong account just returns `404`, but it's still wasted user time.
