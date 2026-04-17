---
name: manage-data
description: Manage a Clawpage data table (KV storage with permission levels). Use when the user wants to create/update/delete a table, change its permission, or upsert/list records.
---

# manage-data

Clawpage provides a per-user KV data API under `https://<username>.clawpage.ai/api/data/<table>/<key>`. Use this skill to manage a user's tables and records.

> **CLI 会自动通过 /api/me 发现并缓存你的 username；首次使用后会写入 keys.local.json。**

## Permission levels

| Level | Read | Write |
|---|---|---|
| `private` | owner token only | owner token only |
| `read-public` | anyone | owner token only |
| `public` | anyone | anyone (IP rate-limited) |

## 🚨 Security: never put the owner sk_ token in browser HTML

The owner sk_ token controls everything in the account. If it appears in HTML/JS that end-users see, anyone can steal it.

**Correct pattern:** read/write public tables from HTML without a token. If the user needs to write to a read-public or private table, do it via this skill (CLI) or from their own backend — never inline in HTML.

## Usage

All commands below run from `clawpage-skill/` and require a valid `keys.local.json` with `clawpage.token`.

### List the user's tables
```bash
node scripts/clawpages_data.mjs --list-tables
```

### Create a table
```bash
node scripts/clawpages_data.mjs --create-table guestbook --permission public
node scripts/clawpages_data.mjs --create-table posts     --permission read-public
node scripts/clawpages_data.mjs --create-table diary     --permission private
```

### Change a table's permission
```bash
node scripts/clawpages_data.mjs --update-permission guestbook --permission read-public
```

### Delete a table (and all its records)
```bash
node scripts/clawpages_data.mjs --delete-table guestbook
```

### Read / write records
```bash
# username is auto-discovered from /api/me on first use
node scripts/clawpages_data.mjs --put posts/hello --value '{"title":"Hello","body":"..."}'
node scripts/clawpages_data.mjs --get posts/hello
node scripts/clawpages_data.mjs --list posts --limit 50
node scripts/clawpages_data.mjs --delete-record posts/hello

# Override auto-discovered username
node scripts/clawpages_data.mjs --user alice01 --list posts
```

## HTML-side examples (no token required, for public / read-public tables)

```html
<script>
  // Read all comments from a public table (user subdomain)
  const r = await fetch("https://alice01.clawpage.ai/api/data/guestbook");
  const { records } = await r.json();

  // Post a new comment (public table → no auth)
  await fetch("https://alice01.clawpage.ai/api/data/guestbook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: { text: "hi", at: Date.now() } }),
  });
</script>
```

## Quotas (per user)

- Max 50 tables
- Max 10 000 records per table
- Max 64 KB per value
- Max 50 MB total storage

Exceeding any of these returns HTTP 413.

## Rate limits (public-write tables, per IP)

- 60 writes / minute / table
- 600 writes / minute total across all public tables
- 600 reads / minute / table

Exceeding returns HTTP 429.
