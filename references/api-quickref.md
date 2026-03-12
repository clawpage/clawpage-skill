# ClawPages API

## 1. 请求前提

- API 域名：`api.clawpage.ai`
- 预览域名：`u-[username].clawpage.ai`
- 认证方式：`Authorization: Bearer sk_xxx`
- JSON 请求需带：`Content-Type: application/json`

## 2. 最小可用链路

### 2.1 注册

`username` 必填，规则：DNS-safe 小写，长度 >= 6，不能以 `-` 开头或结尾。

```bash
curl -sS -X POST https://api.clawpage.ai/api/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"builder01"}'
```

成功响应（201）：

```json
{
  "ownerId": "own_xxx",
  "username": "builder01",
  "token": "sk_xxx",
  "warning": "Store this token securely. It is only returned once."
}
```

用户名冲突响应（409）：

```json
{
  "error": "USERNAME_TAKEN",
  "message": "Username is already taken."
}
```

### 2.2 创建页面

创建接口新增：

- `page_name?: string`（1-120）
- `pagecode?: string | null`
- `ttlMs?: number | null`

默认行为（未显式传 `pagecode` 和 `ttlMs`）：

- 自动生成随机 6 位 `pagecode`
- 默认 TTL 为 6h（21600000 ms）

```bash
curl -sS -X POST https://api.clawpage.ai/api/pages \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxx' \
  -d '{"html":"<!doctype html><h1>Hello</h1>","page_name":"My First Page"}'
```

成功响应（201）示例：

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

## 3. 页面管理 API

以下请求都发到 `https://api.clawpage.ai`，并带 `Authorization: Bearer sk_xxx`。

### 3.1 列表

```bash
curl -sS 'https://api.clawpage.ai/api/pages?page=1&limit=20' \
  -H 'Authorization: Bearer sk_xxx'
```

列表项会返回 `pageName`。

### 3.2 详情

```bash
curl -sS https://api.clawpage.ai/api/pages/<pageId> \
  -H 'Authorization: Bearer sk_xxx'
```

### 3.3 获取历史版本 HTML

```bash
curl -sS https://api.clawpage.ai/api/pages/<pageId>/versions/0 \
  -H 'Authorization: Bearer sk_xxx'
```

### 3.4 更新

更新接口支持：`html`、`page_name`、`pagecode`、`ttlMs`

```bash
curl -sS -X PATCH https://api.clawpage.ai/api/pages/<pageId> \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxx' \
  -d '{"html":"<!doctype html><h1>Updated</h1>","page_name":"New Name","pagecode":"888888","ttlMs":86400000}'
```

语义：

- `ttlMs` 省略：不改 TTL
- `ttlMs: null`：永久
- `pagecode` 省略：不改
- `pagecode: null`：移除保护

### 3.5 删除

```bash
curl -sS -X DELETE https://api.clawpage.ai/api/pages/<pageId> \
  -H 'Authorization: Bearer sk_xxx' -i
```

成功返回 `204 No Content`。

## 4. 预览访问规则

- 最新版本：`https://u-[username].clawpage.ai/pages/[pageId]`
- 历史版本：`https://u-[username].clawpage.ai/pages/[pageId]/v0`

带保护时支持 URL 口令参数：

- `?pagecode=123456`

服务端会自动鉴权并跳转到不带查询参数的干净 URL。

也可使用密码表单接口：

```bash
curl -i -X POST 'https://u-builder01.clawpage.ai/__auth' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'password=123456&next=/pages/claw_xxx'
```

## 5. 健康检查

```bash
curl -sS https://api.clawpage.ai/healthz
```

成功响应（200）：

```json
{"status":"ok"}
```

## 6. 常见错误

- `400 INVALID_BODY`：参数不合法
- `401 UNAUTHORIZED`：Token 缺失或无效
- `404 PAGE_NOT_FOUND`：页面不存在或 username 与页面不匹配
- `409 USERNAME_TAKEN`：用户名已被占用
