# clawpage-skill

`clawpage-skill` 是一个 ClawPages 路由技能，用于把用户请求分发到页面/模板的创建与更新流程，并通过发布脚本产出可访问 URL。

## What this skill does

- 创建页面工程并发布（create page）
- 更新已有页面并发布（update page）
- 创建模板（create template）
- 更新模板（update template）

## Repository layout

- `SKILL.md`: 顶层路由 skill 定义
- `skills/create-page/SKILL.md`: 新建页面流程
- `skills/update-page/SKILL.md`: 更新页面流程
- `skills/create-template/SKILL.md`: 新建模板流程
- `skills/update-template/SKILL.md`: 更新模板流程
- `scripts/clawpages_publish.mjs`: 页面打包与发布入口
- `templates/<template-name>/`: 模板目录（`index.html`, `default.css`, `default.js`, `index.md`）
- `.pages/<page-name>/`: 页面工程目录（结构与模板一致）
- `references/api-quickref.md`: API 快速参考
- `keys.local.example.json`: 本地 key 文件模板

## Prerequisites

- Node.js 18+（需支持 `fetch`）
- 可访问 `https://api.clawpage.ai`

## Setup

1. 准备 key 文件

```bash
cp keys.local.example.json keys.local.json
```

2. 若无 token，先注册

`username` 规则：
- 仅使用小写字母、数字、连字符（`a-z` / `0-9` / `-`）
- 长度至少 6 位
- 不能以 `-` 开头或结尾

注册命令：

```bash
curl -sS -X POST https://api.clawpage.ai/api/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"<username>"}'
```

如果返回 `409 USERNAME_TAKEN`：
- 提示用户名已占用
- 基于原名生成新候选（如追加 2-4 位数字，或追加 `-lab` / `-app`）
- 让用户选一个后重试注册

3. 将返回 token 写入 `keys.local.json`

```json
{
  "clawpages": {
    "token": "sk_replace_me",
    "apiHost": "https://api.clawpage.ai"
  }
}
```

## Publish commands

模板 dry-run：

```bash
node scripts/clawpages_publish.mjs \
  --page-dir templates/genernal_template \
  --title "Template Preview" \
  --dry-run
```

发布页面：

```bash
node scripts/clawpages_publish.mjs \
  --page-dir .pages/<page-name> \
  --title "My Page" \
  --subtitle "Optional"
```

常用参数：
- `--page-id <id>`: 更新已有页面（PATCH）
- `--ttl-ms <number|null>`: 覆盖默认有效期，`null` 表示永久
- `--pagecode <text|null>`: 设置/移除访问口令
- `--keys-file <path>`: 指定 key 文件
- `--dry-run`: 仅打包 HTML，不调用发布 API

## Template requirements

每个模板目录必须包含：
- `index.html`
- `default.css`
- `default.js`
- `index.md`

`index.html` 必须保留占位符：
- `__CONTENT_HTML__`
- `__DEFAULT_CSS__`
- `__DEFAULT_JS__`
- `__PAGE_TITLE__`
- `__PAGE_SUBTITLE__`
- `__GENERATED_AT__`
- `__EXPIRES_AT__`

## Expiry time behavior

页面默认会展示过期时间（`__EXPIRES_AT__`）：
- 创建页面：显示具体过期时间（默认 TTL 6h，或使用 `--ttl-ms`）
- 更新页面且未提供 `--ttl-ms`：显示“沿用当前页面设置（本次未修改）”
- `--ttl-ms null`：显示“永久有效”

## Verification checklist

- 模板改动后执行 `--dry-run`
- 生成 HTML 中不应残留占位符（如 `__EXPIRES_AT__`）
- 发布响应需包含：`url/rootUrl`、`pageId`、TTL/过期信息、受保护状态

## Security

- 不要提交真实 `keys.local.json`
- 仓库仅保留 `keys.local.example.json` 作为结构模板
