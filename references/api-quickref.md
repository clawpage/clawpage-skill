# ClawPages API Quick Reference

## 1. Request prerequisites

- API host: `api.clawpage.ai`
- Preview host pattern: `u-[username].clawpage.ai`
- Auth header: `Authorization: Bearer sk_xxx`
- JSON requests need: `Content-Type: application/json`

## 2. Minimum flow

### 2.1 Register

`username` is required:
- DNS-safe lowercase
- length >= 6
- cannot start/end with `-`

```bash
curl -sS -X POST https://api.clawpage.ai/api/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"builder01"}'
```

Success (`201`):

```json
{
  "ownerId": "own_xxx",
  "username": "builder01",
  "token": "sk_xxx",
  "warning": "Store this token securely. It is only returned once."
}
```

Conflict (`409 USERNAME_TAKEN`):

```json
{
  "error": "USERNAME_TAKEN",
  "message": "Username is already taken."
}
```

### 2.2 Create page

Supported fields:
- `page_name?: string` (1-120)
- `pagecode?: string | null`
- `ttlMs?: number | null`

Default behavior (if `pagecode` and `ttlMs` omitted):
- random 6-digit `pagecode`
- TTL defaults to 6h (`21600000`)

```bash
curl -sS -X POST https://api.clawpage.ai/api/pages \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxx' \
  -d '{"html":"<!doctype html><h1>Hello</h1>","page_name":"My First Page"}'
```

Success (`201`) example:

```json
{
  "page": {
    "pageId": "claw_xxx",
    "username": "builder01",
    "pageName": "My First Page",
    "rootUrl": "https://u-builder01.clawpage.ai/pages/claw_xxx"
  },
  "pagecode": "123456",
  "accessUrl": "https://u-builder01.clawpage.ai/pages/claw_xxx?pagecode=123456"
}
```

## 3. Page management APIs

All requests target `https://api.clawpage.ai` with `Authorization: Bearer sk_xxx`.

### 3.1 List pages

```bash
curl -sS 'https://api.clawpage.ai/api/pages?page=1&limit=20' \
  -H 'Authorization: Bearer sk_xxx'
```

### 3.2 Page detail

```bash
curl -sS https://api.clawpage.ai/api/pages/<pageId> \
  -H 'Authorization: Bearer sk_xxx'
```

### 3.3 Fetch historical HTML version

```bash
curl -sS https://api.clawpage.ai/api/pages/<pageId>/versions/0 \
  -H 'Authorization: Bearer sk_xxx'
```

### 3.4 Update page

Supported update fields: `html`, `page_name`, `pagecode`, `ttlMs`

```bash
curl -sS -X PATCH https://api.clawpage.ai/api/pages/<pageId> \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxx' \
  -d '{"html":"<!doctype html><h1>Updated</h1>","page_name":"New Name","pagecode":"888888","ttlMs":86400000}'
```

Semantics:
- omit `ttlMs`: do not change TTL
- `ttlMs: null`: make permanent
- omit `pagecode`: do not change code
- `pagecode: null`: remove protection

### 3.5 Delete page

```bash
curl -sS -X DELETE https://api.clawpage.ai/api/pages/<pageId> \
  -H 'Authorization: Bearer sk_xxx' -i
```

Success returns `204 No Content`.

## 4. Preview access rules

- Latest version: `https://u-[username].clawpage.ai/pages/[pageId]`
- Historical version: `https://u-[username].clawpage.ai/pages/[pageId]/v0`

Protected pages support URL code:

- `?pagecode=123456`

You can also use the auth form endpoint:

```bash
curl -i -X POST 'https://u-builder01.clawpage.ai/__auth' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'password=123456&next=/pages/claw_xxx'
```

## 5. Health check

```bash
curl -sS https://api.clawpage.ai/healthz
```

Success (`200`):

```json
{"status":"ok"}
```

## 6. Common errors

- `400 INVALID_BODY`: invalid payload
- `401 UNAUTHORIZED`: token missing/invalid
- `404 PAGE_NOT_FOUND`: page not found or username mismatch
- `409 USERNAME_TAKEN`: username already taken
